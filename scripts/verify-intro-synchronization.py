"""Check presented media/UI synchronization, including late and stalled video."""
import argparse
import asyncio
import json
from pathlib import Path

from playwright.async_api import async_playwright

TRACK = '[data-journey-state]'
MONITOR = """() => {
  window.__introSamples = [];
  window.__introPresented = [];
  window.__introSeeks = 0;
  const video = document.querySelector('[data-role="flow-arrival-video"]');
  video.addEventListener('seeking', () => window.__introSeeks++);
  const present = (now, metadata) => {
    window.__introPresented.push({now, time:metadata.mediaTime});
    if (window.__introPresented.length < 400) video.requestVideoFrameCallback(present);
  };
  video.requestVideoFrameCallback(present);
  const sample = () => {
    const track = document.querySelector('[data-journey-state]');
    const card = document.querySelector('[data-story-index="0"]');
    const layer = document.querySelector('.scene-video-layer[data-scene="campus"]');
    window.__introSamples.push({now:performance.now(), p:Number(track.dataset.journeyProgress),
      state:track.dataset.journeyState, time:video.currentTime, presented:Number(video.dataset.presentedTime || 0),
      rate:video.playbackRate, card:card ? Number(getComputedStyle(card).opacity) : 0,
      visible:layer?.dataset.visible === 'true', fallback:video.parentElement.dataset.fallback === 'true'});
    if (window.__introSamples.length < 1000) requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
}"""


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://localhost:3000')
    parser.add_argument('--output', type=Path, default=Path('artifacts/runtime-qa/smooth-intro'))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    checks, evidence, errors = [], {}, []
    def record(name, okay, **details):
        checks.append(dict(id=name, passed=bool(okay), **details))

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for label, size in [('desktop', (1440, 900)), ('mobile', (390, 844)), ('slow-load', (1440, 900)), ('stalled', (1440, 900)), ('play-rejected', (390, 844))]:
            context = await browser.new_context(viewport=dict(width=size[0], height=size[1]))
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            release = asyncio.Event()
            requested = asyncio.Event()
            if label == 'slow-load':
                async def delay_video(route):
                    requested.set()
                    await release.wait()
                    await route.continue_()
                await page.route('**/*arrival-v2.mp4', delay_video)
            if label == 'play-rejected':
                await page.add_init_script("""(() => {
                  const play = HTMLMediaElement.prototype.play;
                  HTMLMediaElement.prototype.play = function() {
                    if (this.dataset.role === 'flow-arrival-video') return Promise.reject(new DOMException('Test playback rejection', 'NotAllowedError'));
                    return play.call(this);
                  };
                })()""")
            await page.goto(args.base_url, wait_until='domcontentloaded')
            await page.wait_for_selector(TRACK)
            await page.wait_for_selector('[data-role="flow-arrival-video"]', state='attached')
            if label != 'slow-load':
                await page.wait_for_function("() => document.querySelector('[data-role=\"flow-arrival-video\"]').readyState >= 3")
            else:
                await requested.wait()
            await page.evaluate(MONITOR)
            await page.mouse.move(size[0] * .8, size[1] * .9)
            await page.mouse.wheel(0, 100)
            if label == 'slow-load':
                await page.wait_for_timeout(1700)
                waiting = await page.locator(TRACK).evaluate('(e) => ({p:Number(e.dataset.journeyProgress),state:e.dataset.journeyState})')
                record('slow-load:holds-invitation-until-buffered', waiting['p'] < .001 and waiting['state'] == 'preparing', observed=waiting)
                release.set()
            if label == 'stalled':
                await page.wait_for_function("() => Number(document.querySelector('[data-role=\"flow-arrival-video\"]').dataset.presentedTime || 0) > .25")
                await page.locator('[data-role="flow-arrival-video"]').evaluate('(e) => e.pause()')
                await page.wait_for_timeout(100)
                before = float(await page.locator(TRACK).get_attribute('data-journey-progress'))
                await page.wait_for_timeout(1700)
                after = float(await page.locator(TRACK).get_attribute('data-journey-progress'))
                record('stalled:no-timer-forces-arrival', abs(before - after) < .001 and after < .205,
                       before=before, after=after)
                record('stalled:card-remains-hidden', await page.locator('[data-story-index="0"]').count() == 0)
                await page.screenshot(path=str(args.output / 'stalled-during-playback.png'))
                await page.locator('[data-role="flow-arrival-video"]').evaluate('(e) => e.play()')
            await page.wait_for_function("""() => {
              const e = document.querySelector('[data-journey-state]');
              return e.dataset.journeyState === 'idle' && Math.abs(Number(e.dataset.journeyProgress) - .22) < .001;
            }""", timeout=15000)
            await page.wait_for_timeout(200)
            samples = await page.evaluate('window.__introSamples')
            presented = await page.evaluate('window.__introPresented')
            seeks = await page.evaluate('window.__introSeeks')
            evidence[label] = dict(samples=samples, presented=presented, seeks=seeks)
            visible_cards = [s for s in samples if s['card'] > .05]
            record(label + ':card-only-after-arrival', bool(visible_cards) and all(s['fallback'] or s['presented'] >= 1.17 for s in visible_cards))
            record(label + ':correct-background-layer-at-arrival', bool(visible_cards) and all(s['visible'] for s in visible_cards))
            record(label + ':playback-at-normal-speed', all(s['rate'] == 1 for s in samples))
            record(label + ':no-repeated-seeking', seeks <= 1, seeking_events=seeks)
            if label == 'play-rejected':
                record(label + ':fallback-destination-visible', await page.locator('[data-role="flow-arrival"]').get_attribute('data-fallback') == 'true')
            else:
                middle = [f for f in presented if .02 < f['time'] < 1.17]
                record(label + ':intermediate-frames-presented', len(middle) >= 10, presented_frames=len(middle))
                gaps = [b['now'] - a['now'] for a,b in zip(middle,middle[1:])]
                evidence[label]['maximum_presented_frame_gap_ms'] = max(gaps, default=0)
                evidence[label]['presented_frame_count'] = len(middle)
                if label in ['desktop', 'mobile']:
                    record(label + ':no-long-presentation-freeze', max(gaps, default=0) < 250,
                           max_frame_gap_ms=max(gaps, default=0))
            await page.screenshot(path=str(args.output / f'{label}-arrived.png'))
            await context.close()
        await browser.close()
    record('no-page-errors', not errors, errors=errors)
    result = dict(passed=all(c['passed'] for c in checks), checks=checks,
                  limitations=['Headless Chromium; presentation callback timings are local diagnostics, not physical-device FPS.'])
    (args.output / 'report.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (args.output / 'presentation-evidence.json').write_text(json.dumps(evidence, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(dict(passed=result['passed'], checks=len(checks), failed=[c for c in checks if not c['passed']]), ensure_ascii=True))
    return 0 if result['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(asyncio.run(main()))

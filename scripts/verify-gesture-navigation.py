"""Exercise real wheel/swipe input; do not submit guest data."""
import argparse
import json
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

TRACK = '[data-journey-state]'


def progress(page):
    return float(page.locator(TRACK).get_attribute('data-journey-progress'))


def settled(page, value):
    page.wait_for_function("""p => {
      const e = document.querySelector('[data-journey-state]');
      return e?.dataset.journeyState === 'idle' && Math.abs(Number(e.dataset.journeyProgress) - p) < .001;
    }""", arg=value, timeout=15000)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://localhost:3000')
    parser.add_argument('--output', type=Path, default=Path('artifacts/runtime-qa/gesture-navigation'))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    checks, errors, failures = [], [], []
    def record(name, ok, **evidence):
        checks.append(dict(id=name, passed=bool(ok), **evidence))
        (args.output / 'partial.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2), encoding='utf-8')
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        for label, width, height in [('desktop', 1440, 900), ('mobile', 390, 844)]:
            context = browser.new_context(viewport=dict(width=width, height=height), has_touch=label == 'mobile')
            page = context.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('response', lambda r: failures.append(dict(status=r.status, url=r.url)) if r.status >= 400 and r.url.startswith(args.base_url) else None)
            page.goto(args.base_url, wait_until='domcontentloaded')
            page.wait_for_selector(TRACK)
            page.wait_for_function("() => document.querySelector('[data-role=\"flow-arrival-video\"]')?.readyState >= 2")
            page.wait_for_timeout(800)
            page.mouse.move(width * .8, height * .9)
            # An open RSVP must not consume a navigation gesture.
            page.get_by_role('button', name='Mình sẽ có mặt').click()
            page.get_by_role('dialog', name='Xác nhận tham dự').wait_for()
            page.mouse.wheel(0, 120)
            page.wait_for_timeout(300)
            record(label + ':modal-blocks-navigation', progress(page) < .001)
            page.keyboard.press('Escape')
            page.wait_for_timeout(250)
            page.mouse.move(width * .8, height * .9)
            page.screenshot(path=str(args.output / f'{label}-before.png'))
            page.evaluate("""() => {
              window.__approachFrames = [];
              const video = document.querySelector('[data-role="flow-arrival-video"]');
              const sample = (_, metadata) => {
                window.__approachFrames.push(metadata.mediaTime);
                if (window.__approachFrames.length < 400) video.requestVideoFrameCallback(sample);
              };
              video.requestVideoFrameCallback(sample);
            }""")
            # Exactly ONE real wheel event must run the entire approach.
            started = time.monotonic()
            page.mouse.wheel(0, 100)
            page.wait_for_timeout(100)
            transforms = page.locator('.invitation-overlay').evaluate("""e => ({
              left: new DOMMatrix(getComputedStyle(e.querySelector('.invitation-copy')).transform).m41,
              right: new DOMMatrix(getComputedStyle(e.querySelector('.portrait-composition')).transform).m41
            })""") if page.locator('.invitation-overlay').count() else None
            record(label + ':panels-open-opposite-directions', transforms and transforms['left'] < 0 and transforms['right'] > 0, transforms=transforms)
            page.screenshot(path=str(args.output / f'{label}-opening.png'))
            page.wait_for_timeout(350)
            video = page.locator('[data-role="flow-arrival-video"]')
            state = video.evaluate('(e) => ({time:e.currentTime, paused:e.paused, rate:e.playbackRate, opacity:getComputedStyle(e).opacity})')
            samples = page.evaluate('window.__approachFrames')
            record(label + ':native-approach-playing', state['time'] > .1 and state['opacity'] == '1'
                   and any(.05 < t < 7.5 for t in samples), video=state, presented_media_times=samples)
            page.screenshot(path=str(args.output / f'{label}-travel.png'))
            settled(page, .22)
            duration = time.monotonic() - started
            record(label + ':one-wheel-reaches-Nam1', abs(progress(page) - .22) < .001, wall_seconds=duration)
            record(label + ':arrival-fast', duration < 3)
            record(label + ':first-card-visible', page.locator('[data-story-index="0"]').is_visible())
            page.wait_for_timeout(500)
            record(label + ':stays-at-Nam1', abs(progress(page) - .22) < .001)
            record(label + ':S02-playing', page.locator('[data-role="stop-ambience"]').evaluate('(e) => !e.paused && e.currentSrc.includes("/videos/flow/s02-")'))
            page.screenshot(path=str(args.output / f'{label}-arrived.png'))
            # A fresh gesture starts the next stop; no extra intermediate stop.
            page.mouse.wheel(0, 100)
            settled(page, .265)
            record(label + ':next-wheel-Nam2', page.locator('[data-story-index="1"]').is_visible())
            page.wait_for_timeout(250)
            page.mouse.wheel(0, -100)
            settled(page, .22)
            page.wait_for_timeout(250)
            page.mouse.wheel(0, -100)
            settled(page, 0)
            record(label + ':reverse-to-invitation', page.get_by_role('button', name='Mình sẽ có mặt').is_visible())
            # A continuous train of touchpad events spans and outlasts the flight.
            page.wait_for_timeout(250)
            for _ in range(44):
                page.mouse.wheel(0, 24)
                page.wait_for_timeout(35)
            page.wait_for_timeout(250)
            record(label + ':inertia-does-not-skip-Nam1', abs(progress(page) - .22) < .001, progress=progress(page))
            # Image modal must retain the current memory and close on Escape.
            page.locator('[data-story-index="0"] article').focus()
            page.keyboard.press('Enter')
            page.locator('[role="dialog"]').wait_for()
            page.mouse.wheel(0, 100)
            page.wait_for_timeout(250)
            record(label + ':memory-modal-blocks-navigation', abs(progress(page) - .22) < .001)
            page.keyboard.press('Escape')
            page.keyboard.press('Home')
            settled(page, 0)
            page.get_by_role('button', name='Khám phá hành trình').click()
            settled(page, .22)
            record(label + ':explore-button-same-destination', abs(progress(page) - .22) < .001)
            page.keyboard.press('Home')
            settled(page, 0)
            page.keyboard.press('PageDown')
            settled(page, .22)
            record(label + ':keyboard-one-step', abs(progress(page) - .22) < .001)
            if label == 'mobile':
                page.keyboard.press('Home')
                settled(page, 0)
                cdp = context.new_cdp_session(page)
                cdp.send('Input.dispatchTouchEvent', {'type':'touchStart', 'touchPoints':[{'x':190,'y':730}]})
                for y in [705, 660, 600, 540]:
                    cdp.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':[{'x':190,'y':y}]})
                    page.wait_for_timeout(20)
                cdp.send('Input.dispatchTouchEvent', {'type':'touchEnd', 'touchPoints':[]})
                settled(page, .22)
                page.wait_for_timeout(400)
                record('mobile:one-swipe-one-stop', abs(progress(page) - .22) < .001)
            record(label + ':no-horizontal-overflow', page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
            context.close()
        context = browser.new_context(viewport=dict(width=390, height=844), reduced_motion='reduce')
        page = context.new_page()
        page.goto(args.base_url, wait_until='domcontentloaded')
        page.wait_for_selector(TRACK)
        page.wait_for_timeout(500)
        page.mouse.wheel(0, 100)
        settled(page, .22)
        record('reduced-motion:direct-one-step', abs(progress(page) - .22) < .001)
        record('reduced-motion:all-videos-paused', page.locator('video').evaluate_all('(els) => els.every(e => e.paused)'))
        browser.close()
    record('no-page-errors', not errors, errors=errors)
    record('no-failed-local-responses', not failures, failures=failures)
    result = dict(passed=all(c['passed'] for c in checks), checks=checks,
                  limitations=['Headless Chromium. Real wheel events and CDP touch input; no physical touchpad/device measurement.'])
    (args.output / 'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(passed=result['passed'],checks=len(checks),failed=[c for c in checks if not c['passed']]),ensure_ascii=True))
    return 0 if result['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())

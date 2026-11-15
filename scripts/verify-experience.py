"""Read-only browser checks for the local graduation experience.

Requires Python Playwright and its Chromium browser. No RSVP or wish is submitted.
Example: python scripts/verify-experience.py --output artifacts/runtime-qa
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright


def jump(page, progress):
    page.evaluate("""p => {
      const tracks = [...document.querySelectorAll('[data-scene-track]')];
      const el = tracks.find(e => p < Number(e.dataset.progressEnd)) || tracks.at(-1);
      const local = (p - Number(el.dataset.progressStart)) /
        (Number(el.dataset.progressEnd) - Number(el.dataset.progressStart));
      window.scrollTo({top: window.scrollY + el.getBoundingClientRect().top + local * el.offsetHeight,
        behavior: 'instant'});
    }""", progress)
    page.wait_for_timeout(1500)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', default='http://localhost:3000')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    checks, errors, failures = [], [], []

    def record(name, passed, **evidence):
        checks.append(dict(id=name, passed=bool(passed), **evidence))

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for label, width, height in [('desktop', 1440, 900), ('mobile', 390, 844), ('small-mobile', 360, 640)]:
            context = browser.new_context(viewport=dict(width=width, height=height), device_scale_factor=1)
            page = context.new_page()
            travel = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('response', lambda r: failures.append(dict(status=r.status, url=r.url))
                    if r.status >= 400 and r.url.startswith(args.base_url) else None)
            page.on('request', lambda r: travel.append(r.url) if '/travel/' in r.url else None)
            page.goto(args.base_url, wait_until='domcontentloaded', timeout=120000)
            page.get_by_role('button', name='Mình sẽ có mặt').wait_for()
            page.wait_for_timeout(1500)
            page.screenshot(path=str(args.output / f'{label}-00.png'))

            # RSVP locks the story while reading or typing, with keyboard exit.
            page.get_by_role('button', name='Mình sẽ có mặt').click()
            page.get_by_role('dialog', name='Xác nhận tham dự').wait_for()
            record(f'{label}:rsvp-scroll-lock', page.evaluate("document.body.style.overflow === 'hidden'"))
            page.keyboard.press('Escape')
            record(f'{label}:rsvp-escape', page.get_by_role('dialog').count() == 0)

            jump(page, .12)
            record(f'{label}:bounded-warmup', len(travel) <= 20, requests=len(travel))
            jump(page, .19)
            page.wait_for_function("""() => {
              const el = document.querySelector('[data-role="flow-arrival"] canvas');
              return el && Number(el.dataset.renderedFrame) > 0 && Number(el.dataset.renderedFrame) < 180;
            }""", timeout=15000)
            record(f'{label}:downloaded-T01-arrival', page.locator('[data-role="flow-arrival"] canvas').get_attribute('data-camera-scene').startswith('flow-t01-'))
            page.screenshot(path=str(args.output / f'{label}-19-flow-arrival.png'))
            for progress, expected in [(.22, 59), (.265, 85), (.31, 103), (.355, 120)]:
                jump(page, progress)
                canvas = page.locator('[data-camera-scene="scene-02"]')
                page.wait_for_function("""expected => {
                  const el = document.querySelector('[data-camera-scene="scene-02"]');
                  return el && Math.abs(Number(el.dataset.renderedFrame) - expected) < .2;
                }""", arg=expected, timeout=15000)
                before = canvas.get_attribute('data-rendered-frame')
                plate = page.locator('[data-role="stop-ambience"]')
                time_before = plate.evaluate('(el) => el.currentTime')
                page.wait_for_timeout(600)
                record(f'{label}:locked-camera-{expected}', canvas.get_attribute('data-rendered-frame') == before)
                record(f'{label}:living-plate-{expected}', plate.evaluate('(el) => !el.paused && Math.abs(el.currentTime - ' + str(time_before) + ') > .05'))
                if expected == 59:
                    record(f'{label}:downloaded-S02-ambient', '/videos/flow/s02-' in plate.get_attribute('src')
                           and plate.evaluate('(el) => el.muted && el.videoWidth === 1280 && el.videoHeight === 720'))
                    record(f'{label}:T01-held-at-arrival', float(page.locator('[data-role="flow-arrival"] canvas').get_attribute('data-rendered-frame')) == 187)
                record(f'{label}:cache-{expected}', int(canvas.get_attribute('data-decoded-frames')) <= (10 if width < 768 else 16)
                       and int(canvas.get_attribute('data-cached-frames')) <= (24 if width < 768 else 48))
                page.screenshot(path=str(args.output / f'{label}-{round(progress * 100):02}.png'))

            jump(page, .392)
            record(f'{label}:direct-door-entry', page.locator('.door-prompt').count() == 0
                   and page.locator('[data-journey-phase="opening"]').count() == 1
                   and float(page.locator('[data-camera-scene="scene-02"]').get_attribute('data-rendered-frame')) > 120)
            page.screenshot(path=str(args.output / f'{label}-39.png'))
            for progress in [.47, .55, .70, .86, 1.0]:
                jump(page, progress)
                record(f'{label}:no-horizontal-overflow-{progress}', page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'))
                page.screenshot(path=str(args.output / f'{label}-{round(progress * 100):02}.png'))

            # Revisit earlier viewpoints after caches have been evicted.
            for progress, scene in [(.22, 'campus'), (.86, 'wishes'), (.47, 'ceremony'), (.265, 'campus'), (.19, 'campus'), (0, 'hero')]:
                jump(page, progress)
                record(f'{label}:reverse-{progress}', page.locator('.video-scene-background').get_attribute('data-active-scene') == scene)
            context.close()

        context = browser.new_context(viewport=dict(width=390, height=844), reduced_motion='reduce')
        page = context.new_page()
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(args.base_url, wait_until='domcontentloaded', timeout=120000)
        jump(page, .19)
        page.wait_for_function("""() => {
          const el = document.querySelector('[data-role="flow-arrival"] canvas');
          return el && Number(el.dataset.renderedFrame) === 0;
        }""", timeout=15000)
        record('reduced-motion:T01-still-exterior', float(page.locator('[data-role="flow-arrival"] canvas').get_attribute('data-rendered-frame')) == 0)
        jump(page, .22)
        page.wait_for_function("""() => {
          const el = document.querySelector('[data-role="flow-arrival"] canvas');
          return el && Number(el.dataset.renderedFrame) === 187;
        }""", timeout=15000)
        record('reduced-motion:T01-still-arrival', float(page.locator('[data-role="flow-arrival"] canvas').get_attribute('data-rendered-frame')) == 187)
        record('reduced-motion:S02-paused', page.locator('[data-role="stop-ambience"]').evaluate('(el) => el.paused'))
        jump(page, .355)
        page.wait_for_function("""() => {
          const el = document.querySelector('[data-camera-scene="scene-02"]');
          return el && Math.abs(Number(el.dataset.renderedFrame) - 120) < .2;
        }""", timeout=15000)
        frame = page.locator('[data-camera-scene="scene-02"]').get_attribute('data-rendered-frame')
        jump(page, .392)
        record('reduced-motion:still-door', frame == page.locator('[data-camera-scene="scene-02"]').get_attribute('data-rendered-frame'))
        record('reduced-motion:paused-video', page.locator('video').evaluate_all('(els) => els.every(el => el.paused)'))
        page.screenshot(path=str(args.output / 'reduced-motion.png'))
        browser.close()

    record('no-page-errors', not errors, errors=errors)
    record('no-failed-local-responses', not failures, responses=failures)
    report = dict(base_url=args.base_url, passed=all(c['passed'] for c in checks), checks=checks,
                  limitations=['Headless Chromium; no physical-device FPS or GPU measurement.',
                               'No valid guest data was submitted.',
                               'Flow MP4s were supplied by the user; see the separate media review for source quality and provenance.'])
    (args.output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(dict(passed=report['passed'], checks=len(checks), failed=[c for c in checks if not c['passed']], output=str(args.output.resolve())), ensure_ascii=False))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())

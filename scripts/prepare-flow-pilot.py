"""Import the user's two Flow downloads without altering their original files.

Build muted web copies, a seekable T01 sequence, and short gesture trip files.
No architectural edits, generated scenery, or edits to source downloads.
Run from the repository root: python scripts/prepare-flow-pilot.py
"""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys

import cv2

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'VEO3_PRODUCTION_KIT'
REVIEW = KIT / '04_HANDOFF/flow-download-review-2026-11-15.json'
REVIEWED_SOURCES = {
    'T01': '2f97506d4b023cac7b4bb69ebeed206e5fb1c7d64af39310d4ee9e91e77b6949',
    'S02': 'b5b7ed0cc991760535e11effb0c6b7ae35eddbf5c6660a5e4a70dde0326fc857',
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    definitions = {
        'T01': ('Camera_approach*.mp4', '02_TRANSITIONS/T01_S01_TO_S02/OUTPUT/T01_S01_TO_S02.mp4'),
        'S02': ('Generating_architectural*.mp4', '01_STOPS/S02_MEMORY_YEAR_1/OUTPUT/S02_AMBIENT.mp4'),
    }
    sources = {}
    for label, (pattern, canonical) in definitions.items():
        matches = list((ROOT / 'data').glob(pattern))
        if len(matches) != 1:
            raise ValueError(f'Expected exactly one {label} source matching {pattern}')
        path = matches[0]
        probe = json.loads(subprocess.check_output([
            'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)
        ], encoding='utf-8'))
        video = next(s for s in probe['streams'] if s['codec_type'] == 'video')
        num, den = map(int, video['avg_frame_rate'].split('/'))
        fps = num / den
        if video['width'] < 1280 or video['height'] < 720 or abs(fps - 24) > .01:
            raise ValueError(f'Unexpected source format for {label}')
        sources[label] = dict(path=path, canonical=KIT / canonical, sha256=digest(path), fps=fps)

    manifest = {}
    review = dict(provenance='User downloaded these MP4s from Flow and placed them in data; model identity is not certified by file metadata.',
                  integration='local website pilot', sources={}, original_files_preserved=True,
                  web_processing='1280x720 H.264, audio removed; native 24fps frames for manual seeking. Short gesture trips sample original frames into 1.2s at 60fps with eased timing. Original downloads remain unchanged.',
                  decisions={
                      'S02': dict(decision='accepted_for_web_pilot', notes='Stable architecture and closed door, subtle particles. Review sampled frame registration and the loop in browser.'),
                      'T01': dict(decision='preview_only_regenerate_for_final', actual_motion_window_seconds=[0, 187 / 24], notes='Camera moves across almost the whole clip, rather than only 2.5–4.5s. An additional rounded navy arch appears before the supplied entrance. Use the entire approach for the web test; do not cut blindly to 2.5–4.5s.'),
                  }, limitations=['Later memory backgrounds and routes remain the previous sources.'])

    for label, source in sources.items():
        fingerprint = source['sha256'][:12]
        canonical = source['canonical']
        if canonical.exists() and digest(canonical) != source['sha256']:
            backup = KIT / '04_HANDOFF/FLOW_RETRY_2026-11-15/BEFORE_DOWNLOADED_MP4' / f'{label}-{digest(canonical)[:12]}.mp4'
            backup.parent.mkdir(parents=True, exist_ok=True)
            if not backup.exists():
                shutil.copy2(canonical, backup)
        canonical.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source['path'], canonical)

        web = ROOT / f'public/videos/flow/{label.lower()}-{fingerprint}.mp4'
        web.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source['path']),
                        '-map', '0:v:0', '-an', '-vf', 'scale=1280:720:flags=lanczos',
                        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart', str(web)], check=True)

        capture = cv2.VideoCapture(str(source['path']))
        count = 0
        directory_id = f'flow-t01-{fingerprint}'
        directory = ROOT / 'public/travel' / directory_id
        if label == 'T01':
            directory.mkdir(parents=True, exist_ok=True)
        while True:
            okay, frame = capture.read()
            if not okay:
                break
            small = cv2.resize(frame, (1280, 720), interpolation=cv2.INTER_AREA)
            if label == 'T01':
                target = directory / f'frame-{count:03}.webp'
                if not cv2.imwrite(str(target), small, [cv2.IMWRITE_WEBP_QUALITY, 82]):
                    raise RuntimeError(f'Failed to write {target}')
            elif count == 0:
                cv2.imwrite(str(web.with_suffix('.webp')), small, [cv2.IMWRITE_WEBP_QUALITY, 90])
            count += 1
        capture.release()
        if count < 180:
            raise ValueError(f'Truncated {label} video: {count} decoded frames')
        review['sources'][label] = dict(file=source['path'].relative_to(ROOT).as_posix(),
                                       canonical=canonical.relative_to(KIT).as_posix(),
                                       sha256=source['sha256'], frames=count, fps=source['fps'],
                                       duration_seconds=count / source['fps'], web_url='/' + web.relative_to(ROOT / 'public').as_posix(),
                                       web_bytes=web.stat().st_size)
        if label == 'T01':
            manifest['transition'] = dict(frameDirectory=directory_id, frameCount=count, fps=source['fps'],
                                          lastFrameTime=(count - 1) / source['fps'],
                                          poster=f'/travel/{directory_id}/frame-000.webp',
                                          video=review['sources'][label]['web_url'])
            review['sources'][label]['frame_bytes'] = sum(p.stat().st_size for p in directory.glob('frame-*.webp'))
        else:
            manifest['ambient'] = dict(src=review['sources'][label]['web_url'],
                                       poster='/' + web.with_suffix('.webp').relative_to(ROOT / 'public').as_posix())

    (ROOT / 'src/config/flowPilotMedia.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    subprocess.run([sys.executable, str(ROOT / 'scripts/prepare-intro-transition.py')], check=True)
    manifest = json.loads((ROOT / 'src/config/flowPilotMedia.json').read_text(encoding='utf-8'))
    diagnostics = ROOT / 'artifacts/flow-media-review-2026-11-15/media-analysis.json'
    if diagnostics.exists():
        data = json.loads(diagnostics.read_text(encoding='utf-8'))
        if all(data[label]['sha256'] == source['sha256'] for label, source in sources.items()):
            review['diagnostics'] = {
                'S02_loop_endpoint_mae_normalized': data['S02']['loop_endpoint_mae_normalized'],
                'T01_to_S02_endpoint_mae_normalized': data['S02']['T01_end_to_S02_start_mae_normalized'],
                'S02_sampled_registration': data['S02']['registration_from_first_frame'],
                'method': 'Decoded all frames; inspected a 0.5s visual timeline and endpoint frames. Registration is supporting evidence, not automatic visual acceptance.',
            }
    for label, source in sources.items():
        if source['sha256'] != REVIEWED_SOURCES[label]:
            review['decisions'][label] = dict(decision='visual_review_pending', actual_motion_window_seconds=None,
                                              notes='New source hash: previous visual approval and motion window do not apply.')
    REVIEW.write_text(json.dumps(review, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    reviews_path = KIT / '04_HANDOFF/reviews.json'
    reviews = json.loads(reviews_path.read_text(encoding='utf-8'))
    for label, task in [('S02', 'S02_AMBIENT'), ('T01', 'T01_S01_TO_S02')]:
        approved = label == 'S02' and sources[label]['sha256'] == REVIEWED_SOURCES[label]
        reviews[task] = dict(accepted=approved, video_sha256=sources[label]['sha256'],
                             review_decision=review['decisions'][label]['decision'],
                             actual_motion_window_seconds=review['decisions'][label].get('actual_motion_window_seconds'),
                             notes=review['decisions'][label]['notes'])
    reviews_path.write_text(json.dumps(reviews, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(dict(runtime=manifest, review=str(REVIEW), source_frames={k:v['frames'] for k,v in review['sources'].items()}), ensure_ascii=True))


if __name__ == '__main__':
    main()

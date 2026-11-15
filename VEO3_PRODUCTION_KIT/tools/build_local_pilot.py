"""Render a LOCAL alternative to the failed Veo pilot. No API or Flow calls.

S01 uses the supplied camera-locked Veo clip with a short atmospheric loop seam.
S02 is a fixed reference plate with procedural, forward cyclic dust animation.
T01 reuses original scene-02 frames 0..59, never the rejected generated lobby.
Only the tiny upper-right UI region uses imagegen cleanup. Other pixels retain
the supplied imagery. Existing provenance marks and original files are retained.
"""
import argparse
from functools import lru_cache
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

import cv2
import numpy as np

KIT = Path(__file__).resolve().parents[1]
PROJECT = KIT.parent
W, H, FPS, COUNT = 1280, 720, 24, 192


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def image(path):
    frame = cv2.imread(str(path))
    if frame is None:
        raise FileNotFoundError(path)
    return cv2.resize(frame, (W, H), interpolation=cv2.INTER_AREA)


def cleanup_patch(original, generated):
    # Register the generated patch source, then composite ONLY the UI region
    # during video rendering; no canonical reference PNG is changed.
    sift = cv2.SIFT_create(nfeatures=1500)
    ka, da = sift.detectAndCompute(cv2.cvtColor(generated, cv2.COLOR_BGR2GRAY), None)
    kb, db = sift.detectAndCompute(cv2.cvtColor(original, cv2.COLOR_BGR2GRAY), None)
    pairs = cv2.BFMatcher().knnMatch(da, db, k=2)
    good = [a for a, b in pairs if a.distance < .65 * b.distance]
    if len(good) < 30:
        raise RuntimeError('Cleanup image could not be registered to its source.')
    a = np.float32([ka[m.queryIdx].pt for m in good])
    b = np.float32([kb[m.trainIdx].pt for m in good])
    matrix, inliers = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=2)
    if matrix is None or int(inliers.sum()) < 25:
        raise RuntimeError('Unreliable cleanup registration.')
    aligned = cv2.warpAffine(generated, matrix, (W, H), borderMode=cv2.BORDER_REFLECT)
    mask = np.zeros((H, W), np.float32)
    mask[13:91, 1192:1267] = 1
    mask = cv2.GaussianBlur(mask, (0, 0), 4)[..., None]
    return aligned.astype(np.float32), mask


def apply_patch(frame, patch):
    clean, mask = patch
    return frame.astype(np.float32) * (1 - mask) + clean * mask


def particles():
    rng = np.random.default_rng(20261115)
    result = []
    for i in range(16):
        x = rng.uniform(50, 405) if i % 2 == 0 else rng.uniform(875, 1230)
        result.append((x, rng.uniform(90, 640), rng.uniform(10, 27),
                       rng.uniform(6, 17), rng.uniform(0, 2 * np.pi), rng.uniform(.18, .34)))
    return result


DUST = particles()


def atmosphere(frame, phase):
    overlay = np.zeros((H, W), np.float32)
    angle = phase * 2 * np.pi
    for x, y, rx, ry, offset, strength in DUST:
        # An orbit moves continuously in one direction and returns exactly to
        # its initial position. There is no reversed or ping-pong video playback.
        px = int(round(x + rx * np.cos(angle + offset)))
        py = int(round(y + ry * np.sin(angle + offset)))
        cv2.circle(overlay, (px, py), 1, float(strength), -1, lineType=cv2.LINE_AA)
    glow = cv2.GaussianBlur(overlay, (0, 0), 2.2)
    alpha = np.minimum(.5, overlay + glow * 2)[..., None]
    gold_bgr = np.array([150, 205, 248], np.float32)
    return np.clip(frame * (1 - alpha) + gold_bgr * alpha, 0, 255).astype(np.uint8)


def encoder(ffmpeg, path, delogo=False):
    args = [ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo',
            '-pixel_format', 'bgr24', '-video_size', f'{W}x{H}', '-framerate', str(FPS), '-i', '-']
    if delogo:
        args += ['-vf', 'delogo=x=1207:y=24:w=54:h=58:show=0']
    return subprocess.Popen(args + ['-an', '-c:v', 'libx264', '-preset', 'medium',
        '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(path)], stdin=subprocess.PIPE)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=KIT / '05_LOCAL_REBUILD/PILOT_V1')
    args = parser.parse_args()
    out = args.output.resolve()
    if not out.is_relative_to(KIT):
        raise ValueError('Output must stay inside the production kit.')
    ffmpeg = shutil.which('ffmpeg')
    if not ffmpeg:
        raise RuntimeError('FFmpeg must be installed.')
    names = ['S01_AMBIENT_LOCAL.mp4', 'S02_AMBIENT_LOCAL.mp4', 'T01_S01_TO_S02_LOCAL.mp4']
    for name in names + ['T01_WEB_1.15s.mp4', 'PILOT_PREVIEW.mp4']:
        if (out / name).exists():
            raise FileExistsError('Use a new version directory: ' + str(out / name))
    ref1 = KIT / '01_STOPS/S01_INVITATION/REFERENCE.png'
    ref2 = KIT / '01_STOPS/S02_MEMORY_YEAR_1/REFERENCE.png'
    src1 = KIT / '01_STOPS/S01_INVITATION/OUTPUT/S01_AMBIENT.mp4'
    native = cv2.VideoCapture(str(src1))
    okay, first = native.read()
    if not okay:
        raise RuntimeError('Cannot read S01 source video.')
    first = cv2.resize(first, (W, H))
    patch1 = cleanup_patch(image(ref1), image(out / 'inputs/S01_UI_CLEANUP_SOURCE.png'))
    patch2 = cleanup_patch(image(ref2), image(out / 'inputs/S02_UI_CLEANUP_SOURCE.png'))
    start = apply_patch(first, patch1)
    end = apply_patch(image(ref2), patch2)

    @lru_cache(maxsize=8)
    def travel(index):
        return image(PROJECT / f'public/travel/scene-02/frame-{index:03}.webp').astype(np.float32)

    for name in names:
        partial = out / (name.removesuffix('.mp4') + '.partial.mp4')
        process = encoder(ffmpeg, partial, delogo=name.startswith('T01'))
        last_read, current = 0, first
        try:
            for n in range(COUNT):
                phase = n / (COUNT - 1)
                if name.startswith('S01'):
                    source_index = int(round(phase * 189))
                    while last_read < source_index:
                        okay, current = native.read()
                        if not okay:
                            raise RuntimeError('Unexpected end of S01 source.')
                        last_read += 1
                    frame = apply_patch(current, patch1)
                    # Only the original atmosphere varies; its source camera is
                    # already locked. A short seam blend closes that atmosphere.
                    seam = max(0, (n - (COUNT - 16)) / 15)
                    seam = seam * seam * (3 - 2 * seam)
                    frame = frame * (1 - seam) + start * seam
                elif name.startswith('S02'):
                    frame = end
                else:
                    t = n / FPS
                    if t < 2.5:
                        frame = start
                    elif t >= 4.5:
                        frame = end
                    else:
                        u = (t - 2.5) / 2
                        eased = u * u * (3 - 2 * u)
                        frame = travel(int(round(eased * 59)))
                process.stdin.write(atmosphere(frame, phase).tobytes())
        finally:
            process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError('Encode failed: ' + name)
        partial.replace(out / name)
        print('Rendered: ' + name, flush=True)
    native.release()

    # Web timing is derived from the actual local camera window, not an 8x speedup.
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-ss', '2.5', '-t', '2',
        '-i', str(out / names[2]), '-vf', 'setpts=0.575*(PTS-STARTPTS),fps=30', '-frames:v', '35',
        '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', str(out / 'T01_WEB_1.15s.mp4')], check=True)
    graph = '[0:v]setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];[2:v]setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0,fps=30[out]'
    subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y',
        '-i', str(out / names[0]), '-i', str(out / 'T01_WEB_1.15s.mp4'), '-i', str(out / names[1]),
        '-filter_complex', graph, '-map', '[out]', '-an', '-c:v', 'libx264', '-preset', 'medium',
        '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out / 'PILOT_PREVIEW.mp4')], check=True)
    sources = [ref1, ref2, src1] + [PROJECT / f'public/travel/scene-02/frame-{i:03}.webp' for i in range(60)]
    report = dict(status='rendered_local_candidates_pending_review', generator='local_processing_not_new_veo_generation',
        frame_size=[W, H], fps=FPS, source_duration_seconds=8,
        actual_camera_motion_window_seconds=[2.5, 4.5],
        originals_preserved=True, canonical_references_changed=False,
        methods={'S01':'Existing native Veo ambient, localized imagegen UI patch, atmospheric seam blend.',
                 'S02':'Locked original reference, localized imagegen UI patch, procedural cyclic gold dust.',
                 'T01':'Reuses original scene-02 frames 0..59 with eased timing and a localized UI delogo video filter; no new invented room or architectural dissolve.'},
        imagegen_mode='built_in_image_edit',
        sources=[dict(file=str(path.relative_to(PROJECT)).replace('\\', '/'), sha256=digest(path)) for path in sources],
        files=[dict(file=name, sha256=digest(out / name), bytes=(out / name).stat().st_size)
               for name in names + ['T01_WEB_1.15s.mp4', 'PILOT_PREVIEW.mp4']],
        limitations=['The original camera route is reused and retains its original geometry/AI artifacts.',
                     'No claim of a newly generated Veo clip or reconstructed true 3D environment.',
                     'This does not activate the remaining 12 production-kit clips.'])
    (out / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Preview: ' + str(out / 'PILOT_PREVIEW.mp4'))


if __name__ == '__main__':
    main()

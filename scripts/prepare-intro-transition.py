"""Encode short, normal-speed camera trips from the user's original Flow MP4.

Sample original frames with eased timing at 60 fps; do not change architecture,
invent intermediate frames, or edit either original download.
"""
from pathlib import Path
import hashlib
import json
import subprocess

import cv2

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'src/config/flowPilotMedia.json'
FPS, COUNT = 60, 72


def main():
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    source = ROOT / 'public' / manifest['transition']['video'].lstrip('/')
    digest = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
    capture = cv2.VideoCapture(str(source))
    frames = []
    while True:
        okay, frame = capture.read()
        if not okay:
            break
        frames.append(frame)
    capture.release()
    if len(frames) != manifest['transition']['frameCount']:
        raise ValueError('Incomplete transition source')
    paths = {}
    for name, backwards in [('arrival', False), ('return', True)]:
        target = ROOT / f'public/videos/flow/t01-{digest}-{name}-v2.mp4'
        process = subprocess.Popen([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo',
            '-pixel_format', 'bgr24', '-video_size', '1280x720', '-framerate', str(FPS),
            '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21',
            '-g', '12', '-keyint_min', '12', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(target),
        ], stdin=subprocess.PIPE)
        for i in range(COUNT):
            t = i / (COUNT - 1)
            eased = t * t * (3 - 2 * t)
            if backwards:
                eased = 1 - eased
            process.stdin.write(frames[round(eased * (len(frames) - 1))].tobytes())
        process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError('Transition encode failed')
        paths[name + 'Video'] = '/' + target.relative_to(ROOT / 'public').as_posix()
    poster = ROOT / f'public/videos/flow/t01-{digest}-arrival.webp'
    cv2.imwrite(str(poster), frames[-1], [cv2.IMWRITE_WEBP_QUALITY, 92])
    paths.update(arrivalPoster='/' + poster.relative_to(ROOT / 'public').as_posix(),
                 playbackSeconds=COUNT / FPS, playbackFps=FPS, playbackFrames=COUNT)
    manifest['transition'].update(paths)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(dict(source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                          source_frames=len(frames), derived=paths,
                          bytes={key: (ROOT/'public'/url.lstrip('/')).stat().st_size
                                 for key, url in paths.items() if key.endswith('Video')})))


if __name__ == '__main__':
    main()

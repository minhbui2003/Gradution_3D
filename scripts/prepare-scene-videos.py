"""Prepare scene entrances, ambient loops, and seek-friendly campus/door videos.

Usage: python scripts/prepare-scene-videos.py --source <extracted-archive-folder>
Requires imageio-ffmpeg (or --ffmpeg pointing at an existing FFmpeg executable).
"""
import argparse
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--output', type=Path, default=Path('public/videos'))
parser.add_argument('--ffmpeg')
args = parser.parse_args()
if args.ffmpeg:
    ffmpeg = args.ffmpeg
else:
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
args.output.mkdir(parents=True, exist_ok=True)
manifest = {'source': 'Graduation_Videos.rar', 'playback': 'Ambient scenes play independently. Campus and the doorway use scroll-driven camera positions.', 'scenes': []}
for number in range(1, 6):
    name = f'scene-{number:02}'
    source = args.source / f'{name}.mp4'
    if not source.is_file():
        raise FileNotFoundError(source)
    common = [ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(source)]
    encoding = ['-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
    subprocess.run(common + ['-vf', 'scale=1280:720,setsar=1'] + encoding + [str(args.output / f'{name}-entry.mp4')], check=True)
    if number in (2, 3):
        subprocess.run(common + ['-vf', 'scale=1280:720,setsar=1'] + encoding + ['-g', '6', '-keyint_min', '6', '-sc_threshold', '0', str(args.output / f'{name}-path.mp4')], check=True)
    # Tail footage excludes doors, passageways and the entrance camera movement.
    # Start with the last frame in reverse, then return forward to that same frame:
    # entrance -> ambient and every loop boundary have matching images.
    graph = '[0:v]trim=start=4.5,setpts=PTS-STARTPTS,scale=1280:720,setsar=1,split[a][b];[a]reverse,setpts=PTS-STARTPTS[r];[b]setpts=PTS-STARTPTS[f];[r][f]concat=n=2:v=1:a=0[out]'
    subprocess.run(common + ['-filter_complex', graph, '-map', '[out]'] + encoding + [str(args.output / f'{name}-ambient.mp4')], check=True)
    scene_entry = {'id': name, 'entrance': f'/videos/{name}-entry.mp4', 'ambient': f'/videos/{name}-ambient.mp4', 'ambientSourceStartSeconds': 4.5, 'ambientStrategy': 'reverse-then-forward tail, matching endpoints', 'width': 1280, 'height': 720, 'fps': 24}
    if number in (2, 3):
        scene_entry['scrollPath'] = f'/videos/{name}-path.mp4'
    manifest['scenes'].append(scene_entry)
    print(f'Prepared {name}', flush=True)
(args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')

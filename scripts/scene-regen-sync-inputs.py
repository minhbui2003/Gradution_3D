"""Synchronize only user-created PNGs inside the independent regeneration kit."""
from pathlib import Path
import hashlib
import json
import struct

ROOT = Path(__file__).resolve().parents[1]


def safe(value):
    path = (ROOT / value).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError('Path escapes regeneration kit')
    return path


def main():
    manifest = json.loads((ROOT/'MANIFEST.json').read_text(encoding='utf-8'))
    available = {}
    for scene in manifest['scenes']:
        image = safe(scene['input'])
        if not image.exists():
            continue
        content = image.read_bytes()
        if content[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError('Expected real PNG: '+scene['input'])
        width,height = struct.unpack('>II', content[16:24])
        if width < 1280 or height < 720 or abs(width/height - 16/9) > .025:
            raise ValueError('Expected 16:9 and at least 1280x720: '+scene['input'])
        if hashlib.sha256(content).hexdigest() == hashlib.sha256(safe(scene['composition_reference']).read_bytes()).hexdigest():
            raise ValueError('INPUT is just the marked composition reference: '+scene['id'])
        available[scene['id']] = content
    updated, waiting = [], []
    for move in manifest['transitions']:
        a,b = move['source'],move['destination']
        if a not in available or b not in available:
            waiting.append(move['id'])
            continue
        safe(move['first_input']).write_bytes(available[a])
        safe(move['last_input']).write_bytes(available[b])
        updated.append(move['id'])
    report=dict(new_inputs_present=list(available),updated_transitions=updated,waiting_transitions=waiting,
                visual_review_still_required=True,
                note='Checks file type, size and accidental use of old reference; cannot automatically certify absence of logos or tool-added marks.')
    (ROOT/'INPUT_STATUS.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=True))


if __name__ == '__main__':
    main()

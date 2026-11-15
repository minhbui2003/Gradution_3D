"""Synchronize approved scene PNGs to transition endpoints; never touch the website.

This file works at scripts/scene-regen-sync-inputs.py (source template)
and at 06_REGEN_SCENES/tools/sync_inputs.py (copied by the kit builder).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import struct
from pathlib import Path


def kit_root() -> Path:
    script = Path(__file__).resolve()
    for parent in script.parents:
        if parent.name == "06_REGEN_SCENES":
            return parent
    return script.parents[1] / "VEO3_PRODUCTION_KIT" / "06_REGEN_SCENES"


ROOT = kit_root()


def safe(relative: str) -> Path:
    target = (ROOT / relative).resolve()
    if not target.is_relative_to(ROOT.resolve()):
        raise ValueError(f"Path escapes 06_REGEN_SCENES: {relative}")
    return target


def png_info(content: bytes, relative: str) -> tuple[int, int]:
    if len(content) < 45 or content[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Expected real PNG: {relative}")
    length = struct.unpack(">I", content[8:12])[0]
    if length != 13 or content[12:16] != b"IHDR":
        raise ValueError(f"Invalid PNG IHDR: {relative}")
    width, height = struct.unpack(">II", content[16:24])
    if width < 1280 or height < 720 or abs(width / height - 16 / 9) > 0.025:
        raise ValueError(f"Expected 16:9 and at least 1280x720: {relative}")
    if b"IEND" not in content[-64:]:
        raise ValueError(f"PNG has no ending chunk: {relative}")
    return width, height


def write_if_changed(path: Path, content: bytes, dry_run: bool) -> bool:
    if path.is_file() and path.read_bytes() == content:
        return False
    if not dry_run:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_name(path.name + ".sync_tmp")
        try:
            tmp.write_bytes(content)
            tmp.replace(path)
        finally:
            tmp.unlink(missing_ok=True)
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing or removing files")
    args = parser.parse_args()

    manifest = json.loads(safe("MANIFEST.json").read_text(encoding="utf-8"))
    available: dict[str, bytes] = {}
    hashes: dict[str, str] = {}
    for scene in manifest["scenes"]:
        image = safe(scene["input"])
        if not image.is_file():
            continue
        content = image.read_bytes()
        png_info(content, scene["input"])
        digest = hashlib.sha256(content).hexdigest()
        composition = safe(scene["composition_reference"])
        if not composition.is_file():
            raise ValueError(f"Missing source comparison image: {composition}")
        if digest == hashlib.sha256(composition.read_bytes()).hexdigest():
            raise ValueError(f"Unchanged marked source was used as new input: {scene['id']}")
        if digest in hashes.values():
            duplicate = next(k for k, v in hashes.items() if v == digest)
            raise ValueError(f"Two scenes use exactly the same input: {duplicate} and {scene['id']}")
        available[scene["id"]] = content
        hashes[scene["id"]] = digest

    updated, unchanged, waiting, pruned = [], [], [], []
    for move in manifest["transitions"]:
        first, last = safe(move["first_input"]), safe(move["last_input"])
        a, b = move["source"], move["destination"]
        if a not in available or b not in available:
            waiting.append(move["id"])
            for path in (first, last):
                # Only auto-synced endpoints are pruned; user exports are untouched.
                if path.is_file():
                    pruned.append(path.relative_to(ROOT).as_posix())
                    if not args.dry_run:
                        path.unlink()
            continue
        changed = write_if_changed(first, available[a], args.dry_run)
        changed |= write_if_changed(last, available[b], args.dry_run)
        (updated if changed else unchanged).append(move["id"])

    report = {
        "new_inputs_present": list(available),
        "updated_transitions": updated,
        "unchanged_transitions": unchanged,
        "waiting_transitions": waiting,
        "pruned_stale_inputs": pruned,
        "dry_run": args.dry_run,
        "visual_review_still_required": True,
        "note": (
            "Validates file format/dimensions and exact source duplication; it cannot certify "
            "that a scene is free of logos, hallucinations or watermarks."
        ),
    }
    if not args.dry_run:
        safe("INPUT_STATUS.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

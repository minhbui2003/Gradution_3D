"""Read-only production QA for 8 scene plates + 7 transitions. Python 3.9+.
Requires ffprobe (FFmpeg) only when MP4 files exist.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path
from sync_inputs import ROOT, safe, png_info

PILOT_SCENES = {"S01", "S02"}
PILOT_MOVES = {"T01"}


def probe(path):
    if not shutil.which("ffprobe"):
        raise RuntimeError("Install FFmpeg/ffprobe to validate MP4 exports")
    p = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration:stream=codec_type,codec_name,width,height,avg_frame_rate",
         "-of", "json", str(path)],
        capture_output=True, text=True, timeout=30,
    )
    if p.returncode:
        raise RuntimeError("Invalid MP4: " + p.stderr.strip()[:200])
    data = json.loads(p.stdout)
    video = next((s for s in data.get("streams", [])
                  if s.get("codec_type") == "video"), None)
    if not video:
        raise ValueError("No video stream")
    width, height = int(video.get("width", 0)), int(video.get("height", 0))
    duration = float(data.get("format", {}).get("duration", 0))
    if width < 1280 or height < 720 or not height or abs(width / height - 16 / 9) > 0.025:
        raise ValueError("Expected 16:9 video >=1280x720")
    if not 6 <= duration <= 10:
        raise ValueError("Expected approx. 8 seconds, got %.2fs" % duration)
    return {"width": width, "height": height, "duration_s": round(duration, 3),
            "codec": video.get("codec_name"), "fps": video.get("avg_frame_rate")}


def run(scope):
    manifest = json.loads(safe("MANIFEST.json").read_text(encoding="utf-8"))
    scenes = manifest["scenes"]
    moves = manifest["transitions"]
    problems, entries = [], []
    scene_map = {scene["id"]: scene for scene in scenes}
    if len(scene_map) != len(scenes):
        problems.append("Duplicate scene ID")
    if len({m["id"] for m in moves}) != len(moves):
        problems.append("Duplicate transition ID")

    def clip(path, item):
        file = safe(path)
        if not file.exists():
            return
        try:
            item["video"] = "present_needs_visual_review"
            item["metadata"] = probe(file)
        except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as exc:
            item["video"] = "invalid"
            problems.append(item["id"] + ": " + str(exc))

    for scene in scenes:
        if scope == "pilot" and scene["id"] not in PILOT_SCENES:
            continue
        item = {"id": scene["id"], "kind": "ambient", "input": "missing", "video": "missing"}
        for field in ("composition_reference", "image_prompt", "video_prompt"):
            if not safe(scene[field]).is_file():
                problems.append(scene["id"] + ": missing " + field)
        ref = safe(scene["input"])
        if ref.exists():
            try:
                raw = ref.read_bytes()
                png_info(raw, scene["input"])
                if raw == safe(scene["composition_reference"]).read_bytes():
                    raise ValueError("New input equals old composition preview")
                item["input"] = "present_unreviewed"
            except (OSError, ValueError) as exc:
                item["input"] = "invalid"
                problems.append(scene["id"] + ": " + str(exc))
        clip(scene["expected_output"], item)
        entries.append(item)

    for move in moves:
        if scope == "pilot" and move["id"] not in PILOT_MOVES:
            continue
        item = {"id": move["id"], "kind": "transition", "input": "missing", "video": "missing"}
        try:
            a, b = scene_map[move["source"]], scene_map[move["destination"]]
            af, bf = safe(move["first_input"]), safe(move["last_input"])
            ra, rb = safe(a["input"]), safe(b["input"])
            if af.exists() or bf.exists():
                if (af.is_file() and bf.is_file() and ra.is_file() and rb.is_file()
                        and af.read_bytes() == ra.read_bytes()
                        and bf.read_bytes() == rb.read_bytes()):
                    item["input"] = "synced_unreviewed"
                else:
                    item["input"] = "invalid"
                    problems.append(move["id"] + ": stale or incomplete transition frames")
            if not safe(move["folder"]).is_dir():
                problems.append(move["id"] + ": missing folder")
        except KeyError:
            problems.append(move["id"] + ": invalid source/destination ID")
        clip(move["expected_output"], item)
        entries.append(item)

    missing_inputs = [x["id"] for x in entries if x["input"] == "missing"]
    missing_videos = [x["id"] for x in entries if x["video"] == "missing"]
    return {"scope": scope, "expected_clips": len(entries),
            "metadata_valid_clips": sum(x["video"] == "present_needs_visual_review" for x in entries),
            "missing_inputs": missing_inputs, "missing_videos": missing_videos,
            "errors": problems, "technically_complete": not (problems or missing_inputs or missing_videos),
            "visual_review_required": True,
            "note": "Technical validation never certifies visual quality, continuity or absence of marks.",
            "assets": entries}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scope", choices=["all", "pilot"], default="all")
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()
    try:
        report = run(args.scope)
    except (OSError, ValueError, KeyError, json.JSONDecodeError) as exc:
        print("QA error: " + str(exc), file=sys.stderr)
        sys.exit(2)
    content = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(content, encoding="utf-8")
    print(content)
    if report["errors"] or (args.strict and not report["technically_complete"]):
        sys.exit(1)


if __name__ == "__main__":
    main()

"""Offline tests: python -m unittest discover -s tools -p test_*.py"""
import argparse
import io
import json
import struct
import tempfile
import unittest
import zlib
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

import sync_inputs
import check_production


def png(color=(4, 5, 6), w=1280, h=720):
    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data +
                struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) +
            chunk(b"IDAT", zlib.compress((b"\x00" + bytes(color)*w)*h, 6)) +
            chunk(b"IEND", b""))


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.patcher = patch.object(sync_inputs, "ROOT", self.root)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)
        self.manifest = {
            "scenes": [
                {"id": x, "input": f"scenes/{x}/INPUT/REFERENCE.png",
                 "composition_reference": f"scenes/{x}/old.png",
                 "image_prompt": f"scenes/{x}/image.txt",
                 "video_prompt": f"scenes/{x}/video.txt",
                 "expected_output": f"scenes/{x}/OUTPUT/{x}_AMBIENT.mp4"}
                for x in ("S01", "S02")
            ],
            "transitions": [
                {"id": "T01", "source": "S01", "destination": "S02",
                 "folder": "moves/T01",
                 "first_input": "moves/T01/INPUT/FIRST_FRAME.png",
                 "last_input": "moves/T01/INPUT/LAST_FRAME.png",
                 "expected_output": "moves/T01/OUTPUT/T01.mp4"}
            ]
        }
        (self.root / "MANIFEST.json").write_text(json.dumps(self.manifest))
        (self.root / "moves/T01").mkdir(parents=True)
        for scene in self.manifest["scenes"]:
            ref = self.root / scene["composition_reference"]
            ref.parent.mkdir(parents=True)
            ref.write_bytes(png((1, 2, 3)))
            for key in ("image_prompt", "video_prompt"):
                (self.root / scene[key]).write_text("prompt")

    def input(self, scene, color):
        path = self.root / f"scenes/{scene}/INPUT/REFERENCE.png"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(png(color))
        return path

    def sync(self, *args):
        with patch("sys.argv", ["sync_inputs.py", *args]), redirect_stdout(io.StringIO()) as out:
            sync_inputs.main()
        return json.loads(out.getvalue())

    def test_missing_inputs(self):
        result = self.sync()
        self.assertEqual(result["waiting_transitions"], ["T01"])

    def test_sync_idempotent(self):
        self.input("S01", (4, 5, 6))
        self.input("S02", (7, 8, 9))
        self.assertEqual(self.sync()["updated_transitions"], ["T01"])
        self.assertEqual(self.sync()["unchanged_transitions"], ["T01"])

    def test_dry_run(self):
        self.input("S01", (4, 5, 6))
        self.input("S02", (7, 8, 9))
        self.assertEqual(self.sync("--dry-run")["updated_transitions"], ["T01"])
        self.assertFalse((self.root / "moves/T01/INPUT/FIRST_FRAME.png").exists())

    def test_stale_cleanup(self):
        self.input("S01", (4, 5, 6))
        second = self.input("S02", (7, 8, 9))
        self.sync()
        second.unlink()
        self.assertEqual(len(self.sync()["pruned_stale_inputs"]), 2)
        self.assertFalse((self.root / "moves/T01/INPUT/FIRST_FRAME.png").exists())

    def test_reject_old_image(self):
        p = self.root / "scenes/S01/INPUT/REFERENCE.png"
        p.parent.mkdir(parents=True)
        p.write_bytes(png((1, 2, 3)))
        with self.assertRaisesRegex(ValueError, "Unchanged marked source"):
            self.sync()

    def test_reject_non_png(self):
        p = self.input("S01", (4, 5, 6))
        p.write_bytes(b"not a png")
        with self.assertRaisesRegex(ValueError, "Expected real PNG"):
            self.sync()

    def test_detect_incomplete_pilot(self):
        report = check_production.run("pilot")
        self.assertEqual(report["expected_clips"], 3)
        self.assertEqual(report["missing_videos"], ["S01", "S02", "T01"])
        self.assertFalse(report["technically_complete"])

    def test_detect_stale_transition(self):
        self.input("S01", (4, 5, 6))
        self.input("S02", (7, 8, 9))
        target = self.root / "moves/T01/INPUT/FIRST_FRAME.png"
        target.parent.mkdir(parents=True)
        target.write_bytes(png((3, 5, 8)))
        (target.parent / "LAST_FRAME.png").write_bytes(png((7, 8, 9)))
        report = check_production.run("pilot")
        self.assertTrue(any("stale or incomplete" in x for x in report["errors"]))


if __name__ == "__main__":
    unittest.main()

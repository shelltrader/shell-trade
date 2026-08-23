#!/usr/bin/env python3
"""Inline the canonical earliest-crash capture into all production HTML entry points."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "website" / "assets" / "cq-boot-crash.js"
TARGETS = [
    ROOT / "chart-quest.html",
    ROOT / "website" / "index.html",
    ROOT / "website" / "play.html",
    ROOT / "website" / "survey.html",
]
BEGIN = "/* CQBOOTCRASH:BEGIN — generated from website/assets/cq-boot-crash.js by scripts/sync_boot_crash.py — DO NOT EDIT HERE */"
END = "/* CQBOOTCRASH:END */"
LEGACY_START = "/* BOOT-CRASH CAPTURE — deliberately in <head>, before everything else."


def render(source: str) -> str:
    return "<script>\n" + BEGIN + "\n" + source.rstrip() + "\n" + END + "\n</script>"


def splice(document: str, block: str) -> str:
    if BEGIN in document or END in document:
        if document.count(BEGIN) != 1 or document.count(END) != 1:
            raise RuntimeError("boot-crash marker count is invalid")
        start = document.index("<script>\n" + BEGIN)
        end_marker = END + "\n</script>"
        end = document.index(end_marker, start) + len(end_marker)
        return document[:start] + block + document[end:]
    anchor = "<script>\n" + LEGACY_START
    if document.count(anchor) != 1:
        raise RuntimeError("could not find one legacy boot-crash block")
    start = document.index(anchor)
    end = document.index("\n</script>", start) + len("\n</script>")
    return document[:start] + block + document[end:]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    block = render(SOURCE.read_text(encoding="utf-8"))
    stale = []
    for target in TARGETS:
      current = target.read_text(encoding="utf-8")
      expected = splice(current, block)
      if current != expected:
        stale.append(target.relative_to(ROOT))
        if not args.check:
          target.write_text(expected, encoding="utf-8")
    if args.check and stale:
      print("stale boot-crash blocks: " + ", ".join(map(str, stale)), file=sys.stderr)
      return 1
    if stale and not args.check:
      print("synced boot-crash block: " + ", ".join(map(str, stale)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

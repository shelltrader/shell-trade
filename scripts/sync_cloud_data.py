#!/usr/bin/env python3
"""Synchronize the canonical Cloudflare data adapter into the self-contained game."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "website" / "assets" / "cq-cloud-data.js"
TARGET = ROOT / "chart-quest.html"
BEGIN = "/* CQCLOUDDATA:BEGIN — generated from website/assets/cq-cloud-data.js by scripts/sync_cloud_data.py — DO NOT EDIT HERE */"
END = "/* CQCLOUDDATA:END */"
LEGACY = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>'


def rendered(source: str) -> str:
    return "<script>\n" + BEGIN + "\n" + source.rstrip() + "\n" + END + "\n</script>"


def splice(document: str, block: str) -> str:
    if BEGIN in document or END in document:
        if document.count(BEGIN) != 1 or document.count(END) != 1:
            raise RuntimeError("Cloud-data marker count is invalid")
        start = document.index("<script>\n" + BEGIN)
        end_marker = END + "\n</script>"
        end = document.index(end_marker, start) + len(end_marker)
        return document[:start] + block + document[end:]
    if document.count(LEGACY) != 1:
        raise RuntimeError("Could not find one legacy Supabase SDK anchor")
    return document.replace(LEGACY, block, 1)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    source = SOURCE.read_text(encoding="utf-8")
    current = TARGET.read_text(encoding="utf-8")
    expected = splice(current, rendered(source))
    if args.check:
        if current != expected:
            print("chart-quest.html Cloud-data block is stale", file=sys.stderr)
            return 1
        return 0
    if current != expected:
        TARGET.write_text(expected, encoding="utf-8")
        print("synced website/assets/cq-cloud-data.js -> chart-quest.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

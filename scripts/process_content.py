#!/usr/bin/env python3
"""Turn what the CMS saved into what the website needs.

Sam edits one file per painting in `content/paintings/` through Pages CMS: a
title, a photograph, a description, a date. She never sees slugs, pixel widths
or file paths. This script fills that gap, and runs automatically in GitHub
Actions whenever she saves. For each painting it:

  1. takes the slug from the filename, so the web address is stable
  2. resizes any newly uploaded photograph into images/paintings/<slug>/
  3. measures the images and records their real dimensions

It then writes two files:

  content/gallery.json    every published painting, for the gallery page
  content/featured.json   only the handful marked for the home page

Two files rather than one because the home page shows six paintings and should
not have to download the details of several hundred to find them.

Order is pinned paintings first, then newest date first, then anything undated
by its manual position. Drafts are left out entirely.

Paintings added before the CMS existed have no `photo`, because their originals
were never committed. Those keep whatever images are already on disk, so the
script is safe to run over the whole collection at any time.

It is idempotent: running it twice in a row changes nothing the second time.

    python3 scripts/process_content.py            # process and write
    python3 scripts/process_content.py --check    # report only, change nothing
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "content" / "paintings"
GALLERY = ROOT / "content" / "gallery.json"
FEATURED = ROOT / "content" / "featured.json"
PAINTINGS_DIR = ROOT / "images" / "paintings"
UPLOADS_DIR = ROOT / "images" / "uploads"

# Matches scripts/resize-images.py so both routes produce identical files.
WIDTHS = [400, 800, 1200, 1600]
JPEG_QUALITY = 82
WEBP_QUALITY = 80

check_only = "--check" in sys.argv
problems: list[str] = []


def read_frontmatter(path: Path) -> dict:
    """Parse the YAML block between the leading --- fences."""
    text = path.read_text()
    match = re.match(r"^---\n(.*?)\n---\s*(.*)$", text, re.S)
    if not match:
        problems.append(f"{path.name}: no frontmatter block, skipped")
        return {}
    try:
        data = yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError as exc:
        problems.append(f"{path.name}: frontmatter is not valid YAML, {exc}")
        return {}
    if not isinstance(data, dict):
        problems.append(f"{path.name}: frontmatter is not a set of fields, skipped")
        return {}
    data["_body"] = match.group(2).strip()
    return data


def write_frontmatter(path: Path, data: dict) -> None:
    body = data.pop("_body", "")
    text = "---\n" + yaml.safe_dump(data, sort_keys=False, allow_unicode=True) + "---\n"
    if body:
        text += body + "\n"
    path.write_text(text)


def resolve_upload(photo: str) -> Path | None:
    """The CMS may store the path with or without a leading slash."""
    if not photo:
        return None
    candidate = ROOT / str(photo).lstrip("/")
    return candidate if candidate.is_file() else None


def variants_for(source_width: int) -> list[int]:
    widths = [w for w in WIDTHS if w <= source_width]
    if source_width < max(WIDTHS) and source_width not in widths:
        widths.append(source_width)
    return sorted(widths) or [source_width]


def build_variants(photo: Path, slug: str) -> tuple[int, int, list[int]]:
    """Write every web-sized copy of one photograph. Returns (w, h, widths)."""
    image = Image.open(photo)
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    src_w, src_h = image.size
    aspect = src_h / src_w
    widths = variants_for(src_w)

    out_dir = PAINTINGS_DIR / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    # Clear any older set so a replaced photograph cannot leave stale widths behind.
    for old in out_dir.glob(f"{slug}-*"):
        old.unlink()

    for w in widths:
        resized = image.resize((w, round(w * aspect)), Image.LANCZOS)
        resized.save(out_dir / f"{slug}-{w}.jpg", "JPEG",
                     quality=JPEG_QUALITY, optimize=True, progressive=True)
        resized.save(out_dir / f"{slug}-{w}.webp", "WEBP", quality=WEBP_QUALITY)

    largest = max(widths)
    with Image.open(out_dir / f"{slug}-{largest}.jpg") as biggest:
        return biggest.width, biggest.height, widths


def measure_existing(slug: str) -> tuple[int, int, list[int]] | None:
    """Read dimensions off images already on disk, for pre-CMS paintings."""
    out_dir = PAINTINGS_DIR / slug
    if not out_dir.is_dir():
        return None
    widths = sorted(
        int(m.group(1))
        for p in out_dir.glob(f"{slug}-*.jpg")
        if (m := re.search(rf"{re.escape(slug)}-(\d+)\.jpg$", p.name))
    )
    if not widths:
        return None
    with Image.open(out_dir / f"{slug}-{max(widths)}.jpg") as biggest:
        return biggest.width, biggest.height, widths


def main() -> int:
    if not SOURCE_DIR.is_dir():
        print(f"error: {SOURCE_DIR.relative_to(ROOT)} is missing", file=sys.stderr)
        return 1

    files = sorted(SOURCE_DIR.glob("*.md"))
    if not files:
        print(f"error: no paintings found in {SOURCE_DIR.relative_to(ROOT)}", file=sys.stderr)
        return 1

    collected: list[dict] = []
    drafts = 0

    for path in files:
        data = read_frontmatter(path)
        if not data:
            continue

        slug = path.stem
        title = str(data.get("title") or "").strip()
        if not title:
            problems.append(f"{path.name}: no title, skipped")
            continue

        if data.get("draft"):
            drafts += 1
            continue

        upload = resolve_upload(data.get("photo", ""))
        if upload is not None:
            if check_only:
                print(f"  would resize {upload.name} for {slug}")
                measured = measure_existing(slug)
            else:
                measured = build_variants(upload, slug)
                upload.unlink()          # the original stays in git history
                data["photo"] = ""       # the job is done, clear the field
                write_frontmatter(path, dict(data))
                print(f"  resized {upload.name} -> {slug} ({len(measured[2])} widths)")
        else:
            if data.get("photo"):
                problems.append(f"{title}: photograph {data['photo']!r} was not found")
            measured = measure_existing(slug)

        if measured is None:
            problems.append(f"{title}: no images yet, add a photograph in the CMS")
            continue

        width, height, widths = measured
        alt = str(data.get("alt") or "").strip()
        if not alt:
            problems.append(f"{title}: no description, so the title is read aloud instead")

        collected.append({
            "slug": slug,
            "title": title,
            "year": str(data.get("year") or ""),
            "medium": str(data.get("medium") or ""),
            "dimensions": str(data.get("dimensions") or ""),
            "series": str(data.get("series") or ""),
            "featured": bool(data.get("featured")),
            "width": width,
            "height": height,
            "widths": widths,
            "alt": alt or title,
            # Underscored keys are for sorting only and are stripped before writing.
            "_pinned": bool(data.get("pinned")),
            "_date": str(data.get("date") or ""),
            "_position": int(data.get("position") or 0),
        })

    # Three passes, relying on Python's sort being stable so each one keeps the
    # order the previous established. Applied least significant first:
    #   1. manual position, which only matters for undated paintings
    #   2. date, newest first. Dates are yyyy-MM-dd strings so they sort
    #      correctly as text, and undated ones are "" so they fall to the bottom
    #   3. pinned, which overrides everything
    collected.sort(key=lambda p: p["_position"] or 0)
    collected.sort(key=lambda p: p["_date"], reverse=True)
    collected.sort(key=lambda p: 0 if p["_pinned"] else 1)

    published = [{k: v for k, v in p.items() if not k.startswith("_")} for p in collected]
    featured = [p for p in published if p["featured"]]

    if check_only:
        print(f"\n{len(published)} painting(s) would be published, {drafts} hidden")
        print(f"{len(featured)} on the home page")
        for p in problems:
            print(f"  ! {p}")
        return 0

    wrote = []
    for target, payload in ((GALLERY, published), (FEATURED, featured)):
        text = json.dumps({"paintings": payload}, indent=2) + "\n"
        if not target.is_file() or target.read_text() != text:
            target.write_text(text)
            wrote.append(target.name)

    if UPLOADS_DIR.is_dir():
        for leftover in UPLOADS_DIR.iterdir():
            if leftover.is_file() and leftover.name != ".gitkeep":
                problems.append(f"unused upload left in images/uploads: {leftover.name}")

    print(f"\n{len(published)} painting(s) published, {drafts} hidden, "
          f"{len(featured)} on the home page")
    print("updated: " + (", ".join(wrote) if wrote else "nothing, already current"))
    for p in problems:
        print(f"  ! {p}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

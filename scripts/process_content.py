#!/usr/bin/env python3
"""Turn what the CMS saved into what the website needs.

Sam edits `content/paintings.json` through Pages CMS: a title, a photograph, a
description, and so on. She never sees slugs, pixel widths or file paths. This
script fills that gap, and runs automatically in GitHub Actions whenever she
saves. For each painting it:

  1. gives it a slug, derived from the title, the first time it is seen
  2. resizes any newly uploaded photograph into images/paintings/<slug>/
  3. measures the images and records their real dimensions
  4. writes content/gallery.json — the file the website actually reads

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
import unicodedata
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "content" / "paintings.json"
BUILT = ROOT / "content" / "gallery.json"
PAINTINGS_DIR = ROOT / "images" / "paintings"
UPLOADS_DIR = ROOT / "images" / "uploads"

# Matches scripts/resize-images.py so both routes produce identical files.
WIDTHS = [400, 800, 1200, 1600]
JPEG_QUALITY = 82
WEBP_QUALITY = 80

check_only = "--check" in sys.argv
problems: list[str] = []


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    text = re.sub(r"[\s_-]+", "-", text)
    return text or "painting"


def unique_slug(base: str, taken: set[str]) -> str:
    slug, n = base, 2
    while slug in taken:
        slug, n = f"{base}-{n}", n + 1
    return slug


def resolve_upload(photo: str) -> Path | None:
    """The CMS may store the path with or without a leading slash."""
    if not photo:
        return None
    candidate = ROOT / photo.lstrip("/")
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
    if not SOURCE.is_file():
        print(f"error: {SOURCE.relative_to(ROOT)} is missing", file=sys.stderr)
        return 1
    try:
        source = json.loads(SOURCE.read_text())
    except json.JSONDecodeError as exc:
        print(f"error: content/paintings.json is not valid JSON — {exc}", file=sys.stderr)
        return 1

    entries = source.get("paintings") or []
    taken = {e["slug"] for e in entries if e.get("slug")}
    built: list[dict] = []
    source_changed = False

    for position, entry in enumerate(entries, start=1):
        title = (entry.get("title") or "").strip()
        if not title:
            problems.append(f"painting #{position} has no title — skipped")
            continue

        slug = (entry.get("slug") or "").strip()
        if not slug:
            slug = unique_slug(slugify(title), taken)
            taken.add(slug)
            if not check_only:
                entry["slug"] = slug
            source_changed = True
            print(f"  named  {title!r} -> {slug}")

        upload = resolve_upload(entry.get("photo", ""))
        if upload is not None:
            if check_only:
                print(f"  would resize {upload.name} for {slug}")
                measured = measure_existing(slug)
            else:
                w, h, widths = build_variants(upload, slug)
                measured = (w, h, widths)
                upload.unlink()               # the original is kept in git history
                entry["photo"] = ""           # the job is done; clear the field
                source_changed = True
                print(f"  resized {upload.name} -> {slug} ({len(widths)} widths)")
        else:
            if entry.get("photo"):
                problems.append(
                    f"{title!r}: photograph {entry['photo']!r} was not found"
                )
            measured = measure_existing(slug)

        if measured is None:
            problems.append(f"{title!r}: no images yet — add a photograph in the CMS")
            continue

        width, height, widths = measured
        built.append({
            "slug": slug,
            "title": title,
            "year": str(entry.get("year") or ""),
            "medium": entry.get("medium") or "",
            "dimensions": entry.get("dimensions") or "",
            "series": entry.get("series") or "",
            "featured": bool(entry.get("featured")),
            "width": width,
            "height": height,
            "widths": widths,
            "alt": (entry.get("alt") or "").strip() or title,
        })
        if not (entry.get("alt") or "").strip():
            problems.append(f"{title!r}: no description, so the title is being read aloud instead")

    if check_only:
        print(f"\n{len(built)} painting(s) would be published")
        for p in problems:
            print(f"  ! {p}")
        return 0

    new_built = json.dumps({"paintings": built}, indent=2) + "\n"
    built_changed = not BUILT.is_file() or BUILT.read_text() != new_built
    if built_changed:
        BUILT.write_text(new_built)

    if source_changed:
        SOURCE.write_text(json.dumps(source, indent=2) + "\n")

    # Leave the uploads folder tidy so it does not fill up with used photographs.
    if UPLOADS_DIR.is_dir():
        for leftover in UPLOADS_DIR.iterdir():
            if leftover.is_file() and leftover.name != ".gitkeep":
                problems.append(f"unused upload left in images/uploads: {leftover.name}")

    print(f"\n{len(built)} painting(s) published"
          f"{' — content/gallery.json updated' if built_changed else ' — no change'}")
    for p in problems:
        print(f"  ! {p}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

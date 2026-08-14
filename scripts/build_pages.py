#!/usr/bin/env python3
"""Write the hero on the home page from content/settings.json.

The hero is the biggest image on the site and the first thing anyone sees, so
it stays as real HTML in index.html rather than being fetched and drawn by
JavaScript, which would leave a blank rectangle on every first visit. This
script keeps that HTML in step with whatever hero painting has been chosen in
the CMS, by rewriting only the regions between the `hero:*:start` / `hero:*:end`
comments. Everything outside those markers is left exactly as it is.

It runs in GitHub Actions after a content change. Nobody needs to run it by
hand, though it is safe to do so:

    python3 scripts/build_pages.py

Exits non-zero on a real problem (missing painting, missing markers) so a
broken deploy fails loudly instead of quietly publishing an empty hero.
"""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
SETTINGS = ROOT / "content" / "settings.json"
# The built file, not the CMS source: this needs the image widths, which are
# worked out by process_content.py rather than typed in by hand.
PAINTINGS = ROOT / "content" / "gallery.json"


def load(path: Path):
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        sys.exit(f"error: {path.relative_to(ROOT)} is missing")
    except json.JSONDecodeError as exc:
        sys.exit(f"error: {path.relative_to(ROOT)} is not valid JSON, {exc}")


def replace_region(text: str, name: str, body: str) -> str:
    """Swap the content between a pair of markers, preserving their indentation.

    The end marker's own indent is captured and re-emitted so that repeated runs
    produce byte-identical output rather than drifting whitespace.
    """
    pattern = re.compile(
        r"(<!-- hero:%s:start -->\n).*?\n([ \t]*<!-- hero:%s:end -->)" % (name, name),
        re.S,
    )
    if not pattern.search(text):
        sys.exit(f"error: could not find the hero:{name} markers in index.html")
    body = body.rstrip("\n")
    return pattern.sub(lambda m: m.group(1) + body + "\n" + m.group(2), text, count=1)


def srcset(painting: dict, ext: str, indent: str) -> str:
    slug = painting["slug"]
    return ("\n" + indent).join(
        f"images/paintings/{slug}/{slug}-{w}.{ext} {w}w,"
        for w in painting["widths"]
    ).rstrip(",")


def main() -> None:
    settings = load(SETTINGS)
    paintings = load(PAINTINGS).get("paintings", [])
    if not paintings:
        sys.exit("error: content/gallery.json contains no paintings")

    slug = settings.get("heroSlug")
    hero = next((p for p in paintings if p.get("slug") == slug), None)
    if hero is None:
        available = ", ".join(p.get("slug", "?") for p in paintings)
        sys.exit(
            f"error: heroSlug '{slug}' is not one of the paintings.\n"
            f"       choose one of: {available}"
        )
    if not hero.get("widths"):
        sys.exit(f"error: '{slug}' has no resized images yet, run the resizer first")

    largest = max(hero["widths"])
    alt = html.escape(hero.get("alt") or hero.get("title", ""), quote=True)

    media = f"""    <div class="hero__media">
      <picture>
        <source type="image/webp" sizes="100vw" srcset="
          {srcset(hero, 'webp', '          ')}">
        <img
          src="images/paintings/{hero['slug']}/{hero['slug']}-{largest}.jpg"
          sizes="100vw"
          srcset="
            {srcset(hero, 'jpg', '            ')}"
          alt="{alt}"
          width="{hero['width']}" height="{hero['height']}" fetchpriority="high" decoding="async">
      </picture>
    </div>
"""

    line1 = html.escape(settings.get("heroHeadingLine1", ""))
    line2 = html.escape(settings.get("heroHeadingLine2", ""))
    heading = f"{line1}<br>{line2}" if line2 else line1
    tagline = html.escape(settings.get("heroTagline", ""))

    text = f"""      <h1 class="hero__title">{heading}</h1>
      <p class="hero__tagline">{tagline}</p>
"""
    caption = f"""      <p class="hero__caption">{html.escape(hero.get('title', ''))}</p>
"""

    original = INDEX.read_text()
    updated = replace_region(original, "media", media)
    updated = replace_region(updated, "text", text)
    updated = replace_region(updated, "caption", caption)

    # Keep the social-share alt text describing the painting people will see.
    updated = re.sub(
        r'(<meta property="og:image:alt" content=")[^"]*(")',
        lambda m: m.group(1) + alt + m.group(2),
        updated,
        count=1,
    )

    if updated == original:
        print("hero already up to date")
        return

    INDEX.write_text(updated)
    print(f"hero rebuilt from '{hero['slug']}' ({hero['title']})")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Point the whole site at a domain.

The canonical links, the Open Graph tags, sitemap.xml and robots.txt all have to
agree on one address, or search engines and social previews get confused about
which copy of the site is the real one. Rather than editing them by hand and
missing one, run:

    python3 scripts/set_domain.py samrudd.co.uk
    python3 scripts/set_domain.py --check          # show the current domain

It accepts the domain with or without https:// and with or without www, and
normalises to a single form. Nothing else in the page is touched.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGETS = ["index.html", "gallery.html", "about.html", "contact.html",
           "404.html", "sitemap.xml", "robots.txt"]

# Any absolute URL pointing at the site, whatever domain it currently names.
URL = re.compile(r"https://(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+", re.I)


def current() -> set[str]:
    found: set[str] = set()
    for name in TARGETS:
        path = ROOT / name
        if path.is_file():
            for match in URL.findall(path.read_text()):
                # Ignore links out to other people's sites.
                if "schema.org" in match or "github.com" in match or "instagram.com" in match:
                    continue
                found.add(match)
    return found


def normalise(raw: str) -> str:
    host = raw.strip().rstrip("/")
    host = re.sub(r"^https?://", "", host, flags=re.I).lower()
    if not re.fullmatch(r"[a-z0-9-]+(?:\.[a-z0-9-]+)+", host):
        sys.exit(f"error: '{raw}' does not look like a domain name")
    return f"https://{host}"


def main() -> int:
    existing = current()

    if "--check" in sys.argv or len(sys.argv) < 2:
        if not existing:
            print("No absolute site URLs found.")
        for url in sorted(existing):
            print(f"currently: {url}")
        if len(sys.argv) < 2:
            print("\nUsage: python3 scripts/set_domain.py yourdomain.co.uk")
        return 0

    new = normalise(sys.argv[1])
    if existing == {new}:
        print(f"Already set to {new}")
        return 0

    changed = 0
    for name in TARGETS:
        path = ROOT / name
        if not path.is_file():
            continue
        text = path.read_text()

        def swap(match: re.Match) -> str:
            url = match.group(0)
            if "schema.org" in url or "github.com" in url or "instagram.com" in url:
                return url
            return new

        updated = URL.sub(swap, text)
        if updated != text:
            path.write_text(updated)
            changed += 1
            print(f"  updated {name}")

    print(f"\n{changed} file(s) now point at {new}")
    print("Remember the site must be reachable at exactly that address, "
          "including the www or lack of it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

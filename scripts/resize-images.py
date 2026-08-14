#!/usr/bin/env python3
"""Generate the responsive image variants the site serves for one painting.

    python3 scripts/resize-images.py originals/swaledale.jpg morning-light-over-swaledale

Writes images/paintings/<slug>/<slug>-{400,800,1200,1600}.{jpg,webp} and prints a
ready-to-paste entry for js/paintings-data.js.
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is required:  python3 -m pip install --user Pillow")

WIDTHS = (400, 800, 1200, 1600)
JPEG_QUALITY = 82
WEBP_QUALITY = 80
ROOT = Path(__file__).resolve().parent.parent


def slugify(value):
    cleaned = "".join(c.lower() if c.isalnum() else "-" for c in value)
    return "-".join(part for part in cleaned.split("-") if part)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)

    source = Path(sys.argv[1]).expanduser()
    if not source.is_file():
        sys.exit(f"No such file: {source}")

    slug = slugify(sys.argv[2]) if len(sys.argv) > 2 else slugify(source.stem)
    out_dir = ROOT / "images" / "paintings" / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    # exif_transpose honours the camera's rotation flag, which phones set and
    # Pillow otherwise ignores. Without it, portrait photos come out sideways.
    image = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    src_w, src_h = image.size
    aspect = src_h / src_w

    widths = [w for w in WIDTHS if w <= src_w]
    # Never upscale, but don't throw away resolution either: if the photo falls
    # between the standard steps, keep its native size as the largest variant.
    if src_w < max(WIDTHS) and src_w not in widths:
        widths.append(src_w)
    widths = sorted(widths) or [src_w]

    for width in widths:
        resized = image.resize((width, round(width * aspect)), Image.LANCZOS)
        resized.save(out_dir / f"{slug}-{width}.jpg", "JPEG",
                     quality=JPEG_QUALITY, optimize=True, progressive=True)
        resized.save(out_dir / f"{slug}-{width}.webp", "WEBP", quality=WEBP_QUALITY)
        print(f"  wrote {slug}-{width}.jpg / .webp")

    largest = max(widths)

    print(f"\nAdd this to js/paintings-data.js:\n")
    print("  {")
    print(f'    slug: "{slug}",')
    print(f'    title: "{slug.replace("-", " ").title()}",')
    print("    year: 2025,")
    print('    medium: "Oil on canvas",')
    print('    dimensions: "00 x 00 cm",')
    print('    series: "",')
    print("    featured: false,")
    print(f"    width: {largest},")
    print(f"    height: {round(largest * aspect)},")
    print(f"    widths: {list(widths)},")
    print('    alt: "TODO, describe what the painting shows.",')
    print("  },")


if __name__ == "__main__":
    main()

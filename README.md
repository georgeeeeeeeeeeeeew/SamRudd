# Sam Rudd — portfolio site

A plain static site: HTML, one stylesheet, a little JavaScript. No build step, no
dependencies, no server. Open `index.html` in a browser and it works.

---

## Adding a painting

**1. Make the web-sized versions.** Put the original photo somewhere handy and run:

```bash
python3 scripts/resize-images.py originals/your-photo.jpg river-bend-in-june
```

The second argument is the *slug* — lowercase, hyphens, no spaces. It becomes the
folder name and the shareable link, so pick something readable and don't change it
later. The script writes four widths (400/800/1200/1600) as both `.jpg` and `.webp`
into `images/paintings/<slug>/`, then prints a ready-made entry.

**2. Paste that entry into `js/paintings-data.js`** and fill in the real details.
Newest paintings go at the top — the gallery displays them in file order.

```js
{
  slug: "river-bend-in-june",
  title: "River Bend in June",
  year: 2025,
  medium: "Oil on linen",
  dimensions: "90 × 60 cm",
  series: "Water",          // optional, unused for now
  featured: true,           // true = also appears on the home page
  width: 1600,
  height: 1080,
  widths: [400, 800, 1200, 1600],
  alt: "A slow river turning through summer meadows…",
},
```

That's it — the home page and gallery both rebuild themselves from this file.

**About `alt`:** describe what the painting *shows*, not just its title. It's read
aloud to blind visitors and it's how the work gets found in Google Images. "A slow
river turning through summer meadows, its surface breaking into pale greens" is
useful; "painting" is not.

**Removing a painting:** delete its entry from `paintings-data.js`. The image folder
can stay or go.

Originals live in `originals/` and are never published — only the resized copies in
`images/` are. Keep the full-resolution files backed up somewhere separate.

---

## Before this goes live

These are the placeholders that need replacing. Nothing here blocks previewing the
site locally, but all of it should be sorted before you point a domain at it.

- [ ] **The paintings are fake.** Everything in `images/paintings/` is a generated
      stand-in so the layout could be built and checked. Replace all of it with real
      photographs, and rewrite every entry in `js/paintings-data.js` to match.
- [ ] **The words are invented.** The About page bio, exhibition list, hero tagline
      and painting titles are placeholder copy. Get Sam's own words in.
- [ ] **The studio photo** (`images/site/artist-portrait-*.jpg`) is also generated.
- [ ] **The email address** `hello@samrudd.co.uk` appears on the contact page and in
      its footer. Change it to the real one.
- [ ] **The Instagram link** on the contact page points at instagram.com generally.
- [ ] **The domain.** `https://www.samrudd.co.uk` is assumed throughout — in every
      page's `<link rel="canonical">` and `og:` tags, plus `sitemap.xml` and
      `robots.txt`. Find and replace it once the real domain is decided.
- [ ] **The contact form** currently opens the visitor's email app. To have messages
      arrive as email instead, create a free form endpoint (Formspree or Web3Forms)
      and paste the URL into the `ENDPOINT` variable near the bottom of
      `contact.html`. Then send yourself a test message.
- [ ] **`robots.txt` currently blocks all search engines**, deliberately — the
      placeholder bio and exhibition list must not get indexed under Sam's real
      name. Reverse it (instructions are in the file) as the last step before
      launch, or the finished site will be invisible to Google.

---

## Layout of the files

```
index.html  gallery.html  about.html  contact.html  404.html
css/style.css              colours, type and layout — all the design lives here
js/paintings-data.js       the paintings (the file you'll edit most)
js/gallery.js              builds the grids, runs the lightbox
js/main.js                 header, mobile menu, scroll reveals
images/paintings/<slug>/   web-sized paintings, four widths each
images/site/               studio photo, social-share image
fonts/                     Fraunces + Inter, self-hosted
originals/                 full-size masters — not published
scripts/resize-images.py   the resizer
```

Colours and spacing are CSS custom properties at the top of `css/style.css`. The
accent colour (`--accent`, `#50693b`) is the green of Sam's signature logo, and
`--accent-soft` is a lighter tint of it used where the base green would go muddy
against the dark hero. Everything else is a warm neutral, so the paintings supply
the colour.

### Brand assets

`brand/sam-rudd-logo.png` is the master supplied by Sam — green artwork on a solid
white background. It is kept for reference and is **not** used by the site directly:
its white background would show as a white box against the warm paper colour.

The two files the site actually loads were cut from it, with the white knocked out
to transparency and the ink set to exactly `--accent`:

- `images/site/logo-signature.png` — the signature alone, used in the header
- `images/site/logo-lockup.png` — signature plus the SAM RUDD wordmark, used in the footer

Both are around 2.5× the size they ever render at, so they stay sharp on retina
screens without needing separate `@2x` files. If you ever get a vector (SVG) version
of the logo, it's worth swapping in — it would be smaller and sharper at every size.

The favicon is a plain "SR" in the brand green, not the signature. The signature's
thin, flowing strokes turn to mush at 16–32px; the letterforms stay readable.

---

## Publishing

Any static host will serve this as-is — drag the folder onto Netlify, or point
GitHub Pages / Vercel / Cloudflare Pages at the repository. There is nothing to
build and no server-side anything.

Two things to check on the host once deployed: that `404.html` is wired up as the
not-found page, and that HTTPS is on.

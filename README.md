# Sam Rudd, portfolio site

A plain static site: HTML, one stylesheet, a little vanilla JavaScript. No
framework, no bundler, nothing to compile. What is in the folder is what the
browser receives.

Sam maintains the paintings herself through a free CMS, she never sees code.
Her instructions are in [GUIDE-FOR-SAM.md](GUIDE-FOR-SAM.md); this file is the
technical side.

**Running it locally** needs a web server, because the pages fetch their content
as JSON and a browser blocks that over `file://`. Double-clicking `index.html`
will show an empty gallery. Instead:

```bash
python3 -m http.server 8123
```

---

## How content flows

```
Sam saves in the CMS
        │
        ▼
content/paintings.json      ← what she edits: title, photo, description
images/uploads/…            ← the photograph she uploaded
        │
        │  GitHub Action: scripts/process_content.py
        │    • names the painting (slug) from its title
        │    • resizes the photo to 400/800/1200/1600 in JPEG + WebP
        │    • measures the results, tidies the upload away
        ▼
content/gallery.json        ← generated; the file the website reads
        │
        │  GitHub Action: scripts/build_pages.py
        ▼
index.html hero             ← rewritten between the `hero:*` comment markers
```

Two files, deliberately: **`content/paintings.json` is Sam's**, and
**`content/gallery.json` is the machine's**. Nothing generated appears in her
editing form, and nothing she types can be clobbered by the Action.

The hero is the one thing not fetched at runtime. It is the largest image on the
site and the first thing anyone sees, so it stays as real HTML. Drawing it with
JavaScript would flash an empty rectangle on every visit. `build_pages.py` keeps
that HTML in step, rewriting only what sits between the `hero:*:start` and
`hero:*:end` comments in `index.html`.

## Adding a painting yourself

You don't need the CMS. Edit `content/paintings.json`, adding an entry with a
`photo` pointing at any image on disk, then run:

```bash
python3 scripts/process_content.py && python3 scripts/build_pages.py
```

Both are safe to run repeatedly, running them twice changes nothing the second
time. `--check` on the first one reports what it would do without touching
anything. `scripts/resize-images.py` is still there for one-off resizing outside
this flow.

**About the description (`alt`):** describe what the painting *shows*, not just
its title. It is read aloud to blind visitors and it is how the work is found in
image search. "A slow river turning through summer meadows, its surface breaking
into pale greens" is useful; "painting" is not. It is a required field in the CMS
for that reason.

Originals live in `originals/`, which is never published. Only the resized
copies in `images/` are. Keep full-resolution files backed up separately; the
Action deletes uploads once it has processed them, and the only copy after that
is in git history.

---

## Before this goes live

These are the placeholders that need replacing. Nothing here blocks previewing the
site locally, but all of it should be sorted before you point a domain at it.

- [ ] **Painting titles are guesses.** The photographs are Sam's real work, but they
      arrived with only filenames, so every `title` in `content/paintings.json` is a
      working title. One is untitled entirely (the camera called it `dsc04164`).
      `year`, `medium` and `dimensions` are left blank on purpose. The site omits
      whatever is empty, so they can be filled in gradually. Do not invent them.
- [ ] **Better photographs.** Most are only 480-615px wide, so they look soft when
      opened large. Some show the frame and the wall behind, others show bare canvas.
      Re-shooting the set consistently, at higher resolution, would improve this page
      more than any code change.
- [ ] **The About page has no real biography**, just a general holding paragraph,
      because nothing about Sam's background has been confirmed. There is a comment
      in `about.html` marking where her words go. Please don't add places, dates or
      galleries until she has said them.
- [ ] **There is no photograph of Sam.** The About page currently shows one of her
      paintings in that slot instead. Swap in a real portrait or studio photo.
- [ ] **The email address** `hello@samrudd.co.uk` appears on the contact page and in
      its footer. Change it to the real one.
- [ ] **The Instagram link** on the contact page points at instagram.com generally.
- [ ] **The domain.** `https://www.samrudd.co.uk` is assumed throughout, in every
      page's `<link rel="canonical">` and `og:` tags, plus `sitemap.xml` and
      `robots.txt`. Find and replace it once the real domain is decided.
- [ ] **The contact form** currently opens the visitor's email app. To have messages
      arrive as email instead, create a free form endpoint (Formspree or Web3Forms)
      and paste the URL into the `ENDPOINT` variable near the bottom of
      `contact.html`. Then send yourself a test message.
- [ ] **`robots.txt` currently blocks all search engines**, deliberately, because the
      placeholder bio and exhibition list must not get indexed under Sam's real
      name. Reverse it (instructions are in the file) as the last step before
      launch, or the finished site will be invisible to Google.

---

## Turning the CMS on

Everything in the repository is already configured. What remains needs your
GitHub account, so it has to be you:

1. **Authorise Pages CMS.** Go to [app.pagescms.org](https://app.pagescms.org),
   sign in with GitHub, and grant it access to the `SamRudd` repository (you can
   grant access to that one repository only, as it does not need your whole
   account). It reads `.pages.yml` from the repo and builds the editing screens
   from it.

2. **Invite Sam.** In the project's settings, add her by email address. She gets
   a sign-in link and does **not** need a GitHub account of her own.

3. **Check the Action can push.** In the repository, under
   *Settings → Actions → General → Workflow permissions*, make sure **Read and
   write permissions** is selected. Without it the resizing job runs but cannot
   commit, and nothing Sam saves will ever appear.

4. **Test it end to end before handing it over.** Add a painting yourself through
   the CMS with a deliberately huge photograph, and confirm that: the Action runs
   green in the Actions tab, `content/gallery.json` gains an entry, the resized
   files appear under `images/paintings/`, `images/uploads/` is emptied again,
   and the painting shows up on the site. Then delete it.

If the Action fails, its log says which painting and why. The script is written
to name the problem rather than fail silently.

---

## Layout of the files

```
index.html  gallery.html  about.html  contact.html  404.html
.pages.yml                  what Sam sees in the CMS, labels, help text, fields
GUIDE-FOR-SAM.md            her instructions, in plain English
content/paintings.json      SOURCE: what Sam edits
content/settings.json       SOURCE: hero picture and headline
content/gallery.json        GENERATED: what the website reads, don't hand-edit
css/style.css               colours, type and layout, all the design lives here
js/gallery.js               builds the grids, runs the lightbox
js/main.js                  header, mobile menu, scroll reveals
images/paintings/<slug>/    web-sized paintings, several widths each
images/uploads/             where CMS uploads land; emptied by the Action
images/site/                logo files, social-share image
brand/                      the logo master as supplied
fonts/                      Fraunces + Inter, self-hosted (licence included)
originals/                  full-size masters, not published
scripts/process_content.py  resizes uploads, writes content/gallery.json
scripts/build_pages.py      rewrites the home page hero
scripts/resize-images.py    standalone resizer, for one-offs
.github/workflows/          the Action that runs the two scripts on save
```

Colours and spacing are CSS custom properties at the top of `css/style.css`. The
accent colour (`--accent`, `#50693b`) is the green of Sam's signature logo, and
`--accent-soft` is a lighter tint of it used where the base green would go muddy
against the dark hero. Everything else is a warm neutral, so the paintings supply
the colour.

### Brand assets

`brand/sam-rudd-logo.png` is the master supplied by Sam, green artwork on a solid
white background. It is kept for reference and is **not** used by the site directly:
its white background would show as a white box against the warm paper colour.

The two files the site actually loads were cut from it, with the white knocked out
to transparency and the ink set to exactly `--accent`:

- `images/site/logo-signature.png`: the signature alone, used in the header
- `images/site/logo-lockup.png`: the signature plus the SAM RUDD wordmark, used in the footer

Both are around 2.5× the size they ever render at, so they stay sharp on retina
screens without needing separate `@2x` files. If you ever get a vector (SVG) version
of the logo, it's worth swapping in, because it would be smaller and sharper at every size.

The favicon is a plain "SR" in the brand green, not the signature. The signature's
thin, flowing strokes turn to mush at 16-32px; the letterforms stay readable.

---

## Publishing

Any static host will serve this as-is, drag the folder onto Netlify, or point
GitHub Pages / Vercel / Cloudflare Pages at the repository. There is nothing to
build and no server-side anything.

Two things to check on the host once deployed: that `404.html` is wired up as the
not-found page, and that HTTPS is on.

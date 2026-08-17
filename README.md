# Sam Rudd, portfolio site

A plain static site: HTML, one stylesheet, a little vanilla JavaScript. No
framework, no bundler, nothing to compile. What is in the folder is what the
browser receives.

Sam maintains the paintings herself through a free CMS, she never sees code.
Her instructions are in [GUIDE-FOR-SAM.md](GUIDE-FOR-SAM.md); this file is the
technical side.

**Running it locally** needs a web server, because the pages fetch their content
over the network and a browser blocks that from a `file://` page. Double-clicking
`index.html` shows an empty gallery. Instead:

```bash
python3 -m http.server 8123
```

---

## How content works

Paintings live in **Sanity**, not in this repository. The site reads them in the
browser when a page loads, so whatever Sam publishes is live on the next reload.
There is no build step and nothing to wait for.

```
Sam publishes in Sanity  ->  the next page load shows it
```

- **Studio** (what Sam sees): https://samrudd.sanity.studio
- **Project id**: `3zrcphqr`, dataset `production`, read publicly
- **Studio source**: `studio/`, deployed with `sanity deploy`

`js/gallery.js` queries the paintings, `js/hero.js` fills in the home page hero,
and `js/pages.js` fills in everything else: About, Studio, Exhibitions, Courses,
the contact details and the home page's text sections. `js/content.js` holds the
shared query helper and a small renderer for Sanity's rich text, which arrives as
structured data rather than HTML.

Everything is built with `createElement` and `textContent` rather than
`innerHTML`, deliberately: the text comes from a CMS, and pasting it as HTML
would let anything Sam typed change the structure of the page.

Images come from Sanity's CDN, resized by adding `?w=800` to the URL, which is
why there is no longer any resizing code here.

Requests use `cache: 'no-cache'`. Sanity's CDN sends `max-age=3`, and without
revalidating, a reload straight after an edit can show the old content, which
defeats the point of reading live. The CDN itself reflects a change in under two
seconds, measured.

**Two consequences worth knowing.** The site now needs Sanity to be reachable: if
it is down or the free tier changes, the pages have no paintings, and they say so
rather than showing an empty gallery. And the artwork no longer lives in your
repository. The copies under `images/paintings/` are kept deliberately as an
offline archive of what was there at the time of the move, even though nothing
loads them any more.

**Changing what Sam sees** means editing `studio/schemaTypes/painting.ts` and
running `npm run deploy` in `studio/`. That needs Node 22 or newer; the Mac this
was built on had Node 20, so use a version manager rather than replacing it.

**CORS.** Browser requests to Sanity only work from allowlisted addresses. The
localhost dev server, the github.io URL, the vercel.app URL and the live
subdomain are already added. A new address needs
`npx sanity cors add <origin>` from `studio/`.

---

## Before this goes live

These are the placeholders that need replacing. Nothing here blocks previewing the
site locally, but all of it should be sorted before you point a domain at it.

- [ ] **Painting titles are guesses.** The photographs are Sam's real work, but they
      arrived with only filenames, so every `title` in `content/paintings/` is a
      working title. One is untitled entirely (the camera called it `dsc04164`).
      `year`, `medium` and `dimensions` are left blank on purpose. The site omits
      whatever is empty, so they can be filled in gradually. Do not invent them.
- [ ] **No painting has a date yet**, so the gallery is showing them in their
      original order rather than newest first. Dates are what drive the ordering
      now, so they are worth adding as Sam confirms them.
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
- [x] **The domain** is set to `https://samrudd.moveconsultingpartners.com` across
      the canonical tags, `og:` tags, `sitemap.xml` and `robots.txt`. If it ever
      moves, for instance to a domain of Sam's own, do not edit those by hand, run
      `python3 scripts/set_domain.py newdomain.com` so they cannot drift apart.
- [ ] **The contact form** currently opens the visitor's email app. To have messages
      arrive as email instead, create a free form endpoint (Formspree or Web3Forms)
      and paste the URL into the `ENDPOINT` variable near the bottom of
      `contact.html`. Then send yourself a test message.
- [ ] **`robots.txt` currently blocks all search engines**, deliberately, because the
      placeholder bio and exhibition list must not get indexed under Sam's real
      name. Reverse it (instructions are in the file) as the last step before
      launch, or the finished site will be invisible to Google.

---

## Giving Sam access

Everything is set up. What remains needs your Sanity account:

1. Open [sanity.io/manage](https://sanity.io/manage), choose the **Sam Rudd**
   project, then **Members**, and invite her by email address.
2. She signs in at [samrudd.sanity.studio](https://samrudd.sanity.studio) with
   Google, GitHub or an email link. She does **not** need a GitHub account, and
   nothing is installed on her machine.
3. Give her [GUIDE-FOR-SAM.md](GUIDE-FOR-SAM.md).

Invite her as an **Editor**, not an Administrator. Editors do not see the Vision
tab, which is a query playground that is useful for debugging and confusing to
everyone else. `sanity.config.ts` filters it by role rather than removing it, so
it is still there for you.

The free plan covers 20 users, 10,000 documents and 100GB of images, which is far
more than this site will use.

---

## Layout of the files

```
index.html  paintings.html  about.html  contact.html  404.html
exhibitions.html  courses.html  studio.html   empty placeholders, noindex
css/style.css               colours, type and layout, all the design lives here
js/gallery.js               queries Sanity, builds the grids, runs the lightbox
js/hero.js                  fills the home page hero from Sanity
js/main.js                  header, mobile menu, scroll reveals
studio/                     the Sanity Studio: schema, config, one-off importer
images/paintings/           archive of the artwork as it was before the move
images/site/                logo files, social-share image
brand/                      the logo master as supplied
fonts/                      Fraunces + Inter, self-hosted (licence included)
originals/                  full-size masters, not published
scripts/set_domain.py       points canonical/social/sitemap URLs at a domain
vercel.json                 caching, security headers and the old gallery redirect
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

## Publishing on Vercel with a custom domain

The site is plain static files, so Vercel needs no build step. `vercel.json`
sets the caching and security headers.

Note that `vercel.json` is strict JSON and rejects any key it does not
recognise, including comments, so the reasoning behind the cache rules lives
here instead:

| Path | Cache | Why |
| --- | --- | --- |
| `/fonts/` | 1 year, immutable | The font files never change. |
| `/images/` | 1 day | Paintings keep the same filename when a photograph is replaced, so a longer cache would keep serving the old photo after Sam swaps it. |
| `/content/` | never | This is the file that changes when Sam saves. Caching it would hide new paintings. |
| everything | no cache rule | Vercel's defaults for HTML are fine; the rule here only adds security headers. |

These steps need your accounts, so they have to be done by you:

1. **Import the repository.** At [vercel.com/new](https://vercel.com/new), sign
   in with GitHub and import `SamRudd`. Leave every build setting empty: no
   framework, no build command, output directory `.`. Deploy.

2. **Add the domain.** In the project, go to *Settings, Domains* and add your
   domain. Add both the bare domain and the `www` version; Vercel will offer to
   redirect one to the other. Pick whichever you want as the real address and
   make sure it matches step 4.

3. **Point DNS at Vercel.** At your registrar, add the records Vercel shows you.
   Usually that is an `A` record for the bare domain pointing at `76.76.21.21`,
   and a `CNAME` for `www` pointing at `cname.vercel-dns.com`. Vercel's screen is
   the authority; use what it tells you rather than these examples. Propagation
   is normally minutes but can take a few hours. HTTPS is issued automatically
   once the records resolve.

4. **Tell the site its own address**, so the canonical links, social preview tags
   and sitemap all agree:

   ```bash
   python3 scripts/set_domain.py samrudd.moveconsultingpartners.com
   ```

   Commit and push. Use the exact form you chose in step 2, with or without the
   `www`.

5. **Turn GitHub Pages off** in the repository settings, under *Pages*. Leaving
   both live means two copies of the same site on different addresses, which
   splits search ranking between them.

After this, every push to `main` deploys automatically, including the commits
the content workflow makes when Sam adds a painting. Nothing else changes: Pages
CMS still writes to the same repository, and the resizing Action still runs.


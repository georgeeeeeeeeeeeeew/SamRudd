/**
 * Load the nine existing paintings into Sanity, so the trial can be judged on
 * Sam's real work rather than an empty screen.
 *
 * Reads the markdown files the current CMS uses, uploads the largest image we
 * have for each painting, and creates one Sanity document per painting.
 *
 * Safe to run more than once: each document uses a fixed id derived from the
 * slug, so a second run updates rather than duplicating.
 *
 *   npx sanity exec import-existing.mjs --with-user-token
 */

import {createRequire} from 'node:module'

// sanity/cli lists getCliClient among its CommonJS exports but does not
// re-export it for ESM, so reach it through require rather than import.
const {getCliClient} = createRequire(import.meta.url)('sanity/cli')
import {readFileSync, readdirSync, existsSync, statSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PAINTINGS_DIR = join(ROOT, 'content', 'paintings')
const IMAGES_DIR = join(ROOT, 'images', 'paintings')
const ORIGINALS_DIR = join(ROOT, 'originals')

// Uses the logged-in CLI session, so there is no write token to create,
// paste around, or accidentally commit.
const client = getCliClient({apiVersion: '2024-01-01'})

/** Minimal YAML frontmatter reader: these files only hold flat key/value pairs. */
function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return null
  const out = {}
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([A-Za-z_]+):\s*(.*)$/)
    if (!m) continue
    let value = m[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value === 'true') value = true
    else if (value === 'false') value = false
    out[m[1]] = value
  }
  return out
}

/** Prefer the untouched original; fall back to the largest web copy. */
function bestImage(slug) {
  for (const ext of ['jpeg', 'jpg', 'png']) {
    const original = join(ORIGINALS_DIR, `${slug}.${ext}`)
    if (existsSync(original)) return original
  }
  const dir = join(IMAGES_DIR, slug)
  if (!existsSync(dir)) return null
  const jpgs = readdirSync(dir)
    .filter((f) => f.endsWith('.jpg'))
    .map((f) => ({file: join(dir, f), width: parseInt(f.match(/-(\d+)\.jpg$/)?.[1] || '0', 10)}))
    .sort((a, b) => b.width - a.width)
  return jpgs[0]?.file || null
}

const files = readdirSync(PAINTINGS_DIR).filter((f) => f.endsWith('.md')).sort()
console.log(`Found ${files.length} paintings to import.\n`)

for (const file of files) {
  const slug = file.replace(/\.md$/, '')
  const data = frontmatter(readFileSync(join(PAINTINGS_DIR, file), 'utf8'))
  if (!data) {
    console.log(`  skip ${slug}: no frontmatter`)
    continue
  }

  const imagePath = bestImage(slug)
  if (!imagePath) {
    console.log(`  skip ${slug}: no image found`)
    continue
  }

  const kb = Math.round(statSync(imagePath).size / 1024)
  process.stdout.write(`  ${slug}: uploading ${kb}KB… `)
  const asset = await client.assets.upload('image', readFileSync(imagePath), {
    filename: `${slug}.jpg`,
  })

  await client.createOrReplace({
    _id: `painting-${slug}`,
    _type: 'painting',
    title: data.title || slug,
    slug: {_type: 'slug', current: slug},
    alt: data.alt || '',
    year: data.year || '',
    medium: data.medium || '',
    dimensions: data.dimensions || '',
    series: data.series || undefined,
    featured: Boolean(data.featured),
    pinned: Boolean(data.pinned),
    draft: Boolean(data.draft),
    date: data.date || undefined,
    photo: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
  })
  console.log('done')
}

// Mirror the current front-page settings so the trial is a like-for-like copy.
const settings = JSON.parse(readFileSync(join(ROOT, 'content', 'settings.json'), 'utf8'))
await client.createOrReplace({
  _id: 'siteSettings',
  _type: 'siteSettings',
  heroHeadingLine1: settings.heroHeadingLine1,
  heroHeadingLine2: settings.heroHeadingLine2,
  heroTagline: settings.heroTagline,
  hero: {_type: 'reference', _ref: `painting-${settings.heroSlug}`},
})

console.log('\nFront page settings imported. Done.')

/**
 * Put the copy that is currently written into the HTML into Sanity, so the
 * pages look exactly the same after they start reading from it.
 *
 * Run once. Safe to repeat: fixed document ids mean a second run overwrites
 * rather than duplicating, though it would also undo anything Sam had since
 * changed, so do not repeat it casually.
 *
 *   npx sanity exec import-pages.mjs --with-user-token
 */

import {createRequire} from 'node:module'

const {getCliClient} = createRequire(import.meta.url)('sanity/cli')
const client = getCliClient({apiVersion: '2024-01-01'})

/** Turn plain paragraphs into the block format Sanity stores rich text in. */
function blocks(paragraphs) {
  return paragraphs.map((text, i) => ({
    _type: 'block',
    _key: `b${i}`,
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: `s${i}`, text, marks: []}],
  }))
}

const docs = [
  {
    _id: 'page-about',
    _type: 'page',
    title: 'About',
    heading: 'Sam Rudd',
    lede: 'Contemporary British landscape painter.',
    body: blocks([
      'Sam Rudd is a contemporary British landscape painter, drawing inspiration from the coast, countryside and places encountered along the way.',
      'Her paintings often begin with familiar scenes: boats pulled up on the sand, a church across the water, open fields and weathered hillsides. Rather than describing every detail, Sam works with loose marks, layered colour and memory to capture the character and atmosphere of a place.',
      'The result sits somewhere between observation and recollection, allowing the landscape to remain recognisable while leaving space for colour, shape and feeling to take over.',
    ]),
  },
  {
    _id: 'page-studio',
    _type: 'page',
    title: 'Studio',
    heading: 'Studio',
    lede: 'A look inside the studio and how the paintings are made will appear here.',
    body: [],
  },
  {
    _id: 'contactDetails',
    _type: 'contactDetails',
    heading: 'Get in touch',
    lede: 'For exhibition, press and other professional enquiries, please get in touch. Sam reads every message and usually replies within a few days.',
    email: 'hello@samrudd.co.uk',
    location: 'United Kingdom',
    instagramUrl: 'https://www.instagram.com/',
    galleryNote:
      "For enquiries relating to the purchase or availability of paintings, please contact Sam's partnered gallery directly.",
  },
]

for (const doc of docs) {
  await client.createOrReplace(doc)
  console.log(`  wrote ${doc._id}`)
}

// The front page keeps whatever hero settings are already there; only the
// section copy is added, so re-running cannot wipe a hero choice.
await client
  .patch('siteSettings')
  .set({
    featuredEyebrow: 'Selected work',
    featuredHeading: 'Featured',
    featuredIntro:
      'A selection of work inspired by the colours, textures and atmosphere of the British coast and countryside.',
    aboutHeading: 'About the artist',
    aboutLede:
      'Sam Rudd is a contemporary British landscape painter, drawing inspiration from the coast, countryside and places encountered along the way.',
    aboutBody:
      'Her paintings explore the shapes, colours and atmosphere of the landscape, from boats resting on the shore to distant churches, open fields and weathered hillsides. Working with loose marks and layered colour, each painting captures a sense of place without describing every detail.',
    aboutImage: {_type: 'reference', _ref: 'painting-saint-sand-sea'},
    footerHeading: 'Enquiries welcome',
    footerNote: 'For exhibition, press and other professional enquiries, please get in touch.',
    footerTagline: 'Contemporary British landscape painter',
  })
  .commit()
console.log('  patched siteSettings')

console.log('\nDone.')

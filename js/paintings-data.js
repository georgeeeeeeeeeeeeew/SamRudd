/* ==========================================================================
   The paintings.
   This file is the single source of truth for the whole site — the home page
   and the gallery both build themselves from it. To add a painting:

     1. python3 scripts/resize-images.py originals/your-photo.jpg some-slug
     2. paste the entry it prints at the top of the list below
     3. fill in the title / year / medium / dimensions / alt text

   Newest first. `featured: true` puts a painting on the home page.
   `alt` describes what the painting SHOWS — it is read aloud to visitors
   using a screen reader, and it is how the work gets found in image search.

   ---------------------------------------------------------------------------
   NEEDS SAM'S INPUT. These are her real paintings, but the only information
   that came with the photographs was their filenames. So:

     - every `title` below is a working title guessed from the filename and
       needs confirming (one was named only "dsc04164" by the camera, so it
       has no title at all yet)
     - `year`, `medium` and `dimensions` are deliberately left empty rather
       than invented — the site simply omits whatever is blank, so filling
       them in is safe to do a few at a time
     - `alt` text describes what is visible in each painting and is safe to
       keep as-is, though Sam may prefer her own wording

   Several photographs also show the frame and a bit of the wall behind, while
   others show the bare canvas. Re-photographing the set consistently would do
   more for how this page looks than any amount of code.
   ========================================================================== */

const PAINTINGS = [
  {
    slug: "blue-boats",
    title: "Blue Boats",
    year: "",
    medium: "",
    dimensions: "",
    series: "Coastal",
    featured: true,
    width: 1280,
    height: 956,
    widths: [400, 800, 1200, 1280],
    alt: "Two blue rowing boats drawn up on pale sand, with cottages and dark trees on the bank behind them.",
  },
  {
    slug: "boats-at-cove",
    title: "Boats at the Cove",
    year: "",
    medium: "",
    dimensions: "",
    series: "Coastal",
    featured: true,
    width: 608,
    height: 480,
    widths: [400, 608],
    alt: "A pink and a grey-green boat resting on soft pink sand below a headland of white cottages, with green sea beyond.",
  },
  {
    slug: "red-boat",
    title: "Red Boat",
    year: "",
    medium: "",
    dimensions: "",
    series: "Coastal",
    featured: true,
    width: 592,
    height: 480,
    widths: [400, 592],
    alt: "A red upturned boat in the foreground of a sheltered harbour, two fishing boats on blue water and a cottage under green hills.",
  },
  {
    slug: "church-in-sea",
    title: "Church by the Sea",
    year: "",
    medium: "",
    dimensions: "",
    series: "Coastal",
    featured: true,
    width: 481,
    height: 593,
    widths: [400, 481],
    alt: "A small pale church on a far shore across still water, seen over deep green marshland flecked with wildflowers.",
  },
  {
    slug: "fields-on-hill",
    title: "Fields on the Hill",
    year: "",
    medium: "",
    dimensions: "",
    series: "Landscape",
    featured: true,
    width: 615,
    height: 480,
    widths: [400, 615],
    alt: "A patchwork hillside of pink, green and yellow fields, with fence posts running along the ridge under a pale sky.",
  },
  {
    slug: "summit",
    title: "Summit",
    year: "",
    medium: "",
    dimensions: "",
    series: "Landscape",
    featured: true,
    width: 480,
    height: 484,
    widths: [400, 480],
    alt: "An abstracted green hillside broken into soft blocks of moss, lime and dusty pink, with a pale track falling through the middle.",
  },
  {
    slug: "through-dunes",
    title: "Through the Dunes",
    year: "",
    medium: "",
    dimensions: "",
    series: "Coastal",
    featured: false,
    width: 485,
    height: 480,
    widths: [400, 485],
    alt: "A dune landscape worked in cream, chalk blue and olive, with thin runs of paint falling down the surface like rain.",
  },
  {
    slug: "saint-sand-sea",
    title: "Saint, Sand and Sea",
    year: "",
    medium: "",
    dimensions: "",
    series: "Coastal",
    featured: false,
    width: 481,
    height: 606,
    widths: [400, 481],
    alt: "A pale dune rising to a ridge, painted in soft pinks and cream with olive grasses and scattered dark marks.",
  },
  {
    // Untitled — the camera named this file, so it needs a title from Sam.
    slug: "dsc04164",
    title: "Untitled (Green Valley)",
    year: "",
    medium: "",
    dimensions: "",
    series: "Landscape",
    featured: false,
    width: 600,
    height: 480,
    widths: [400, 600],
    alt: "A deep green valley of layered fields and hedgerows, with flashes of rust and lilac among the greens.",
  },
];

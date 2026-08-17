import {defineField, defineType} from 'sanity'

/** Everything on the home page that is not a painting. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Front page',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'featured', title: 'Featured work'},
    {name: 'about', title: 'About'},
    {name: 'footer', title: 'Footer'},
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero image',
      type: 'reference',
      to: [{type: 'painting'}],
      group: 'hero',
      description:
        'A wide, landscape-shaped painting works best, because it is cropped into a broad ' +
        'band. A tall one loses its top and bottom.',
    }),
    defineField({
      name: 'heroHeading',
      title: 'Headline',
      type: 'text',
      rows: 2,
      group: 'hero',
      description: 'Press return to break the line where you want it.',
    }),
    defineField({
      name: 'heroTagline',
      title: 'Standfirst',
      type: 'text',
      rows: 2,
      group: 'hero',
      description: 'One sentence below the headline. It sits over the painting, so keep it short.',
    }),

    defineField({name: 'featuredEyebrow', title: 'Eyebrow', type: 'string', group: 'featured',
      description: 'The small uppercase line above the heading.'}),
    defineField({name: 'featuredHeading', title: 'Heading', type: 'string', group: 'featured'}),
    defineField({name: 'featuredIntro', title: 'Intro', type: 'text', rows: 3, group: 'featured'}),

    defineField({name: 'aboutHeading', title: 'Heading', type: 'string', group: 'about'}),
    defineField({name: 'aboutLede', title: 'Standfirst', type: 'text', rows: 3, group: 'about'}),
    defineField({name: 'aboutBody', title: 'Body', type: 'text', rows: 5, group: 'about'}),
    defineField({
      name: 'aboutImage',
      title: 'Image',
      type: 'reference',
      to: [{type: 'painting'}],
      group: 'about',
      description: 'A painting to sit next to the About text, until there is a photograph of you.',
    }),

    defineField({name: 'footerHeading', title: 'Heading', type: 'string', group: 'footer'}),
    defineField({name: 'footerNote', title: 'Intro', type: 'text', rows: 2, group: 'footer'}),
    defineField({name: 'footerTagline', title: 'Strapline', type: 'string', group: 'footer',
      description: 'Sits beside the copyright line.'}),
  ],
  preview: {prepare: () => ({title: 'Front page'})},
})

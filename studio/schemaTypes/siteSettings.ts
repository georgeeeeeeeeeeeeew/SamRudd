import {defineField, defineType} from 'sanity'

/** The handful of front-page settings, kept as a single document. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Front page',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Large picture at the top',
      type: 'reference',
      to: [{type: 'painting'}],
      description:
        'Pick the painting to show across the top of the home page. A wide, landscape-shaped ' +
        'one works best, because it is cropped into a broad band.',
    }),
    defineField({name: 'heroHeadingLine1', title: 'Heading, first line', type: 'string'}),
    defineField({name: 'heroHeadingLine2', title: 'Heading, second line', type: 'string'}),
    defineField({
      name: 'heroTagline',
      title: 'Sentence underneath',
      type: 'text',
      rows: 2,
      description: 'Keep it short, as it sits over the painting.',
    }),
  ],
  preview: {prepare: () => ({title: 'Front page'})},
})

import {defineField, defineType} from 'sanity'

/** Everything on the home page that is not a painting. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Front page',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Top of the page', default: true},
    {name: 'featured', title: 'Selected work'},
    {name: 'about', title: 'About section'},
    {name: 'footer', title: 'Footer'},
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Large picture at the top',
      type: 'reference',
      to: [{type: 'painting'}],
      group: 'hero',
      description:
        'A wide, landscape-shaped painting works best, because it is cropped into a broad ' +
        'band. A tall one loses its top and bottom.',
    }),
    defineField({name: 'heroHeadingLine1', title: 'Heading, first line', type: 'string', group: 'hero'}),
    defineField({name: 'heroHeadingLine2', title: 'Heading, second line', type: 'string', group: 'hero'}),
    defineField({
      name: 'heroTagline',
      title: 'Sentence underneath',
      type: 'text',
      rows: 2,
      group: 'hero',
      description: 'Keep it short, as it sits over the painting.',
    }),

    defineField({name: 'featuredEyebrow', title: 'Small label', type: 'string', group: 'featured',
      description: 'The little uppercase words above the heading.'}),
    defineField({name: 'featuredHeading', title: 'Heading', type: 'string', group: 'featured'}),
    defineField({name: 'featuredIntro', title: 'Sentence underneath', type: 'text', rows: 3, group: 'featured'}),

    defineField({name: 'aboutHeading', title: 'Heading', type: 'string', group: 'about'}),
    defineField({name: 'aboutLede', title: 'Opening line', type: 'text', rows: 3, group: 'about'}),
    defineField({name: 'aboutBody', title: 'Paragraph', type: 'text', rows: 5, group: 'about'}),
    defineField({
      name: 'aboutImage',
      title: 'Picture beside the text',
      type: 'reference',
      to: [{type: 'painting'}],
      group: 'about',
      description: 'A painting to sit next to the About text, until there is a photograph of you.',
    }),

    defineField({name: 'footerHeading', title: 'Heading', type: 'string', group: 'footer'}),
    defineField({name: 'footerNote', title: 'Sentence underneath', type: 'text', rows: 2, group: 'footer'}),
    defineField({name: 'footerTagline', title: 'Line at the very bottom', type: 'string', group: 'footer',
      description: 'Sits next to the copyright.'}),
  ],
  preview: {prepare: () => ({title: 'Front page'})},
})

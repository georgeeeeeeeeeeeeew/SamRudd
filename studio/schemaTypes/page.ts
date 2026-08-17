import {defineField, defineType} from 'sanity'

/**
 * A page of writing: About and Studio.
 *
 * One type for both, keyed by which page it is, so there is a single place to
 * change how a page of prose behaves. The body is rich text, which is stored as
 * structured data rather than HTML, so Sam cannot accidentally break the layout
 * and nothing she types can inject markup into the page.
 */
export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page',
      type: 'string',
      readOnly: true,
      description: 'Which page this is.',
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'The small uppercase line above the heading.',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The main heading.',
    }),
    defineField({
      name: 'lede',
      title: 'Standfirst',
      type: 'text',
      rows: 2,
      description: 'The larger line under the heading.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Subheading', value: 'h2'},
          ],
          lists: [{title: 'Bullet', value: 'bullet'}],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'},
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Shown beside the body text.'
    }),
    defineField({
      name: 'imageAlt',
      title: 'Alt text',
      type: 'string',
      description: 'Describes the image for screen readers.',
    }),
  ],
  preview: {
    select: {title: 'title', media: 'image'},
    prepare: ({title, media}) => ({title: title || 'Page', media}),
  },
})

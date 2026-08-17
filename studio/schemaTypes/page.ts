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
      description: 'Which page this is. Set when the page was created.',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'The large words at the top of the page.',
    }),
    defineField({
      name: 'lede',
      title: 'Opening line',
      type: 'text',
      rows: 2,
      description: 'The slightly larger sentence under the heading. Optional.',
    }),
    defineField({
      name: 'body',
      title: 'Text',
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
      title: 'Picture',
      type: 'image',
      options: {hotspot: true},
      description: 'Shown beside the text. A photograph of you works well here.',
    }),
    defineField({
      name: 'imageAlt',
      title: 'Description of the picture',
      type: 'string',
      description: 'What the picture shows, read aloud to blind visitors.',
    }),
  ],
  preview: {
    select: {title: 'title', media: 'image'},
    prepare: ({title, media}) => ({title: title || 'Page', media}),
  },
})

import {defineField, defineType} from 'sanity'

/** The contact page's details, as fields rather than prose. */
export const contactDetails = defineType({
  name: 'contactDetails',
  title: 'Contact details',
  type: 'document',
  fields: [
    defineField({name: 'heading', title: 'Heading', type: 'string'}),
    defineField({name: 'lede', title: 'Opening line', type: 'text', rows: 3}),
    defineField({
      name: 'email',
      title: 'Email address',
      type: 'string',
      description: 'Shown on the page and used by the enquiry form.',
    }),
    defineField({name: 'location', title: 'Studio', type: 'string', description: 'For example "North Yorkshire, United Kingdom".'}),
    defineField({name: 'instagramUrl', title: 'Instagram link', type: 'url'}),
    defineField({
      name: 'galleryNote',
      title: 'Note about buying',
      type: 'text',
      rows: 3,
      description: 'The line pointing purchase enquiries at the gallery.',
    }),
  ],
  preview: {prepare: () => ({title: 'Contact details'})},
})

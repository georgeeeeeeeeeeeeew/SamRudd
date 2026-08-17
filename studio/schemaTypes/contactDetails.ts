import {defineField, defineType} from 'sanity'

/** Everything written on the contact page, including the form's wording. */
export const contactDetails = defineType({
  name: 'contactDetails',
  title: 'Contact details',
  type: 'document',
  groups: [
    {name: 'header', title: 'Header', default: true},
    {name: 'details', title: 'Details'},
    {name: 'form', title: 'Form'},
  ],
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', group: 'header',
      description: 'The small uppercase line above the heading.'}),
    defineField({name: 'heading', title: 'Heading', type: 'string', group: 'header'}),
    defineField({name: 'lede', title: 'Standfirst', type: 'text', rows: 3, group: 'header'}),

    defineField({name: 'emailLabel', title: 'Email label', type: 'string', group: 'details',
      description: 'The small heading above the address.'}),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'details',
      description: 'Shown on the page and used by the enquiry form.',
    }),

    defineField({name: 'studioLabel', title: 'Studio label', type: 'string', group: 'details'}),
    defineField({name: 'location', title: 'Studio', type: 'string', group: 'details',
      description: 'For example "North Yorkshire, United Kingdom".'}),

    defineField({name: 'linksLabel', title: 'Links label', type: 'string', group: 'details',
      description: 'The small heading above the links, for example "Elsewhere".'}),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      group: 'details',
      description: 'Instagram, a gallery, anywhere else. Add as many as you like.',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'label', title: 'Label', type: 'string', validation: (r) => r.required()},
            {name: 'url', title: 'URL', type: 'url', validation: (r) => r.required()},
          ],
          preview: {
            select: {title: 'label', subtitle: 'url'},
          },
        },
      ],
    }),

    defineField({
      name: 'galleryNote',
      title: 'Sales note',
      type: 'text',
      rows: 3,
      group: 'details',
      description: 'Directs purchase enquiries to the gallery.',
    }),

    defineField({name: 'formNameLabel', title: 'Name field', type: 'string', group: 'form'}),
    defineField({name: 'formEmailLabel', title: 'Email field', type: 'string', group: 'form'}),
    defineField({name: 'formMessageLabel', title: 'Message field', type: 'string', group: 'form'}),
    defineField({
      name: 'privacyNote',
      title: 'Privacy note',
      type: 'text',
      rows: 3,
      group: 'form',
      description: 'The small print under the form, saying what happens to what is sent.',
    }),
    defineField({
      name: 'formSuccess',
      title: 'Sent message',
      type: 'string',
      group: 'form',
      description: 'Shown once a message has gone through.',
    }),
    defineField({
      name: 'formError',
      title: 'Failed message',
      type: 'string',
      group: 'form',
      description: 'Shown if sending fails. The email address is added to the end automatically.',
    }),
    defineField({
      name: 'formIncomplete',
      title: 'Missing fields message',
      type: 'string',
      group: 'form',
      description: 'Shown when someone presses send with a field still empty.',
    }),
  ],
  preview: {prepare: () => ({title: 'Contact details'})},
})

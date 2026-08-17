import {defineField, defineType} from 'sanity'

/**
 * An exhibition.
 *
 * A list rather than a page of prose, because Sam will add one every time a
 * show is booked and typing into fields is easier than editing a paragraph.
 * The site works out on its own whether a show is upcoming or past from the
 * dates, so there is nothing to move between sections by hand.
 */
export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'string',
      description: 'For example "Portland Gallery".',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
    }),
    defineField({
      name: 'startDate',
      title: 'Start date',
      type: 'date',
      options: {dateFormat: 'D MMMM YYYY'},
      description: 'Orders the list and decides whether the show is upcoming or past.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End date',
      type: 'date',
      options: {dateFormat: 'D MMMM YYYY'},
      description: 'Leave empty for a single-day event.',
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'Link to the gallery listing, if there is one.',
    }),
    defineField({
      name: 'note',
      title: 'Notes',
      type: 'text',
      rows: 3,
      description: 'Optional. A sentence or two about the show.',
    }),
    defineField({
      name: 'draft',
      title: 'Hidden',
      type: 'boolean',
      initialValue: false,
      description: 'Keeps it off the website.',
    }),
  ],

  orderings: [
    {
      title: 'Most recent first',
      name: 'startDesc',
      by: [{field: 'startDate', direction: 'desc'}],
    },
  ],

  preview: {
    select: {title: 'title', venue: 'venue', startDate: 'startDate', draft: 'draft'},
    prepare({title, venue, startDate, draft}) {
      const when = startDate ? new Date(startDate).getFullYear() : 'No date'
      return {
        title,
        subtitle: [draft ? 'Hidden' : null, venue, when].filter(Boolean).join(' · '),
      }
    },
  },
})

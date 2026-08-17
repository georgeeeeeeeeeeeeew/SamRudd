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
      title: 'Exhibition name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'venue',
      title: 'Gallery or venue',
      type: 'string',
      description: 'For example "Portland Gallery".',
    }),
    defineField({
      name: 'location',
      title: 'Town or city',
      type: 'string',
    }),
    defineField({
      name: 'startDate',
      title: 'Starts',
      type: 'date',
      options: {dateFormat: 'D MMMM YYYY'},
      description:
        'Used to order the list, and to work out whether a show is still to come.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Ends',
      type: 'date',
      options: {dateFormat: 'D MMMM YYYY'},
      description: 'Leave empty for a one-day event.',
    }),
    defineField({
      name: 'url',
      title: 'Link',
      type: 'url',
      description: "The gallery's page for the show, if there is one.",
    }),
    defineField({
      name: 'note',
      title: 'Anything else',
      type: 'text',
      rows: 3,
      description: 'A sentence or two, if the show needs explaining. Optional.',
    }),
    defineField({
      name: 'draft',
      title: 'Hide for now',
      type: 'boolean',
      initialValue: false,
      description: 'Keeps it off the website until you are ready.',
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

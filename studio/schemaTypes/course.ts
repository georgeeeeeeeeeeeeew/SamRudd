import {defineField, defineType} from 'sanity'

/** A painting course or workshop. A list, for the same reason exhibitions are. */
export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'startDate',
      title: 'Start date',
      type: 'date',
      options: {dateFormat: 'D MMMM YYYY'},
      description: 'Orders the list. Courses drop off the page once past.',
      validation: (r) => r.required(),
    }),
    defineField({name: 'endDate', title: 'End date', type: 'date', options: {dateFormat: 'D MMMM YYYY'},
      description: 'Leave empty for a single-day course.'}),
    defineField({name: 'location', title: 'Location', type: 'string'}),
    defineField({name: 'price', title: 'Price', type: 'string', description: 'For example "£120 a day". Optional.'}),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block', styles: [{title: 'Normal', value: 'normal'}], lists: [{title: 'Bullet', value: 'bullet'}]}],
    }),
    defineField({name: 'bookingUrl', title: 'Booking URL', type: 'url'}),
    defineField({name: 'soldOut', title: 'Sold out', type: 'boolean', initialValue: false}),
    defineField({name: 'draft', title: 'Hidden', type: 'boolean', initialValue: false}),
  ],
  orderings: [{title: 'Soonest first', name: 'startAsc', by: [{field: 'startDate', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', startDate: 'startDate', soldOut: 'soldOut', draft: 'draft'},
    prepare({title, startDate, soldOut, draft}) {
      const when = startDate ? new Date(startDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'}) : 'No date'
      return {title, subtitle: [draft ? 'Hidden' : null, when, soldOut ? 'Fully booked' : null].filter(Boolean).join(' · ')}
    },
  },
})

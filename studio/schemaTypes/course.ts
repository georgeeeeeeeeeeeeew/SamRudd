import {defineField, defineType} from 'sanity'

/** A painting course or workshop. A list, for the same reason exhibitions are. */
export const course = defineType({
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Course name', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'startDate',
      title: 'Date',
      type: 'date',
      options: {dateFormat: 'D MMMM YYYY'},
      description: 'Used to order the list and to drop courses off once they have passed.',
      validation: (r) => r.required(),
    }),
    defineField({name: 'endDate', title: 'Ends', type: 'date', options: {dateFormat: 'D MMMM YYYY'},
      description: 'Leave empty for a single day.'}),
    defineField({name: 'location', title: 'Where', type: 'string'}),
    defineField({name: 'price', title: 'Price', type: 'string', description: 'For example "£120 a day". Leave empty to say nothing.'}),
    defineField({
      name: 'description',
      title: 'What it covers',
      type: 'array',
      of: [{type: 'block', styles: [{title: 'Normal', value: 'normal'}], lists: [{title: 'Bullet', value: 'bullet'}]}],
    }),
    defineField({name: 'bookingUrl', title: 'Booking link', type: 'url'}),
    defineField({name: 'soldOut', title: 'Fully booked', type: 'boolean', initialValue: false}),
    defineField({name: 'draft', title: 'Hide for now', type: 'boolean', initialValue: false}),
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

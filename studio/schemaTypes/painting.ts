import {defineField, defineType} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'

/**
 * A painting.
 *
 * The fields deliberately mirror the ones Sam already has in Pages CMS, using
 * the same wording, so the two can be compared fairly rather than one winning
 * because it was written more carefully.
 *
 * The part worth looking at is `preview` at the bottom: it is what turns the
 * document list into a column of thumbnails instead of a column of titles.
 */
export const painting = defineType({
  name: 'painting',
  title: 'Painting',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The name of the painting, as you would like it shown.',
      validation: (rule) => rule.required().warning('Every painting needs a title.'),
    }),

    defineField({
      name: 'photo',
      title: 'Photograph',
      type: 'image',
      description:
        'A photograph of the painting. Upload the biggest, sharpest version you have. ' +
        'There is no need to shrink it first.',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'alt',
      title: 'Description of the picture',
      type: 'text',
      rows: 3,
      description:
        'A sentence describing what the painting shows, for example "two blue boats on ' +
        'pale sand, with cottages behind". This is read aloud to blind visitors and is how ' +
        'the painting gets found in an image search, so describe the scene rather than ' +
        'repeating the title.',
      validation: (rule) => rule.required().warning('Without this the title is read aloud instead.'),
    }),

    defineField({
      name: 'slug',
      title: 'Web address name',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      description:
        'Made from the title. Leave it alone once a painting has been shared, or the link ' +
        'someone already has will stop working.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      options: {dateFormat: 'D MMMM YYYY'},
      description:
        'When it was painted. Shown on the painting, and useful for sorting the ' +
        'list here. The order on the website is set by dragging, not by this.',
    }),

    defineField({
      name: 'draft',
      title: 'Hide for now',
      type: 'boolean',
      initialValue: false,
      description: 'Keeps this painting off the website while you are still working on it.',
    }),

    defineField({
      name: 'featured',
      title: 'Show on the front page',
      type: 'boolean',
      initialValue: false,
      description: 'Around six works well. Every painting appears in the gallery either way.',
    }),

    defineField({
      name: 'series',
      title: 'Group',
      type: 'string',
      options: {list: ['Coastal', 'Landscape'], layout: 'radio'},
      description: 'Visitors use this to filter the gallery, so it is worth setting.',
    }),

    // Written by dragging in the Paintings list. Never edited by hand.
    orderRankField({type: 'painting'}),

    defineField({name: 'year', title: 'Year', type: 'string'}),
    defineField({name: 'medium', title: 'Medium', type: 'string', description: 'For example "Oil on canvas".'}),
    defineField({name: 'dimensions', title: 'Size', type: 'string', description: 'For example "60 x 80 cm".'}),
  ],

  orderings: [
    orderRankOrdering,
    {title: 'Newest first', name: 'dateDesc', by: [{field: 'date', direction: 'desc'}]},
    {title: 'Title', name: 'titleAsc', by: [{field: 'title', direction: 'asc'}]},
  ],

  /* This is the difference Sam will actually notice. `media` puts the painting
     itself next to every row, so she browses pictures rather than reading a
     list of names. */
  preview: {
    select: {
      title: 'title',
      date: 'date',
      series: 'series',
      draft: 'draft',
      media: 'photo',
    },
    prepare({title, date, series, draft, media}) {
      const bits = [
        draft ? 'Hidden' : null,
        date ? new Date(date).getFullYear() : null,
        series || null,
      ].filter(Boolean)
      return {title, subtitle: bits.join(' · '), media}
    },
  },
})

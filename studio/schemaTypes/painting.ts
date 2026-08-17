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
      description: 'As it should appear on the site.',
      validation: (rule) => rule.required().warning('Every painting needs a title.'),
    }),

    defineField({
      name: 'photo',
      title: 'Image',
      type: 'image',
      description: 'Upload the largest version you have. It is resized automatically.',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'text',
      rows: 3,
      description:
        'Describes the image for screen readers and image search, for example "two blue ' +
        'boats on pale sand, with cottages behind". Describe the scene rather than ' +
        'repeating the title.',
      validation: (rule) => rule.required().warning('Without this the title is read aloud instead.'),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      description:
        'The web address for this painting. Generated from the title. Changing it breaks ' +
        'any link already shared.',
      validation: (rule) => rule.required(),
    }),

    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      options: {dateFormat: 'D MMMM YYYY'},
      description: 'When it was painted. Shown alongside the work. Gallery order is set by dragging.',
    }),

    defineField({
      name: 'draft',
      title: 'Hidden',
      type: 'boolean',
      initialValue: false,
      description: 'Keeps this painting off the website.',
    }),

    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Shows on the home page. Around six works well. Every painting appears in the gallery regardless.',
    }),

    defineField({
      name: 'series',
      title: 'Category',
      type: 'string',
      options: {list: ['Coastal', 'Landscape'], layout: 'radio'},
      description: 'Used by the gallery filters.',
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

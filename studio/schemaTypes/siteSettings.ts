import {defineField, defineType} from 'sanity'

/** Everything on the home page that is not a painting. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Front page',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'featured', title: 'Featured work'},
    {name: 'about', title: 'About'},
    {name: 'footer', title: 'Footer'},
    {name: 'labels', title: 'Buttons'},
  ],
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero image',
      type: 'reference',
      to: [{type: 'painting'}],
      group: 'hero',
      description:
        'A wide, landscape-shaped painting works best, because it is cropped into a broad ' +
        'band. A tall one loses its top and bottom.',
    }),
    defineField({
      name: 'heroHeading',
      title: 'Headline',
      type: 'text',
      rows: 2,
      group: 'hero',
      description: 'Press return to break the line where you want it.',
    }),
    defineField({
      name: 'heroTagline',
      title: 'Standfirst',
      type: 'text',
      rows: 2,
      group: 'hero',
      description: 'One sentence below the headline. It sits over the painting, so keep it short.',
    }),

    defineField({name: 'featuredEyebrow', title: 'Eyebrow', type: 'string', group: 'featured',
      description: 'The small uppercase line above the heading.'}),
    defineField({name: 'featuredHeading', title: 'Heading', type: 'string', group: 'featured'}),
    defineField({name: 'featuredIntro', title: 'Intro', type: 'text', rows: 3, group: 'featured'}),

    defineField({name: 'aboutEyebrow', title: 'Eyebrow', type: 'string', group: 'about',
      description: 'The small uppercase line above the heading.'}),
    defineField({name: 'aboutHeading', title: 'Heading', type: 'string', group: 'about'}),
    defineField({name: 'aboutLede', title: 'Standfirst', type: 'text', rows: 3, group: 'about'}),
    defineField({name: 'aboutBody', title: 'Body', type: 'text', rows: 5, group: 'about'}),
    defineField({
      name: 'aboutImage',
      title: 'Image',
      type: 'reference',
      to: [{type: 'painting'}],
      group: 'about',
      description: 'A painting to sit next to the About text, until there is a photograph of you.',
    }),

    defineField({name: 'footerHeading', title: 'Heading', type: 'string', group: 'footer'}),
    defineField({name: 'footerNote', title: 'Intro', type: 'text', rows: 2, group: 'footer'}),
    defineField({name: 'footerTagline', title: 'Strapline', type: 'string', group: 'footer',
      description: 'Sits beside the copyright line.'}),

    /* The wording on every button and link. These rarely change, which is why
       they lived in the code, but leaving them there meant nobody but a
       developer could reword them. */
    defineField({name: 'labelViewGallery', title: 'View the gallery', type: 'string', group: 'labels',
      description: 'Under the hero, under Featured, and at the foot of the About page.'}),
    defineField({name: 'labelMoreAbout', title: 'More about Sam', type: 'string', group: 'labels',
      description: 'Under the About section on the home page.'}),
    defineField({name: 'labelContact', title: 'Contact Sam', type: 'string', group: 'labels',
      description: 'In the footer.'}),
    defineField({name: 'labelEmailDirect', title: 'Email directly', type: 'string', group: 'labels',
      description: 'In the footer of the contact page.'}),
    defineField({name: 'labelShowMore', title: 'Show more paintings', type: 'string', group: 'labels',
      description: 'The button at the foot of the gallery.'}),
    defineField({name: 'labelSendEnquiry', title: 'Send enquiry', type: 'string', group: 'labels',
      description: 'The submit button on the contact form.'}),
    defineField({name: 'labelGoToGallery', title: 'Go to the gallery', type: 'string', group: 'labels',
      description: 'On the page-not-found page.'}),
    defineField({name: 'labelBookPlace', title: 'Book a place', type: 'string', group: 'labels',
      description: 'On a course with a booking link.'}),
  ],
  preview: {prepare: () => ({title: 'Front page'})},
})

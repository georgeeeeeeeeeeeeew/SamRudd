import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

/* Pages that exist once rather than as a list. Each is opened directly from the
   sidebar instead of showing a list containing a single item, and each has its
   create/delete actions removed so there can never be a second one. */
const SINGLETONS = [
  {id: 'siteSettings', type: 'siteSettings', title: 'Front page'},
  {id: 'page-about', type: 'page', title: 'About page'},
  {id: 'page-studio', type: 'page', title: 'Studio page'},
  {id: 'contactDetails', type: 'contactDetails', title: 'Contact details'},
]

export default defineConfig({
  name: 'samrudd',
  title: 'Sam Rudd',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '3zrcphqr',
  dataset: 'production',

  plugins: [
    structureTool({
      // The sidebar is grouped the way the website is, so Sam is looking for
      // "the About page" rather than for a document type.
      structure: (S) =>
        S.list()
          .title('Website')
          .items([
            S.documentTypeListItem('painting').title('Paintings'),
            S.documentTypeListItem('exhibition').title('Exhibitions'),
            S.documentTypeListItem('course').title('Courses'),
            S.divider(),
            ...SINGLETONS.map(({id, type, title}) =>
              S.listItem()
                .title(title)
                .id(id)
                .child(S.document().schemaType(type).documentId(id).title(title)),
            ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) =>
      prev.filter((t) => !['siteSettings', 'contactDetails', 'page'].includes(t.schemaType)),
  },

  document: {
    actions: (prev, {schemaType}) =>
      ['siteSettings', 'contactDetails', 'page'].includes(schemaType)
        ? prev.filter(({action}) => !['unpublish', 'delete', 'duplicate'].includes(action as string))
        : prev,
  },
})

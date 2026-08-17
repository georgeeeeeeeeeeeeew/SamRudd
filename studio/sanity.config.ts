import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'samrudd',
  title: 'Sam Rudd',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '3zrcphqr',
  dataset: 'production',

  plugins: [
    structureTool({
      // Front page is a single document, so open it directly rather than
      // showing a list containing exactly one thing.
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('painting').title('Paintings'),
            S.divider(),
            S.listItem()
              .title('Front page')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Front page is a singleton, so keep it out of the "create new" menu.
    templates: (prev) => prev.filter((t) => t.schemaType !== 'siteSettings'),
  },

  document: {
    actions: (prev, {schemaType}) =>
      schemaType === 'siteSettings'
        ? prev.filter(({action}) => action !== 'unpublish' && action !== 'delete' && action !== 'duplicate')
        : prev,
  },
})

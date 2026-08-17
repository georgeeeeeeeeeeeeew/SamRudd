import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {visionTool} from '@sanity/vision'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {schemaTypes} from './schemaTypes'

/* Where the Preview tab points: the live site. Must be the full URL including
   any path, not just the host, or the path is dropped. */
const SITE_URL = 'https://sam-rudd.moveconsultingpartners.com/'

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
      structure: (S, context) =>
        S.list()
          .title('Website')
          .items([
            /* Drag-to-reorder. This replaces sorting the gallery by date with a
               pin for favourites, which was only ever a way of expressing an
               order without being able to drag one. */
            orderableDocumentListDeskItem({
              type: 'painting',
              title: 'Paintings',
              S,
              context,
            }),
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
    /* A Preview tab showing the actual website, because the obvious question
       after changing something is "what does it look like", and Vision answers
       a completely different one. */
    presentationTool({
      name: 'preview',
      title: 'Preview',
      /* The full URL as a string, not {origin}. `origin` is scheme and host
         only, so a path on the end is discarded, which lands the preview on a
         bare github.io with no site on it. The string form keeps the path.

         No preview mode either: that is for sites serving unpublished drafts
         behind a token. This one only ever shows published content, so the
         preview is simply the live site. */
      previewUrl: SITE_URL,
    }),
    visionTool(),
  ],

  /* Vision is a query playground: useful for debugging, meaningless to anyone
     editing the site, and alarming if you do not know what it is. It stays for
     administrators and is hidden from everyone else, so Sam sees only the
     content. Filtering here rather than dropping the plugin keeps it available
     without a redeploy when something needs looking at. */
  tools: (prev, {currentUser}) => {
    const isAdmin = (currentUser?.roles || []).some((role) => role.name === 'administrator')
    return isAdmin ? prev : prev.filter((tool) => tool.name !== 'vision')
  },

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

import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '3zrcphqr',
    dataset: 'production',
  },
  // Pins the deployed address so `sanity deploy` stops asking for it.
  studioHost: 'samrudd',
})

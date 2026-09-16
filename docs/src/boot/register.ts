import { defineBoot } from '#q-app'
import Plugin from 'ui'
import DocExample from '@/components/DocExample.vue'
import DocApi from '@/components/DocApi.vue'
import DocCode from '@/components/DocCode.vue'

export default defineBoot(({ app }) => {
  app.use(Plugin)
  // available in every Markdown page
  app.component('DocExample', DocExample)
  app.component('DocApi', DocApi)
  app.component('DocCode', DocCode)
})

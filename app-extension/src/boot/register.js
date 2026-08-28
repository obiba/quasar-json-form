import { defineBoot } from '#q-app'
import VuePlugin from '@obiba/quasar-ui-json-form'

export default defineBoot(({ app }) => {
  app.use(VuePlugin)
})

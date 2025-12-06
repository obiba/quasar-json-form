import { boot } from 'quasar/wrappers'
import VuePlugin from '@obiba/quasar-ui-json-form'

export default boot(({ app }) => {
  app.use(VuePlugin)
})

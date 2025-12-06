import { boot } from 'quasar/wrappers'
import VuePlugin from 'quasar-ui-json-form'

export default boot(({ app }) => {
  app.use(VuePlugin)
})

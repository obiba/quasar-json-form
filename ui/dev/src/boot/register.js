import { boot } from 'quasar/wrappers'
import VuePlugin from 'ui' // "ui" is aliased in quasar.conf.js

export default boot(({ app }) => {
  // Only register if not already registered
  // if (!app._context.components.QJsonForm) {
  //   app.use(VuePlugin)
  // }
})

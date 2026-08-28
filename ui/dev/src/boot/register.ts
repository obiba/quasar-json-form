import { defineBoot } from '#q-app'

export default defineBoot(({ app }) => {
  // Only register if not already registered
  // if (!app._context.components.QJsonForm) {
  //   app.use(VuePlugin)
  // }
})

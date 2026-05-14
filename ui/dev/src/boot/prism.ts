import { boot } from 'quasar/wrappers'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-json'
import PrismDirective from 'src/directives/prism'

export default boot(({ app }) => {
  app.directive('prism', PrismDirective)
  app.config.globalProperties.$prism = Prism
})

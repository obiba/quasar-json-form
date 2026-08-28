import { defineBoot } from '#q-app'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-json'
import PrismDirective from '@/directives/prism'

export default defineBoot(({ app }) => {
  app.directive('prism', PrismDirective)
  app.config.globalProperties.$prism = Prism
})

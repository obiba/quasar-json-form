import type { Directive } from 'vue'
import Prism from 'prismjs'

const prismDirective: Directive<HTMLElement> = {
  mounted (el) {
    Prism.highlightElement(el)
  },
  updated (el) {
    Prism.highlightElement(el)
  }
}

export default prismDirective

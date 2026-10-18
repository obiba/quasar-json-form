import { h, defineComponent } from 'vue'
import { rendererProps } from '@jsonforms/vue'
import { useControlProperties } from '../composables/useControlProperties'
import { useLayoutControl } from '../composables/useControl'
import { renderMarkdown, renderMarkdownInline } from '../utils/markdown'


export default defineComponent({
  name: 'QSectionRenderer',
  props: rendererProps(),
  setup(props: any) {
    const controlResult = useLayoutControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, rootClass, formText } = useControlProperties(control)


    return () => {
      if (!isVisible.value) {
        return null
      }

      const children = []
      const uischema = control.value.uischema as any

      // the heading: `label` (JSON Forms convention), `title` accepted too
      const label = uischema.label || uischema.title
      if (label) {
        children.push(h('div', {
          class: ['q-form-label', uischema.labelClass],
          innerHTML: renderMarkdownInline(formText(String(label))),
        }))
      }

      if (uischema.description) {
        children.push(h('div', {
          class: ['q-form-description text-markdown', uischema.descriptionClass],
          innerHTML: renderMarkdown(formText(String(uischema.description))),
        }))
      }

      return h('div', {
        class: ['q-section-renderer', rootClass.value],
      }, children)
    }
  },
})

import { h, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { renderMarkdown, renderMarkdownInline } from '../utils/markdown'


export default defineComponent({
  name: 'QSectionRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()
    
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, rootClass } = useControlProperties(control)


    return () => {
      if (!isVisible.value) {
        return null
      }

      const children = []
      const uischema = control.value.uischema as any

      // the heading: `label` (JSON Forms convention), `title` accepted too
      const label = control.value.label || uischema.label || uischema.title
      if (label) {
        children.push(h('div', {
          class: ['q-form-label', uischema.labelClass],
          innerHTML: renderMarkdownInline(t(String(label))),
        }))
      }

      if (control.value.description || uischema.description) {
        children.push(h('div', {
          class: ['q-form-description text-markdown', uischema.descriptionClass],
          innerHTML: renderMarkdown(t(String(control.value.description || uischema.description))),
        }))
      }

      return h('div', {
        class: ['q-section-renderer', rootClass.value],
      }, children)
    }
  },
})

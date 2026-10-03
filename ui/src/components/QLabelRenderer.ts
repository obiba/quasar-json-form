import { h, defineComponent } from 'vue'
import { rendererProps } from '@jsonforms/vue'
import { useControlProperties } from '../composables/useControlProperties'
import { useLayoutControl } from '../composables/useControl'
import { useFormI18n } from '../composables/useFormI18n'
import { renderMarkdown } from '../utils/markdown'


export default defineComponent({
  name: 'QLabelRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()
    
    const controlResult = useLayoutControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, rootClass } =
      useControlProperties(control)


    return () => {
      if (!isVisible.value) {
        return null
      }

      // JSON Forms `Label` elements carry their content in `text`; `label` is also accepted.
      // The content is a vue-i18n key or a literal, rendered as markdown with raw HTML
      // allowed (headings, alert blocks...) and sanitized.
      const uischema = control.value.uischema as any
      const text = uischema.label || uischema.text
      const label = text ? renderMarkdown(t(String(text))) : ''

      return h('div', {
        class: ['q-label-renderer', uischema.labelClass, rootClass.value],
        innerHTML: label,
      })
    }
  },
})

import { h, watch, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { useControlProperties } from '../composables/useControlProperties'
import { useI18n } from 'vue-i18n'
import { renderMarkdown } from '../utils/markdown'


export default defineComponent({
  name: 'QSectionRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useI18n()
    
    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    })

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible } = useControlProperties(control)

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined)
        }
      },
    )

    const onChange = (value: any) => {
      controlResult.handleChange(control.value.path, value)
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      const children = []

      if (control.value.label || control.value.uischema.label) {
        let label = t(String(control.value.label || control.value.uischema.label))
        // label = renderMarkdown(label);
        children.push(h('div', {
          class: 'q-form-label' + ((control.value.uischema as any).labelClass ? ` ${(control.value.uischema as any).labelClass}` : ''),
          innerHTML: label,
        }))
      }

      if (control.value.description || (control.value.uischema as any).description) {
        let description = t(String(control.value.description || (control.value.uischema as any).description))
        description = renderMarkdown(description)
        children.push(h('div', {
          class: 'q-label-renderer text-grey-7' + ((control.value.uischema as any).descriptionClass ? ` ${(control.value.uischema as any).descriptionClass}` : ''),
          innerHTML: description,
        }))
      }

      return h('div', {
        class: 'q-section-renderer',
      }, children)
    }
  },
})

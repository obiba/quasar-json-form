import { h, watch, defineComponent } from 'vue'
import { DispatchRenderer, rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { useControlProperties } from '../composables/useControlProperties'
import { useI18n } from 'vue-i18n'
import { renderMarkdown } from '../utils/markdown'


export default defineComponent({
  name: 'QGroupRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useI18n()
    
    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    })

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled } = useControlProperties(control)

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

      if ((control.value as any).title || (control.value.uischema as any).title) {
        let title = t(String((control.value as any).title || (control.value.uischema as any).title))
        title = renderMarkdown(title)
        children.push(h('div', {
          class: 'q-form-title' + ((control.value.uischema as any).titleClass ? ` ${(control.value.uischema as any).titleClass}` : ''),
          innerHTML: title,
        }))
      }

      if (control.value.description || (control.value.uischema as any).description) {
        let description = t(String(control.value.description || (control.value.uischema as any).description))
        description = renderMarkdown(description)
        children.push(h('div', {
          class: 'q-form-description' + ((control.value.uischema as any).descriptionClass ? ` ${(control.value.uischema as any).descriptionClass}` : ''),
          innerHTML: description,
        }))
      }

      ((control.value.uischema as any)?.elements || []).forEach((element: any) => {
        children.push(h(DispatchRenderer, {
          schema: props.schema,
          uischema: element,
          path: control.value.path,
          enabled: props.enabled && isEnabled.value,
          visible: props.visible && isVisible.value,
          cells: props.cells,
          renderers: props.renderers,
          config: props.config,
        }))
      })

      if ((control.value as any).hint || (control.value.uischema as any).hint) {
        let hint = t(String((control.value as any).hint || (control.value.uischema as any).hint))
        hint = renderMarkdown(hint)
        children.push(h('div', {
          class: 'q-form-hint' + ((control.value.uischema as any).hintClass ? ` ${(control.value.uischema as any).hintClass}` : ''),
          innerHTML: hint,
        }))
      }
      
      return h('div', {
        class: 'q-group-renderer',
      }, children)
    }
  },
})

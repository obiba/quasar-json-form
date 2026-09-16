import { h, defineComponent } from 'vue'
import { DispatchRenderer, rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { renderMarkdown } from '../utils/markdown'


export default defineComponent({
  name: 'QGroupRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()
    
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled, rootClass } = useControlProperties(control)


    return () => {
      if (!isVisible.value) {
        return null
      }

      const children = []

      // `title` (this library) or the JSON Forms `label` of the group
      const groupTitle = (control.value as any).title || (control.value.uischema as any).title
        || (typeof (control.value.uischema as any).label === 'string' ? (control.value.uischema as any).label : undefined)
      if (groupTitle) {
        let title = t(String(groupTitle))
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
          enabled: props.enabled !== false && isEnabled.value,
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
        class: ['q-group-renderer', rootClass.value],
      }, children)
    }
  },
})

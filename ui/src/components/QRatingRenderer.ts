import { h, watch, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QRating } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'

export default defineComponent({
  name: 'QRatingRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled, isReadonly, requiredMark, rootClass, hasError, errorMessage, options } =
      useControlProperties(control)

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined)
        }
      },
    )

    const onChange = (value: any) => {
      const isEmpty = value === undefined || value === null || value === ''
      controlResult.handleChange(control.value.path, isEmpty ? undefined : Number(value))
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      const children = []

      if (control.value.label) {
        children.push(h('div', {
          class: 'text-label text-grey-7 q-mb-xs',
        }, t(control.value.label) + requiredMark.value))
      }

      if (control.value.description) {
        children.push(h('div', {
          class: 'text-description text-caption text-grey-7 q-mb-sm',
        }, t(control.value.description)))
      }

      children.push(h(QRating, {
        ...options.value,
        // QRating requires a number: no value displays no selected icon
        modelValue: control.value.data ?? 0,
        type: 'number',
        'onUpdate:modelValue': onChange,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value && !isReadonly.value,
        readonly: isReadonly.value,
      }))

      if ((control.value.uischema as any).hint) {
        children.push(h('div', {
          class: 'text-hint text-caption text-grey-7 q-mb-sm',
        }, t((control.value.uischema as any).hint)))
      }

      return h('div', { class: ['q-mt-md', rootClass.value] }, children)
    }
  },
})

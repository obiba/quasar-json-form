import { h, watch, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QToggle } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'

export default defineComponent({
  name: 'QToggleRenderer',
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
      controlResult.handleChange(control.value.path, value)
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      const children = []

      children.push(h(QToggle, {
        ...options.value,
        class: isReadonly.value ? 'q-form-readonly' : undefined,
        modelValue: control.value.data,
        // read-only: no change handler, the toggle keeps its value
        'onUpdate:modelValue': isReadonly.value ? undefined : onChange,
        label: control.value.label ? t(control.value.label) + requiredMark.value : undefined,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value && !isReadonly.value,
      }))

      if (control.value.description) {
        children.push(h('div', {
          class: 'text-caption text-grey-7',
        }, t(control.value.description)))
      }

      if (options.value.hint) {
        children.push(h('div', {
          class: 'text-caption text-grey-7',
        }, t(options.value.hint)))
      }

      return h('div', { class: rootClass.value }, children)
    }
  },
})

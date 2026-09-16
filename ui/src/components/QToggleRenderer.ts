import { h, watch, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QToggle } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'

export default defineComponent({
  name: 'QToggleRenderer',
  props: rendererProps(),
  setup(props: any) {
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const {
      isVisible, isEnabled, isReadonly, inputLabel, rootClass, hasError, errorMessage, options, renderHeader, renderHint,
    } = useControlProperties(control)

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

      return h('div', { class: ['q-toggle-renderer', rootClass.value] }, [
        ...renderHeader(),
        h(QToggle, {
          ...options.value,
          class: isReadonly.value ? 'q-form-readonly' : undefined,
          modelValue: control.value.data,
          // read-only: no change handler, the toggle keeps its value
          'onUpdate:modelValue': isReadonly.value ? undefined : onChange,
          label: inputLabel.value,
          error: hasError.value,
          errorMessage: errorMessage.value,
          required: control.value.required,
          disable: !isEnabled.value && !isReadonly.value,
        }),
        renderHint(),
      ])
    }
  },
})

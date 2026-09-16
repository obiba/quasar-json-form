import { h, watch, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QSlider } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'

export default defineComponent({
  name: 'QSliderRenderer',
  props: rendererProps(),
  setup(props: any) {
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled, isReadonly, rootClass, hasError, errorMessage, options, renderHeader, renderHint } =
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

      return h('div', { class: ['q-slider-renderer q-mt-md', rootClass.value] }, [
        ...renderHeader(),
        h(QSlider, {
          ...options.value,
          modelValue: control.value.data,
          'onUpdate:modelValue': onChange,
          disable: !isEnabled.value && !isReadonly.value,
          readonly: isReadonly.value,
        }),
        hasError.value && errorMessage.value
          ? h('div', { class: 'q-form-error text-caption text-negative' }, errorMessage.value)
          : renderHint(),
      ])
    }
  },
})

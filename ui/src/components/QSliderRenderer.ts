import { h, watch, defineComponent } from 'vue'
import { rendererProps } from '@jsonforms/vue'
import { useControl } from '../composables/useControl'
import { QSlider } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'

/** `min` / `max` props from the `minimum` / `maximum` of a schema */
const bounds = (schema: any): Record<string, number> => {
  const result: Record<string, number> = {}
  if (typeof schema?.minimum === 'number') result.min = schema.minimum
  if (typeof schema?.maximum === 'number') result.max = schema.maximum
  return result
}

export default defineComponent({
  name: 'QSliderRenderer',
  props: rendererProps(),
  setup(props: any) {
    const controlResult = useControl(props)

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

      return h('div', { class: ['q-input-field q-slider-renderer q-mt-md', rootClass.value] }, [
        ...renderHeader(),
        h(QSlider, {
          // the bounds of the schema, unless the options set them
          ...bounds(control.value.schema),
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

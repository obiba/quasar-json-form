/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, watch, computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QRange } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'

const toNumber = (value: any): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

/**
 * Object control with `format: "range"`: a QRange selecting two ends, data
 * `{ min: number, max: number }` (the QRange model).
 */
export default defineComponent({
  name: 'QRangeRenderer',
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

    // QRange requires both keys in its model, `null` meaning "no value"
    const modelValue = computed(() => {
      const data = control.value.data
      const value = data && typeof data === 'object' ? data : {}
      return { min: toNumber(value.min) ?? null, max: toNumber(value.max) ?? null }
    })

    const onChange = (value: any) => {
      const min = toNumber(value?.min)
      const max = toNumber(value?.max)
      const isEmpty = min === undefined && max === undefined
      controlResult.handleChange(control.value.path, isEmpty ? undefined : { min, max })
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      return h('div', { class: ['q-range-renderer q-mt-md', rootClass.value] }, [
        ...renderHeader(),
        h(QRange, {
          ...options.value,
          modelValue: modelValue.value,
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

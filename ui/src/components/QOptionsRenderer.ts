import { h, computed, watch, defineComponent, onMounted, onUnmounted } from 'vue'
import type { VNode } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QOptionGroup } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'

export default defineComponent({
  name: 'QOptionsRenderer',
  props: rendererProps(),
  setup(props: any) {
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled, isReadonly, rootClass, options, selectOptions, clearInvalidSelection, hasError, errorMessage, renderHeader, renderHint } =
      useControlProperties(control)

    const isMultiple = computed(() => {
      const schema = controlResult.control.value.schema
      return schema.type === 'array'
    })

    const onChange = (value: any) => {
      controlResult.handleChange(controlResult.control.value.path, value)
    }

    // Set up watch to clear invalid selections when options change
    const stopClearInvalidSelection = clearInvalidSelection(controlResult.handleChange)

    // Cleanup watchers on unmount
    onUnmounted(() => {
      stopClearInvalidSelection()
    })

    onMounted(() => {
      // Ensure that for multiple selection, the value is always an array
      if (isMultiple.value && isVisible.value && !Array.isArray(control.value.data)) {
        onChange([])
      }
    })

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined)
        }
      },
    )

    watch (
      () => control.value.data,
      (newValue) => {
        // Ensure that for multiple selection, the value is always an array
        if (isMultiple.value && isVisible.value && !Array.isArray(newValue)) {
          onChange([])
        }
      }
    )

    return () => {
      if (!isVisible.value) {
        return null
      }

      const children: (VNode | null)[] = [...renderHeader()]

      const type = isMultiple.value
            ? (options.value && options.value.format) || 'checkbox'
            : 'radio'

      children.push(
        h(QOptionGroup, {
          ...options.value,
          class: isReadonly.value ? 'q-form-readonly' : undefined,
          // a multiple selection is an array from the first render (the data is set on mount)
          modelValue: isMultiple.value && !Array.isArray(control.value.data) ? [] : control.value.data,
          options: selectOptions.value,
          type: type,
          disable: !isEnabled.value && !isReadonly.value,
          // read-only: no change handler, the selection is displayed as-is
          'onUpdate:modelValue': isReadonly.value ? undefined : onChange,
        }),
      )

      // QOptionGroup has no error state: the message is displayed under the options
      if (hasError.value && errorMessage.value) {
        children.push(h('div', { class: 'text-negative text-caption q-mt-xs' }, errorMessage.value))
      } else {
        children.push(renderHint())
      }

      return h('div', { class: ['q-options-renderer', rootClass.value] }, children)
    }
  },
})

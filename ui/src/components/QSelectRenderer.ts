import { h, computed, watch, defineComponent, onUnmounted } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QSelect } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { omitOptions } from '../utils/options'

export default defineComponent({
  name: 'QSelectRenderer',
  props: rendererProps(),
  setup(props: any) {
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const {
      isVisible, isEnabled, isReadonly, inputLabel, rootClass, hasError, errorMessage, options, selectOptions,
      clearInvalidSelection, renderHeader, hintSlot,
    } = useControlProperties(control)

    const isMultiple = computed(() => {
      const schema = controlResult.control.value.schema
      return schema.type === 'array'
    })

    const onChange = (value: any) => {
      // a cleared selection means "no value", so that `required` applies
      controlResult.handleChange(controlResult.control.value.path, value === null ? undefined : value)
    }

    // Set up watch to clear invalid selections when options change
    const stopClearInvalidSelection = clearInvalidSelection(controlResult.handleChange)

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined)
        }
      },
    )

    // Cleanup watchers on unmount
    onUnmounted(() => {
      stopClearInvalidSelection()
    })

    return () => {
      if (!isVisible.value) {
        return null
      }

      return h('div', { class: ['q-select-renderer', rootClass.value] }, [
        ...renderHeader(),
        h(QSelect, {
          ...omitOptions(options.value, ['class']),
          modelValue: control.value.data,
          'onUpdate:modelValue': onChange,
          label: inputLabel.value,
          options: selectOptions.value,
          error: hasError.value,
          errorMessage: errorMessage.value,
          required: control.value.required,
          disable: !isEnabled.value && !isReadonly.value,
          readonly: isReadonly.value,
          emitValue: true,
          mapOptions: true,
          multiple: isMultiple.value,
          clearable: !control.value.required,
        }, {
          ...hintSlot.value,
        }),
      ])
    }
  },
})

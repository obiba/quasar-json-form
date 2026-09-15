import { h, computed, watch, defineComponent, onUnmounted } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QSelect } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'

export default defineComponent({
  name: 'QSelectRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()

    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    })

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled, isReadonly, inputLabel, hasError, errorMessage, options, selectOptions, clearInvalidSelection } =
      useControlProperties(control)

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

      return h(QSelect, {
        modelValue: control.value.data,
        'onUpdate:modelValue': onChange,
        label: inputLabel.value,
        options: selectOptions.value,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value && !isReadonly.value,
        readonly: isReadonly.value,
        hint: control.value.description ? t(control.value.description) : undefined,
        emitValue: true,
        mapOptions: true,
        multiple: isMultiple.value,
        clearable: !control.value.required,
        ...options.value,
      })
    }
  },
})

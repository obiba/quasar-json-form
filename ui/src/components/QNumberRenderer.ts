import { h, watch, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QInput } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'

export default defineComponent({
  name: 'QNumberRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled, isReadonly, inputLabel, hasError, errorMessage, options } =
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
      // an emptied input means "no value", so that `required` applies
      const isEmpty = value === '' || value === null || value === undefined
      controlResult.handleChange(control.value.path, isEmpty ? undefined : Number(value))
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      return h(QInput, {
        ...options.value,
        modelValue: control.value.data,
        type: 'number',
        'onUpdate:modelValue': onChange,
        label: inputLabel.value,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value && !isReadonly.value,
        readonly: isReadonly.value,
        hint: control.value.description ? t(control.value.description) : undefined,
      })
    }
  },
})

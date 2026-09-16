import { h, watch, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QInput } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { omitOptions } from '../utils/options'

export default defineComponent({
  name: 'QNumberRenderer',
  props: rendererProps(),
  setup(props: any) {
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const {
      isVisible, isEnabled, isReadonly, inputLabel, rootClass, hasError, errorMessage, options, renderHeader, hintSlot,
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
      // an emptied input means "no value", so that `required` applies
      const isEmpty = value === '' || value === null || value === undefined
      controlResult.handleChange(control.value.path, isEmpty ? undefined : Number(value))
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      return h('div', { class: ['q-number-renderer', rootClass.value] }, [
        ...renderHeader(),
        h(QInput, {
          ...omitOptions(options.value, ['class']),
          modelValue: control.value.data,
          type: 'number',
          'onUpdate:modelValue': onChange,
          label: inputLabel.value,
          error: hasError.value,
          errorMessage: errorMessage.value,
          required: control.value.required,
          disable: !isEnabled.value && !isReadonly.value,
          readonly: isReadonly.value,
        }, {
          ...hintSlot.value,
        }),
      ])
    }
  },
})

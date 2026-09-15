import { h, watch, computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QInput } from 'quasar'
import type { QInputProps } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'


export default defineComponent({
  name: 'QStringRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()
    
    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    })

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled, isReadonly, inputLabel, hasError, errorMessage, options } =
      useControlProperties(control)

    // schema `format` values that map to an HTML input type; anything else is plain text
    const inputTypes: Record<string, QInputProps['type']> = {
      text: 'text',
      textarea: 'textarea',
      password: 'password',
      email: 'email',
      search: 'search',
      tel: 'tel',
      url: 'url',
      uri: 'url',
    }

    const inputType = computed<QInputProps['type']>(() => {
      const format = control.value.schema.format
      if (format && inputTypes[format]) return inputTypes[format]
      return options.value.rows ? 'textarea' : 'text'
    })

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
      controlResult.handleChange(control.value.path, value === '' || value === null ? undefined : value)
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      return h(QInput, {
        modelValue: control.value.data,
        'onUpdate:modelValue': onChange,
        label: inputLabel.value,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value && !isReadonly.value,
        readonly: isReadonly.value,
        hint: control.value.description ? t(control.value.description) : undefined,
        type: inputType.value,
        ...options.value,
      })
    }
  },
})

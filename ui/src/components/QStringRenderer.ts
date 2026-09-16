/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, watch, computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QInput } from 'quasar'
import type { QInputProps } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { useReportedErrors } from '../composables/useFormErrors'
import { omitOptions } from '../utils/options'
import { countWords, isWithinWordLimit, parseWordLimit } from '../utils/words'


export default defineComponent({
  name: 'QStringRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t, translate } = useFormI18n()

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled, isReadonly, inputLabel, hasError, errorMessage, options, validationMessage } =
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
      if (options.value.type) return options.value.type as QInputProps['type']
      const format = control.value.schema.format || options.value.format
      if (format && inputTypes[format]) return inputTypes[format]
      return options.value.rows ? 'textarea' : 'text'
    })

    // Word limit (`wordLimit: "min:max"`, `wordMin`, `wordMax` options)
    const wordLimit = computed(() => parseWordLimit(options.value))

    const wordErrors = computed<string[]>(() => {
      const limit = wordLimit.value
      if (!limit || isWithinWordLimit(control.value.data, limit)) return []
      const name = limit.source === 'wordLimit' ? 'wordLimitError' : limit.source === 'wordMax' ? 'wordMaxError' : 'wordMinError'
      if (limit.min !== undefined && limit.min > 0 && limit.max !== undefined) {
        return [validationMessage(name, 'error.wordLimit', { min: limit.min, max: limit.max })]
      }
      if (limit.max !== undefined) {
        return [validationMessage(name, 'error.wordMax', { limit: limit.max })]
      }
      return [validationMessage(name, 'error.wordMin', { limit: limit.min })]
    })

    useReportedErrors(
      () => control.value.path,
      'wordLimit',
      computed(() => (isVisible.value ? wordErrors.value : [])),
    )

    const wordCounter = computed(() => {
      const limit = wordLimit.value
      if (!limit || limit.max === undefined || isReadonly.value) return undefined
      return translate('words', { count: countWords(control.value.data), limit: limit.max })
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

      const errors = [errorMessage.value, ...wordErrors.value].filter((e) => e && e.length > 0)

      return h(QInput, {
        ...omitOptions(options.value),
        modelValue: control.value.data,
        'onUpdate:modelValue': onChange,
        label: inputLabel.value,
        error: hasError.value || wordErrors.value.length > 0,
        errorMessage: errors.join('; '),
        required: control.value.required,
        disable: !isEnabled.value && !isReadonly.value,
        readonly: isReadonly.value,
        hint: control.value.description ? t(control.value.description) : undefined,
        type: inputType.value,
        counter: wordCounter.value !== undefined,
      }, wordCounter.value !== undefined ? {
        counter: () => wordCounter.value,
      } : {})
    }
  },
})

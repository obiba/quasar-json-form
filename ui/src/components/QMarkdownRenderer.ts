/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, watch, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { omitOptions, RENDERER_OPTION_KEYS } from '../utils/options'
import QMarkdownEditor from './QMarkdownEditor'

/**
 * String control with `format: "markdown"`: markdown editor with preview,
 * rendered markdown when read-only.
 */
export default defineComponent({
  name: 'QMarkdownRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const { isVisible, isEnabled, isReadonly, inputLabel, hasError, errorMessage, rootClass, options } =
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
      controlResult.handleChange(control.value.path, value === '' || value === null ? undefined : value)
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      return h(QMarkdownEditor, {
        class: rootClass.value,
        modelValue: control.value.data,
        'onUpdate:modelValue': onChange,
        label: inputLabel.value,
        hint: control.value.description ? t(control.value.description) : undefined,
        rows: options.value.rows || 5,
        readonly: isReadonly.value,
        disable: !isEnabled.value && !isReadonly.value,
        error: hasError.value,
        errorMessage: errorMessage.value,
        inputProps: omitOptions(options.value, [...RENDERER_OPTION_KEYS, 'class', 'rows']),
      })
    }
  },
})

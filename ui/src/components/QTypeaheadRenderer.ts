/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, computed, watch, defineComponent, ref } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QSelect } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import type { SelectOption } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { omitOptions, RENDERER_OPTION_KEYS } from '../utils/options'

/**
 * String control with `format: "typeahead"`: text input with suggestions from
 * `options.values` (strings or `{ label, value }`), or the schema `examples`
 * / `enum`. The value must be one of the suggestions unless
 * `options.editable` is true (then any typed text is accepted with Enter).
 */
export default defineComponent({
  name: 'QTypeaheadRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const {
      isVisible, isEnabled, isReadonly, inputLabel, rootClass, hasError, errorMessage, options, renderHeader, hintSlot,
    } = useControlProperties(control)

    const allOptions = computed<SelectOption[]>(() => {
      const schema = control.value.schema as any
      const source = options.value.values ?? schema.examples ?? schema.enum
      if (!Array.isArray(source)) return []
      return source
        .filter((entry: any) => entry !== undefined && entry !== null)
        .map((entry: any) => {
          if (typeof entry === 'object') {
            const value = entry.value ?? entry.key ?? entry.const
            return { label: t(String(entry.label ?? entry.name ?? entry.title ?? value)), value }
          }
          return { label: t(String(entry)), value: entry }
        })
    })

    const filtered = ref<SelectOption[]>([])
    watch(allOptions, (value) => { filtered.value = value }, { immediate: true })

    const onFilter = (needle: string, update: (fn: () => void) => void) => {
      update(() => {
        const search = (needle || '').toLowerCase()
        filtered.value = search.length === 0
          ? allOptions.value
          : allOptions.value.filter((o) => o.label.toLowerCase().includes(search))
      })
    }

    const onChange = (value: any) => {
      controlResult.handleChange(control.value.path, value === '' || value === null ? undefined : value)
    }

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined)
        }
      },
    )

    return () => {
      if (!isVisible.value) {
        return null
      }

      return h('div', { class: ['q-typeahead-renderer', rootClass.value] }, [
        ...renderHeader(),
        h(QSelect, {
          ...omitOptions(options.value, [...RENDERER_OPTION_KEYS, 'class']),
          class: 'q-typeahead',
          modelValue: control.value.data ?? null,
          'onUpdate:modelValue': onChange,
          label: inputLabel.value,
          options: filtered.value,
          onFilter,
          useInput: true,
          fillInput: true,
          hideSelected: true,
          inputDebounce: 0,
          newValueMode: options.value.editable === true ? 'add-unique' : undefined,
          error: hasError.value,
          errorMessage: errorMessage.value,
          required: control.value.required,
          disable: !isEnabled.value && !isReadonly.value,
          readonly: isReadonly.value,
          emitValue: true,
          mapOptions: true,
          clearable: !control.value.required && !isReadonly.value,
        }, {
          ...hintSlot.value,
        }),
      ])
    }
  },
})

/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, computed, watch, defineComponent, inject, ref } from 'vue'
import type { Ref } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QSelect } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import type { SelectOption } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { COUNTRIES_KEY } from '../composables/keys'
import { omitOptions, RENDERER_OPTION_KEYS } from '../utils/options'
import type { CountryCode } from '../data/countries'

/**
 * Country select (`format: "countries"` / `"obibaCountriesUiSelect"`): ISO
 * codes, one (`type: string`) or several (`type: array`). The list of
 * `{ code, name }` comes from `options.countries`, `config.countries` or an
 * injected `jsonforms-countries`; either an array or a `{ locale: [...] }` map
 * (the current vue-i18n locale is used). See the `countryCodes` export.
 */
export default defineComponent({
  name: 'QCountriesRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t, locale } = useFormI18n()

    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    })

    const control = controlResult.control

    const { isVisible, isEnabled, isReadonly, inputLabel, hasError, errorMessage, options, config } =
      useControlProperties(control)

    const injected = inject<Ref<any>>(COUNTRIES_KEY, ref(undefined))

    const countries = computed<CountryCode[]>(() => {
      const source = options.value.countries ?? config.value.countries ?? injected.value
      if (Array.isArray(source)) return source
      if (source && typeof source === 'object') {
        const current = String(locale.value || '')
        const list = source[current] || source[current.split('-')[0]!] || source[Object.keys(source)[0]!]
        return Array.isArray(list) ? list : []
      }
      return []
    })

    const allOptions = computed<SelectOption[]>(() => {
      return countries.value
        .filter((c) => c && c.code !== undefined)
        .map((c) => ({ label: t(String(c.name ?? c.code)), value: c.code }))
    })

    const filtered = ref<SelectOption[]>([])
    watch(allOptions, (value) => { filtered.value = value }, { immediate: true })

    const onFilter = (needle: string, update: (fn: () => void) => void) => {
      update(() => {
        const search = (needle || '').toLowerCase()
        filtered.value = search.length === 0
          ? allOptions.value
          : allOptions.value.filter((o) => o.label.toLowerCase().includes(search) || String(o.value).toLowerCase().startsWith(search))
      })
    }

    const isMultiple = computed(() => control.value.schema.type === 'array')

    const onChange = (value: any) => {
      const empty = value === null || value === undefined || (Array.isArray(value) && value.length === 0)
      controlResult.handleChange(control.value.path, empty ? undefined : value)
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

      return h(QSelect, {
        class: ['q-countries-select', options.value.class],
        modelValue: control.value.data ?? (isMultiple.value ? [] : null),
        'onUpdate:modelValue': onChange,
        label: inputLabel.value,
        options: filtered.value,
        onFilter,
        useInput: true,
        inputDebounce: 0,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value && !isReadonly.value,
        readonly: isReadonly.value,
        hint: control.value.description ? t(control.value.description) : undefined,
        emitValue: true,
        mapOptions: true,
        multiple: isMultiple.value,
        useChips: isMultiple.value,
        clearable: !control.value.required && !isReadonly.value,
        ...omitOptions(options.value, [...RENDERER_OPTION_KEYS, 'class']),
      })
    }
  },
})

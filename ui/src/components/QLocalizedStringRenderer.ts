/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, watch, computed, defineComponent, inject, ref } from 'vue'
import type { Ref } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QInput, QBtnToggle } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { useReportedErrors } from '../composables/useFormErrors'
import { LOCALE_KEY } from '../composables/keys'
import { omitOptions, RENDERER_OPTION_KEYS } from '../utils/options'
import QMarkdownEditor from './QMarkdownEditor'

const isBlank = (value: any): boolean => value === undefined || value === null || value === ''

/**
 * Object control with `format: "localizedString"` (or `"obibaSimpleMde"`):
 * `{ en: "...", fr: "..." }` values, one input for the selected language with
 * a language selector, single line or textarea (`options.rows`), markdown
 * editor when `options.marked` is true (always for `obibaSimpleMde`).
 *
 * A required localized string must be completed in every language
 * (`localized.completed` message, `options.validationMessage.completed`).
 */
export default defineComponent({
  name: 'QLocalizedStringRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { locale: appLocale } = useFormI18n()

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const {
      isVisible, isEnabled, isReadonly, inputLabel, hasError, errorMessage, rootClass, options, languages, validationMessage,
      renderHeader, hintSlot,
    } = useControlProperties(control)

    // Language displayed, shared with the other localized controls of the form
    const sharedLocale = inject<Ref<string | undefined>>(LOCALE_KEY, ref(undefined))

    const currentLocale = computed<string>(() => {
      const codes = languages.value.map((l) => l.code)
      if (sharedLocale.value && codes.includes(sharedLocale.value)) return sharedLocale.value
      const app = String(appLocale.value || '')
      if (codes.includes(app)) return app
      const base = app.split('-')[0]!
      if (codes.includes(base)) return base
      return codes[0] || 'en'
    })

    const selectLocale = (code: string) => {
      sharedLocale.value = code
    }

    const data = computed<Record<string, any>>(() => {
      const value = control.value.data
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    })

    const currentValue = computed(() => data.value[currentLocale.value])

    const isMarked = computed(() => {
      return options.value.marked === true
        || control.value.schema.format === 'obibaSimpleMde'
        || options.value.format === 'obibaSimpleMde'
        || options.value.format === 'markdown'
    })

    const rows = computed<number>(() => {
      const value = parseInt(String(options.value.rows ?? ''), 10)
      return isNaN(value) ? 0 : value
    })

    // Required: completed in all languages as soon as the object exists (a
    // missing value is left to the schema `required`)
    const completedErrors = computed<string[]>(() => {
      if (!control.value.required) return []
      if (control.value.data === undefined || control.value.data === null) return []
      const missing = languages.value.some((language) => isBlank(data.value[language.code]))
      return missing ? [validationMessage('completed', 'localized.completed')] : []
    })

    useReportedErrors(
      () => control.value.path,
      'completed',
      computed(() => (isVisible.value ? completedErrors.value : [])),
    )

    const onInput = (code: string, text: any) => {
      const next: Record<string, any> = { ...data.value }
      if (isBlank(text)) {
        delete next[code]
      } else {
        next[code] = text
      }
      const hasValue = Object.keys(next).some((key) => !isBlank(next[key]))
      controlResult.handleChange(control.value.path, hasValue ? next : undefined)
    }

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          controlResult.handleChange(control.value.path, undefined)
        }
      },
    )

    return () => {
      if (!isVisible.value) {
        return null
      }

      const errors = [errorMessage.value, ...completedErrors.value].filter((e) => e && e.length > 0)
      const error = hasError.value || completedErrors.value.length > 0
      const inputProps = omitOptions(options.value, [...RENDERER_OPTION_KEYS, 'rows', 'class'])

      const toggle = languages.value.length > 1
        ? h(QBtnToggle, {
          class: 'q-localized-toggle',
          modelValue: currentLocale.value,
          'onUpdate:modelValue': selectLocale,
          options: languages.value.map((language) => ({ label: language.label, value: language.code })),
          dense: true,
          flat: true,
          noCaps: true,
          size: 'sm',
          toggleColor: 'primary',
        })
        : null

      const input = isMarked.value
        ? h(QMarkdownEditor, {
          class: 'q-localized-string',
          modelValue: currentValue.value,
          'onUpdate:modelValue': (value: any) => onInput(currentLocale.value, value),
          label: inputLabel.value,
          rows: rows.value > 1 ? rows.value : 5,
          readonly: isReadonly.value,
          disable: !isEnabled.value && !isReadonly.value,
          error,
          errorMessage: errors.join('; '),
          inputProps,
        }, {
          ...hintSlot.value,
          ...(toggle ? { toolbar: () => [toggle] } : {}),
        })
        : h(QInput, {
          ...inputProps,
          class: 'q-localized-string',
          modelValue: currentValue.value ?? '',
          'onUpdate:modelValue': (value: any) => onInput(currentLocale.value, value),
          label: inputLabel.value,
          error,
          errorMessage: errors.join('; '),
          required: control.value.required,
          disable: !isEnabled.value && !isReadonly.value,
          readonly: isReadonly.value,
          type: rows.value > 1 ? 'textarea' : 'text',
          rows: rows.value > 1 ? rows.value : undefined,
        }, {
          ...hintSlot.value,
          ...(toggle ? { append: () => toggle } : {}),
        })

      return h('div', { class: ['q-localized-string-renderer', rootClass.value] }, [...renderHeader(), input])
    }
  },
})

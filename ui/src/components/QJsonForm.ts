/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, provide, toRef, defineComponent, computed, ref, watch, inject, unref, markRaw, toRaw } from 'vue'
import type { PropType } from 'vue'
import { JsonForms } from '@jsonforms/vue'
import { createAjv } from '@jsonforms/core'
import type { ValidationMode, JsonFormsRendererRegistryEntry } from '@jsonforms/core'
import type Ajv from 'ajv'
import type { ErrorObject } from 'ajv'
import { vanillaRenderers } from '@jsonforms/vue-vanilla'
import '@jsonforms/vue-vanilla/vanilla.css'
import { useFormI18n } from '../composables/useFormI18n'
import { provideFormErrorRegistry } from '../composables/useFormErrors'
import { useRules } from '../composables/useRules'
import { collectHiddenPaths, filterHiddenErrors } from '../utils/visibility'
import { I18N_KEY, LANGUAGES_KEY, LOCALE_KEY } from '../composables/keys'
import type { FormI18nOverride } from '../composables/useFormI18n'
import type { LanguagesInput } from '../composables/useControlProperties'
import qRenderers from '../utils/renderers'
import { createJsonFormsI18n } from '../utils/i18n'
import type { FormTranslations } from '../utils/i18n'

// The Quasar renderers, with the vanilla ones as a fallback
const builtinRenderers = Object.freeze([...vanillaRenderers, ...qRenderers])

/**
 * Custom `format` values understood by the renderers: registered on the
 * default AJV instance as always valid, so that AJV does not warn about them.
 */
export const CUSTOM_FORMATS = [
  'file', 'files', 'obibaFiles',
  'localizedString', 'localizedstring', 'obibaSimpleMde', 'markdown',
  'radioGroupCollection', 'radio-matrix',
  'countries', 'obibaCountriesUiSelect', 'typeahead', 'images', 'image-map', 'geo', 'geojson',
  'datepicker', 'ymdatepicker', 'year-month', 'fulltime', 'date-fulltime',
  'computed', 'textarea', 'password', 'search', 'tel',
]

const daysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate()

const isValidTime = (hours: string, minutes: string, seconds?: string): boolean =>
  Number(hours) < 24 && Number(minutes) < 60 && (seconds === undefined || Number(seconds) < 60)

/**
 * `time` as produced by the time picker: `HH:mm`, with optional seconds
 * (`HH:mm:ss`), fraction and timezone (the ISO form is still accepted).
 */
export function isPickerTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(value)
  return match !== null && isValidTime(match[1]!, match[2]!, match[3])
}

/**
 * `date-time` as produced by the date-time picker: `YYYY-MM-DD HH:mm`, with
 * optional seconds, fraction and timezone; a `T` separator (the ISO form) is
 * also accepted.
 */
export function isPickerDateTime(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(value)
  if (match === null) return false
  const [, year, month, day, hours, minutes, seconds] = match
  const m = Number(month)
  const d = Number(day)
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(Number(year), m) && isValidTime(hours!, minutes!, seconds)
}

/**
 * Standard formats redefined to match what the pickers produce: AJV would
 * otherwise require seconds and a timezone (`HH:mm:ssZ`), which the time and
 * date-time controls never store.
 */
export const PICKER_FORMATS: Record<string, (value: string) => boolean> = {
  time: isPickerTime,
  'date-time': isPickerDateTime,
}

export function createDefaultAjv(): Ajv {
  const ajv = createAjv()
  CUSTOM_FORMATS.forEach((format) => {
    if (!ajv.formats[format]) ajv.addFormat(format, true)
  })
  Object.entries(PICKER_FORMATS).forEach(([format, validate]) => {
    ajv.addFormat(format, validate)
  })
  return ajv
}

export default defineComponent({
  name: 'QJsonForm',
  props: {
    modelValue: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    schema: {
      type: Object,
      required: true,
    },
    uischema: {
      type: Object,
      required: false,
      default: () => ({}),
    },
    /**
     * Render every control read-only (values displayed, no edition).
     */
    readonly: {
      type: Boolean,
      required: false,
      default: false,
    },
    /**
     * JSON Forms validation mode: 'ValidateAndShow' (default) validates the
     * data against the schema and shows the errors on the controls,
     * 'ValidateAndHide' validates but does not display errors (they are still
     * emitted with `update:errors`), 'NoValidation' disables schema
     * validation. `validation` rules and the renderers' own checks
     * (word limits, localized strings completed...) are always evaluated.
     */
    validationMode: {
      type: String as PropType<ValidationMode>,
      required: false,
      default: 'ValidateAndShow',
    },
    /**
     * Custom AJV instance (see `createAjv` from `@jsonforms/core`).
     */
    ajv: {
      type: Object as PropType<Ajv>,
      required: false,
      default: undefined,
    },
    /**
     * Errors to display in addition to the ones found by validation (for
     * instance, errors reported by a server).
     */
    additionalErrors: {
      type: Array as PropType<ErrorObject[]>,
      required: false,
      default: () => [],
    },
    /**
     * JSON Forms config object, passed to every renderer: the application
     * defaults that a control overrides with the same key in its `options`
     * (`languages`, `countries`, `fileUpload` hooks, `geo` map defaults...).
     */
    config: {
      type: Object,
      required: false,
      default: undefined,
    },
    /**
     * Languages of the localized strings (`{ en: '...', fr: '...' }` values):
     * an array of codes or a `{ code: label }` map. A control can override it
     * with `options.languages`.
     */
    languages: {
      type: [Array, Object] as PropType<LanguagesInput>,
      required: false,
      default: undefined,
    },
    /**
     * Translations embedded in the form, keyed by language:
     * `{ en: { 'name.title': 'Name' }, fr: { 'name.title': 'Nom' } }` (flat
     * dotted keys or nested objects). Every key of the schema and UI schema
     * (titles, descriptions, hints, option labels, messages...) is looked up
     * here first, in the form locale then in the vue-i18n fallback locale,
     * before the vue-i18n messages of the application.
     */
    translations: {
      type: Object as PropType<FormTranslations>,
      required: false,
      default: undefined,
    },
    /**
     * Locale of the form, overriding the vue-i18n locale for its renderers
     * only: the language of the translations, of the application messages and
     * of the built-in messages, and the language initially displayed by the
     * localized string controls.
     */
    locale: {
      type: String,
      required: false,
      default: undefined,
    },
    /**
     * Renderers of the application (`{ renderer, tester }` entries, see
     * `rankWith` from `@jsonforms/core`), tried before the built-in ones: a
     * control is rendered by the entry whose tester returns the highest rank,
     * the application entry winning a tie.
     */
    renderers: {
      type: Array as PropType<JsonFormsRendererRegistryEntry[]>,
      required: false,
      default: () => [],
    },
    /**
     * Output only: accepted so that `v-model:errors` is a declared binding;
     * the emitted `update:errors` is the source of truth.
     */
    errors: {
      type: Array as PropType<ErrorObject[]>,
      required: false,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'update:errors'],
  setup(props: any, { emit }: any) {
    // the `translations` and `locale` props, else an application-level provide
    // (raw value or ref); provided to the renderers, and used by this form
    const inheritedI18n = inject<unknown>(I18N_KEY, undefined)
    const scopedI18n = computed<FormI18nOverride | undefined>(() => {
      const inherited = unref(inheritedI18n) as FormI18nOverride | undefined
      const formLocale = props.locale ?? inherited?.locale
      const translations = props.translations ?? inherited?.translations
      return formLocale === undefined && translations === undefined ? undefined : { locale: formLocale, translations }
    })
    provide(I18N_KEY, scopedI18n)
    const { t, te, locale, fallbackLocale } = useFormI18n(scopedI18n)

    // AJV instance: the given one, or a default knowing the custom formats.
    // Never a reactive proxy (an application may keep it in reactive state):
    // AJV's code generation breaks when its internals are proxied.
    const defaultAjv = markRaw(createDefaultAjv())
    const ajv = computed<Ajv>(() => (props.ajv ? markRaw(toRaw(props.ajv)) : defaultAjv))

    // Provide form data and readonly state to all child renderers
    provide('jsonforms-data', toRef(props, 'modelValue'))
    provide('jsonforms-readonly', toRef(props, 'readonly'))
    // the `languages` prop, else an application-level provide (raw value or ref)
    const inheritedLanguages = inject<unknown>(LANGUAGES_KEY, undefined)
    provide(LANGUAGES_KEY, computed<LanguagesInput>(() => props.languages ?? (unref(inheritedLanguages) as LanguagesInput)))

    // Language currently displayed by the localized string controls (shared,
    // so that switching it in one control switches every control)
    const selectedLocale = ref<string | undefined>(undefined)
    provide(LOCALE_KEY, selectedLocale)

    const generateDefaultUISchema = (schema: any): any => {
      if (!schema || !schema.properties) return { type: 'VerticalLayout', elements: [] }
      return {
        type: 'VerticalLayout',
        elements: Object.keys(schema.properties || {}).map((key: string) => ({
          type: 'Control',
          scope: `#/properties/${key}`,
        })),
      }
    }

    // if uiSchema is not provided, generate a default one
    const generatedUischema = computed(() => {
      return props.uischema && Object.keys(props.uischema).length > 0
        ? props.uischema
        : generateDefaultUISchema(props.schema)
    })

    const currentData = ref<any>(props.modelValue)
    watch(() => props.modelValue, (data) => { currentData.value = data })
    const { evaluateRule } = useRules(currentData)
    const hiddenPaths = computed<string[]>(() =>
      collectHiddenPaths(generatedUischema.value, props.schema, (rule) => evaluateRule(rule, true) === true),
    )

    // Errors found by the renderers themselves, merged with the AJV ones.
    // The AJV errors of the controls hidden by a `visible` rule (their own or
    // the one of an enclosing layout) are left out: a hidden control is not
    // validated, as with angular-schema-form, so that a `required` property
    // shown under a condition does not block the form while it is hidden.
    const registry = provideFormErrorRegistry()
    const ajvErrors = ref<ErrorObject[]>([])
    const visibleAjvErrors = computed<ErrorObject[]>(() => filterHiddenErrors(ajvErrors.value, hiddenPaths.value))
    const allErrors = computed<ErrorObject[]>(() => [...visibleAjvErrors.value, ...registry.errors.value])
    watch(allErrors, (errors) => emit('update:errors', errors))

    const onChange = (event: any) => {
      currentData.value = event.data
      emit('update:modelValue', event.data)
      ajvErrors.value = event.errors || []
    }


    // JSON Forms translation state backed by the form translations and
    // vue-i18n (or the pass-through fallback when it is not installed),
    // refreshed on locale or translations change (`t` and `te` read the
    // translations lazily: the state must depend on them explicitly)
    const i18n = computed(() => {
      void scopedI18n.value
      return createJsonFormsI18n({
        locale: String(locale.value),
        fallbackLocale: fallbackLocale.value,
        te,
        t,
      })
    })

    // Frozen, so that JSON Forms does not make the array (and the components
    // in it) reactive; the raw prop for the same reason
    const renderers = computed<readonly JsonFormsRendererRegistryEntry[]>(
      () => Object.freeze([...toRaw(props.renderers), ...builtinRenderers]),
    )

    return () => h('div', {
      class: 'json-form-wrapper',
    }, [
      h(JsonForms, {
        data: props.modelValue,
        schema: props.schema,
        uischema: generatedUischema.value,
        renderers: renderers.value,
        readonly: props.readonly,
        validationMode: props.validationMode,
        ajv: ajv.value,
        additionalErrors: props.additionalErrors,
        config: props.config,
        i18n: i18n.value,
        onChange,
      }),
    ])
  },
})

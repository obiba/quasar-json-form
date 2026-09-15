/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, provide, toRef, defineComponent, computed, ref, watch, inject, unref } from 'vue'
import type { PropType } from 'vue'
import { JsonForms } from '@jsonforms/vue'
import { createAjv } from '@jsonforms/core'
import type { ValidationMode } from '@jsonforms/core'
import type Ajv from 'ajv'
import type { ErrorObject } from 'ajv'
import { vanillaRenderers } from '@jsonforms/vue-vanilla'
import '@jsonforms/vue-vanilla/vanilla.css'
import { useFormI18n } from '../composables/useFormI18n'
import { provideFormErrorRegistry } from '../composables/useFormErrors'
import { LANGUAGES_KEY, LOCALE_KEY } from '../composables/keys'
import type { LanguagesInput } from '../composables/useControlProperties'
import qRenderers from '../utils/renderers'
import { createJsonFormsI18n } from '../utils/i18n'

// Combine custom renderers with default vanilla renderers
const renderers = Object.freeze([...vanillaRenderers, ...qRenderers])

/**
 * Custom `format` values understood by the renderers: registered on the
 * default AJV instance as always valid, so that AJV does not warn about them.
 */
export const CUSTOM_FORMATS = [
  'file', 'files', 'obibaFiles',
  'localizedString', 'localizedstring', 'obibaSimpleMde', 'markdown',
  'radioGroupCollection', 'radio-matrix',
  'countries', 'obibaCountriesUiSelect', 'typeahead',
  'datepicker', 'ymdatepicker', 'year-month', 'fulltime', 'date-fulltime',
  'computed', 'textarea', 'password', 'search', 'tel',
]

export function createDefaultAjv(): Ajv {
  const ajv = createAjv()
  CUSTOM_FORMATS.forEach((format) => {
    if (!ajv.formats[format]) ajv.addFormat(format, true)
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
     * validation. Filtrex `validation` rules and the renderers' own checks
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
     * JSON Forms config object, passed to every renderer (`countries`,
     * `fileUpload`, `languages`...).
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
    const { t, te, locale, fallbackLocale } = useFormI18n()

    // AJV instance: the given one, or a default knowing the custom formats
    const defaultAjv = createDefaultAjv()
    const ajv = computed<Ajv>(() => props.ajv ?? defaultAjv)

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

    // Errors found by the renderers themselves, merged with the AJV ones
    const registry = provideFormErrorRegistry()
    const ajvErrors = ref<ErrorObject[]>([])
    const allErrors = computed<ErrorObject[]>(() => [...ajvErrors.value, ...registry.errors.value])
    watch(allErrors, (errors) => emit('update:errors', errors))

    const onChange = (event: any) => {
      emit('update:modelValue', event.data)
      ajvErrors.value = event.errors || []
    }

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

    // JSON Forms translation state backed by vue-i18n (or the pass-through
    // fallback when it is not installed), refreshed on locale change
    const i18n = computed(() => createJsonFormsI18n({
      locale: String(locale.value),
      fallbackLocale: fallbackLocale.value,
      te,
      t,
    }))

    return () => h('div', {
      class: 'json-form-wrapper',
    }, [
      h(JsonForms, {
        data: props.modelValue,
        schema: props.schema,
        uischema: generatedUischema.value,
        renderers,
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

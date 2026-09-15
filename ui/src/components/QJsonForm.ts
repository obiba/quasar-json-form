/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, provide, toRef, defineComponent, computed } from 'vue'
import type { PropType } from 'vue'
import { JsonForms } from '@jsonforms/vue'
import type { ValidationMode } from '@jsonforms/core'
import type Ajv from 'ajv'
import type { ErrorObject } from 'ajv'
import { vanillaRenderers } from '@jsonforms/vue-vanilla'
import '@jsonforms/vue-vanilla/vanilla.css'
import { useI18n } from 'vue-i18n'
import qRenderers from '../utils/renderers'
import { createJsonFormsI18n } from '../utils/i18n'

// Combine custom renderers with default vanilla renderers
const renderers = Object.freeze([...vanillaRenderers, ...qRenderers])

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
     * validation. Filtrex `validation` rules are always evaluated.
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
     * JSON Forms config object, passed to every renderer.
     */
    config: {
      type: Object,
      required: false,
      default: undefined,
    },
  },
  emits: ['update:modelValue', 'update:errors'],
  setup(props: any, { emit }: any) {
    const { t, te, locale, fallbackLocale } = useI18n()

    // Provide form data and readonly state to all child renderers
    provide('jsonforms-data', toRef(props, 'modelValue'))
    provide('jsonforms-readonly', toRef(props, 'readonly'))

    const onChange = (event: any) => {
      emit('update:modelValue', event.data)
      emit('update:errors', event.errors || [])
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

    // JSON Forms translation state backed by vue-i18n, refreshed on locale change
    const i18n = computed(() => {
      const fallback = fallbackLocale.value
      return createJsonFormsI18n({
        locale: String(locale.value),
        fallbackLocale: typeof fallback === 'string' ? fallback : undefined,
        te: (key: string, loc?: string) => te(key, loc as any),
        t: (key: string, named?: Record<string, unknown>) => t(key, named || {}),
      })
    })

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
        ajv: props.ajv,
        additionalErrors: props.additionalErrors,
        config: props.config,
        i18n: i18n.value,
        onChange,
      }),
    ])
  },
})

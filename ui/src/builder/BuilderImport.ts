/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The import dialog: a form (schema, UI schema and translations), a schema
 * alone, or an angular-schema-form pair, pasted or picked as a file.
 */
import { h, defineComponent, ref, watch } from 'vue'
import { QInput, QBtn, QDialog, QCard, QCardSection, QCardActions, QFile } from 'quasar'
import { useFormI18n } from '../vue-plugin'
import { isAsfDefinition } from '../asf'
import type { FormDefinition } from './model'

const isObject = (value: unknown): value is Record<string, any> => typeof value === 'object' && value !== null && !Array.isArray(value)

/** What an imported JSON document is: a form (bundle), a schema alone, or an ASF pair. */
export type ImportedForm = { kind: 'form'; definition: FormDefinition } | { kind: 'asf'; schema: unknown; definition: unknown }


/** Recognizes a pasted or picked document; undefined when it is none of the known shapes. */
export function recognize(parsed: unknown): ImportedForm | undefined {
  if (!isObject(parsed)) return undefined
  if (isObject(parsed.schema)) {
    if (isAsfDefinition(parsed.definition)) return { kind: 'asf', schema: parsed.schema, definition: parsed.definition }
    return { kind: 'form', definition: { schema: parsed.schema, uischema: isObject(parsed.uischema) ? parsed.uischema : undefined, translations: isObject(parsed.translations) ? parsed.translations : undefined } }
  }
  if (parsed.type === 'object' || isObject(parsed.properties)) return { kind: 'form', definition: { schema: parsed } }
  return undefined
}

export default defineComponent({
  name: 'QJsonFormBuilderImport',
  props: {
    /** the dialog is shown (`v-model`) */
    modelValue: { type: Boolean, default: false },
  },
  emits: ['import', 'update:modelValue'],
  setup(props, { emit }) {
    const { translate } = useFormI18n()
    const tr = (key: string) => translate(`builder.${key}`)
    const pasted = ref('')
    const error = ref('')
    const file = ref<File | null>(null)
    watch(() => props.modelValue, (open) => { if (open) { pasted.value = ''; error.value = ''; file.value = null } })

    const doImport = async () => {
      let text = pasted.value
      if (file.value && typeof file.value.text === 'function') text = await file.value.text()
      try {
        const recognized = recognize(JSON.parse(text))
        if (!recognized) throw new Error(tr('unknownFormat'))
        error.value = ''
        emit('import', recognized)
        emit('update:modelValue', false)
      } catch (e) {
        error.value = (e as Error).message
      }
    }

    return () => h(QDialog, { modelValue: props.modelValue, 'onUpdate:modelValue': (v: boolean) => emit('update:modelValue', v) }, () =>
      h(QCard, { class: 'q-builder-import', style: 'min-width: min(700px, 90vw)' }, () => [
        h(QCardSection, () => [
          h('div', { class: 'text-h6' }, tr('import')),
          h('div', { class: 'text-caption text-grey-7' }, tr('importHint')),
        ]),
        h(QCardSection, () => [
          h(QInput, { modelValue: pasted.value, type: 'textarea', filled: true, rows: 10, inputClass: 'q-builder-code', 'onUpdate:modelValue': (v: string | number | null) => { pasted.value = String(v ?? '') } }),
          h(QFile, { modelValue: file.value, dense: true, outlined: true, clearable: true, accept: '.json,application/json', label: 'JSON', class: 'q-mt-sm', 'onUpdate:modelValue': (v: File | null) => { file.value = v } }),
          error.value ? h('div', { class: 'text-negative q-mt-sm' }, error.value) : null,
        ]),
        h(QCardActions, { align: 'right' }, () => [
          h(QBtn, { flat: true, label: tr('cancel'), onClick: () => emit('update:modelValue', false) }),
          h(QBtn, { unelevated: true, color: 'primary', label: tr('import'), onClick: doImport }),
        ]),
      ]))
  },
})

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The source of the form (schema, UI schema and translations as JSON, each
 * editable and applied as a whole), and the import dialog: a form, a schema
 * alone, or an angular-schema-form pair, pasted or picked as a file.
 */
import { h, defineComponent, computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { QInput, QBtn, QTabs, QTab, QTabPanels, QTabPanel, QDialog, QCard, QCardSection, QCardActions, QFile, QSeparator } from 'quasar'
import { useFormI18n } from '../vue-plugin'
import type { FormModel, FormDefinition } from './model'
import { toDefinition } from './model'
import { isAsfDefinition } from '../asf'

/** What an imported JSON document is: a form (bundle), a schema alone, or an ASF pair. */
export type ImportedForm = { kind: 'form'; definition: FormDefinition } | { kind: 'asf'; schema: unknown; definition: unknown }

const isObject = (value: unknown): value is Record<string, any> => typeof value === 'object' && value !== null && !Array.isArray(value)

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
  name: 'QJsonFormBuilderSource',
  props: {
    model: { type: Object as PropType<FormModel>, required: true },
    /** the import dialog is shown */
    importing: { type: Boolean, default: false },
  },
  emits: ['replace', 'import', 'update:importing'],
  setup(props, { emit }) {
    const { translate } = useFormI18n()
    const tr = (key: string) => translate(`builder.${key}`)
    const tab = ref('schema')
    const definition = computed(() => toDefinition(props.model))

    // one editor per part, refreshed from the model when it changes
    const parts = ['schema', 'uischema', 'translations'] as const
    const texts = { schema: ref(''), uischema: ref(''), translations: ref('') }
    const errors = { schema: ref(''), uischema: ref(''), translations: ref('') }
    for (const part of parts) {
      watch(() => JSON.stringify(definition.value[part], null, 2), (next) => { texts[part].value = next; errors[part].value = '' }, { immediate: true })
    }
    const apply = (part: (typeof parts)[number]) => {
      try {
        const parsed = JSON.parse(texts[part].value)
        if (!isObject(parsed)) throw new Error('object expected')
        errors[part].value = ''
        emit('replace', { ...definition.value, [part]: parsed })
      } catch (e) {
        errors[part].value = `${tr('invalidJson')}: ${(e as Error).message}`
      }
    }

    // --- import dialog
    const pasted = ref('')
    const importError = ref('')
    const file = ref<File | null>(null)
    watch(() => props.importing, (open) => { if (open) { pasted.value = ''; importError.value = ''; file.value = null } })
    const doImport = async () => {
      let text = pasted.value
      if (file.value && typeof file.value.text === 'function') text = await file.value.text()
      try {
        const recognized = recognize(JSON.parse(text))
        if (!recognized) throw new Error(tr('unknownFormat'))
        importError.value = ''
        emit('import', recognized)
        emit('update:importing', false)
      } catch (e) {
        importError.value = (e as Error).message
      }
    }

    return () => h('div', { class: 'q-builder-source' }, [
      h(QTabs, { modelValue: tab.value, dense: true, align: 'left', activeColor: 'primary', narrowIndicator: true, 'onUpdate:modelValue': (v: string) => { tab.value = v } }, () =>
        parts.map((part) => h(QTab, { name: part, label: tr(part) }))),
      h(QSeparator),
      h(QTabPanels, { modelValue: tab.value, animated: true, class: 'bg-transparent' }, () =>
        parts.map((part) => h(QTabPanel, { name: part, class: 'q-px-none' }, () => [
          h(QInput, {
            modelValue: texts[part].value, type: 'textarea', filled: true, autogrow: true, inputClass: 'q-builder-code',
            error: !!errors[part].value, errorMessage: errors[part].value,
            'onUpdate:modelValue': (v: string | number | null) => { texts[part].value = String(v ?? '') },
          }),
          h(QBtn, { label: tr('apply'), color: 'primary', unelevated: true, size: 'sm', class: 'q-mt-sm', onClick: () => apply(part) }),
        ]))),
      h(QDialog, { modelValue: props.importing, 'onUpdate:modelValue': (v: boolean) => emit('update:importing', v) }, () =>
        h(QCard, { style: 'min-width: min(700px, 90vw)' }, () => [
          h(QCardSection, () => [
            h('div', { class: 'text-h6' }, tr('import')),
            h('div', { class: 'text-caption text-grey-7' }, tr('importHint')),
          ]),
          h(QCardSection, () => [
            h(QInput, { modelValue: pasted.value, type: 'textarea', filled: true, rows: 10, inputClass: 'q-builder-code', 'onUpdate:modelValue': (v: string | number | null) => { pasted.value = String(v ?? '') } }),
            h(QFile, { modelValue: file.value, dense: true, outlined: true, clearable: true, accept: '.json,application/json', label: 'JSON', class: 'q-mt-sm', 'onUpdate:modelValue': (v: File | null) => { file.value = v } }),
            importError.value ? h('div', { class: 'text-negative q-mt-sm' }, importError.value) : null,
          ]),
          h(QCardActions, { align: 'right' }, () => [
            h(QBtn, { flat: true, label: tr('cancel'), onClick: () => emit('update:importing', false) }),
            h(QBtn, { unelevated: true, color: 'primary', label: tr('import'), onClick: doImport }),
          ]),
        ])),
    ])
  },
})

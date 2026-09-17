/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The source of the form: schema, UI schema and translations as JSON, each
 * editable and applied as a whole.
 */
import { h, defineComponent, computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import { QInput, QBtn, QTabs, QTab, QTabPanels, QTabPanel, QSeparator } from 'quasar'
import { useFormI18n } from '../vue-plugin'
import type { FormModel } from './model'
import { toDefinition } from './model'

const isObject = (value: unknown): value is Record<string, any> => typeof value === 'object' && value !== null && !Array.isArray(value)

export default defineComponent({
  name: 'QJsonFormBuilderSource',
  props: {
    model: { type: Object as PropType<FormModel>, required: true },
  },
  emits: ['replace'],
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
    ])
  },
})

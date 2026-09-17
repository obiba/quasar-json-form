/**
 * The translations of the form: one row per key, one column per language,
 * the missing values highlighted; languages can be added, and the unused
 * translations removed.
 */
import { h, defineComponent, computed, ref } from 'vue'
import type { PropType } from 'vue'
import { QInput, QToggle, QBtn, QMarkupTable, QBadge } from 'quasar'
import { useFormI18n } from '../vue-plugin'
import type { FormModel } from './model'
import { usedKeys, pruneTranslations } from './texts'
import { translationsToCsv, mergeCsv } from './csv'
import { downloadText } from './items'

export default defineComponent({
  name: 'QJsonFormBuilderTranslations',
  props: {
    model: { type: Object as PropType<FormModel>, required: true },
    languages: { type: Array as PropType<string[]>, required: true },
  },
  emits: ['change', 'add-language'],
  setup(props, { emit }) {
    const { translate } = useFormI18n()
    const tr = (key: string, named?: Record<string, unknown>) => translate(`builder.${key}`, named)
    const filter = ref('')
    const missingOnly = ref(false)
    const newLanguage = ref('')
    const pruned = ref<number | undefined>(undefined)
    const csvStatus = ref('')
    const fileInput = ref<HTMLInputElement | null>(null)

    const downloadCsv = () => downloadText('translations.csv', translationsToCsv(props.model, props.languages), 'text/csv')

    const uploadCsv = async (event: Event) => {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      input.value = ''
      if (!file) return
      try {
        const result = mergeCsv(props.model, await file.text())
        result.languages.filter((locale) => !props.languages.includes(locale)).forEach((locale) => emit('add-language', locale))
        csvStatus.value = tr('csvImported', { keys: result.keys, values: result.values })
        emit('change')
      } catch (e) {
        csvStatus.value = `${tr('csvInvalid')}: ${(e as Error).message}`
      }
    }

    const keys = computed(() => {
      const all = new Set<string>(usedKeys(props.model))
      Object.values(props.model.translations).forEach((messages) => Object.keys(messages).forEach((key) => all.add(key)))
      return [...all].sort()
    })
    const isMissing = (key: string, locale: string) => props.model.translations[locale]?.[key] === undefined
    const rows = computed(() => {
      const needle = filter.value.trim().toLowerCase()
      return keys.value.filter((key) => {
        if (needle && !key.toLowerCase().includes(needle) && !props.languages.some((l) => (props.model.translations[l]?.[key] ?? '').toLowerCase().includes(needle))) return false
        if (missingOnly.value && !props.languages.some((l) => isMissing(key, l))) return false
        return true
      })
    })
    const missingCount = (locale: string) => keys.value.filter((key) => isMissing(key, locale)).length

    const setValue = (key: string, locale: string, value: string) => {
      const messages = (props.model.translations[locale] ??= {})
      if (value === '') delete messages[key]
      else messages[key] = value
      emit('change')
    }

    const addLanguage = () => {
      const code = newLanguage.value.trim()
      if (!/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(code) || props.languages.includes(code)) return
      props.model.translations[code] ??= {}
      newLanguage.value = ''
      emit('add-language', code)
      emit('change')
    }

    return () => h('div', { class: 'q-builder-translations' }, [
      h('div', { class: 'row items-center q-col-gutter-sm q-mb-sm' }, [
        h('div', { class: 'col-12 col-sm-4' }, [h(QInput, { modelValue: filter.value, label: tr('search'), dense: true, outlined: true, clearable: true, 'onUpdate:modelValue': (v: string | number | null) => { filter.value = String(v ?? '') } })]),
        h('div', { class: 'col-auto' }, [h(QToggle, { modelValue: missingOnly.value, label: tr('missingOnly'), dense: true, 'onUpdate:modelValue': (v: boolean) => { missingOnly.value = v } })]),
        h('div', { class: 'col-auto' }, [h(QInput, {
          modelValue: newLanguage.value, label: tr('addLanguage'), dense: true, outlined: true, placeholder: 'de', style: 'width: 160px',
          'onUpdate:modelValue': (v: string | number | null) => { newLanguage.value = String(v ?? '') },
          onKeyup: (e: KeyboardEvent) => { if (e.key === 'Enter') addLanguage() },
        }, { append: () => h(QBtn, { flat: true, dense: true, round: true, icon: 'add', onClick: addLanguage }) })]),
        h('div', { class: 'col-auto' }, [
          h(QBtn, { flat: true, dense: true, size: 'sm', icon: 'cleaning_services', label: tr('prune'), onClick: () => { pruned.value = pruneTranslations(props.model).length; emit('change') } }),
          pruned.value !== undefined ? h('span', { class: 'text-caption text-grey-7 q-ml-sm' }, tr('pruned', { count: pruned.value })) : null,
        ]),
        h('div', { class: 'col-auto' }, [
          h(QBtn, { flat: true, dense: true, size: 'sm', icon: 'download', label: tr('downloadCsv'), onClick: downloadCsv }),
          h(QBtn, { flat: true, dense: true, size: 'sm', icon: 'upload', label: tr('uploadCsv'), onClick: () => fileInput.value?.click() }),
          h('input', { ref: fileInput, type: 'file', accept: '.csv,text/csv', style: 'display: none', onChange: uploadCsv }),
          csvStatus.value ? h('span', { class: 'text-caption text-grey-7 q-ml-sm' }, csvStatus.value) : null,
        ]),
      ]),
      h(QMarkupTable, { flat: true, bordered: true, dense: true, wrapCells: true }, () => [
        h('thead', [h('tr', [
          h('th', { class: 'text-left' }, tr('key')),
          ...props.languages.map((locale) => h('th', { class: 'text-left', key: locale }, [
            locale.toUpperCase(), ' ',
            missingCount(locale) ? h(QBadge, { color: 'warning', textColor: 'dark', rounded: true }, () => String(missingCount(locale))) : null,
          ])),
        ])]),
        h('tbody', rows.value.map((key) => h('tr', { key }, [
          h('td', [h('code', key)]),
          ...props.languages.map((locale) => h('td', { key: locale, class: { 'q-builder-missing': isMissing(key, locale) } }, [
            h(QInput, {
              modelValue: props.model.translations[locale]?.[key] ?? '', dense: true, borderless: true, autogrow: true,
              'onUpdate:modelValue': (v: string | number | null) => setValue(key, locale, String(v ?? '')),
            }),
          ])),
        ]))),
      ]),
    ])
  },
})

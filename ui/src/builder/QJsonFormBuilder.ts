/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The form builder: the outline of the form with its palette, the properties
 * of the selected node, the live preview, the translations editor and the
 * source, around a form model bound to `v-model` as a form definition
 * (`{ schema, uischema, translations }`).
 */
import { h, defineComponent, reactive, ref, computed, watch } from 'vue'
import type { PropType } from 'vue'
import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core'
import { QSelect, QBtn, QBtnDropdown, QList, QItem, QItemSection, QSpace, QCard, QCardSection, QTabs, QTab, QTabPanels, QTabPanel, QSeparator } from 'quasar'
import { useFormI18n, normalizeLanguages } from '../vue-plugin'
import type { LanguagesInput } from '../vue-plugin'
import type { RendererApi } from '../catalog'
import type { FormDefinition, FormModel } from './model'
import { fromDefinition, toDefinition, fromAsf } from './model'
import { builderCatalog, downloadText } from './items'
import BuilderTree from './BuilderTree'
import BuilderProperties from './BuilderProperties'
import BuilderPreview from './BuilderPreview'
import BuilderTranslations from './BuilderTranslations'
import BuilderSource from './BuilderSource'
import BuilderImport from './BuilderImport'
import type { ImportedForm } from './BuilderImport'

export default defineComponent({
  name: 'QJsonFormBuilder',
  props: {
    /** the form: `{ schema, uischema, translations }` (`v-model`) */
    modelValue: { type: Object as PropType<FormDefinition>, default: () => ({ schema: { type: 'object', properties: {} } }) },
    /** languages of the form, added to the ones of its translations */
    languages: { type: [Array, Object] as PropType<LanguagesInput>, default: undefined },
    /** language edited and previewed initially (the vue-i18n locale when it is one of the languages) */
    locale: { type: String, default: undefined },
    /** descriptions of the renderers of the application, added to the palette */
    catalog: { type: Array as PropType<RendererApi[]>, default: () => [] },
    /** renderers of the application, for the preview */
    renderers: { type: Array as PropType<JsonFormsRendererRegistryEntry[]>, default: () => [] },
    /** JSON Forms config, for the preview */
    config: { type: Object, default: undefined },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, expose }) {
    const { translate, locale: appLocale } = useFormI18n()
    const tr = (key: string) => translate(`builder.${key}`)

    const state = reactive({ model: fromDefinition(props.modelValue) }) as { model: FormModel }
    const selected = ref<string | undefined>(state.model.root.id)
    const tab = ref('properties')
    const importing = ref(false)
    const catalog = computed(() => builderCatalog(props.catalog))

    const languages = computed<string[]>(() => {
      const codes = normalizeLanguages(props.languages).map((l) => l.code)
      for (const code of Object.keys(state.model.translations)) if (!codes.includes(code)) codes.push(code)
      return codes.length > 0 ? codes : ['en']
    })
    const locale = ref(props.locale && languages.value.includes(props.locale) ? props.locale : languages.value.includes(String(appLocale.value)) ? String(appLocale.value) : languages.value[0]!)
    watch(languages, (codes) => { if (!codes.includes(locale.value)) locale.value = codes[0]! })

    // the definition emitted last, to tell an echo of it from a new value
    let emitted = ''
    watch(() => state.model, () => {
      const definition = toDefinition(state.model)
      emitted = JSON.stringify(definition)
      emit('update:modelValue', definition)
    }, { deep: true })

    const load = (model: FormModel) => {
      state.model = model
      selected.value = model.root.id
    }
    watch(() => props.modelValue, (value) => {
      if (JSON.stringify(value) !== emitted) load(fromDefinition(value))
    }, { deep: true })

    const onImport = (imported: ImportedForm) => {
      load(imported.kind === 'asf' ? fromAsf(imported.schema, imported.definition) : fromDefinition(imported.definition))
      tab.value = 'properties'
    }

    const download = (part?: 'schema' | 'uischema' | 'translations') => {
      const definition = toDefinition(state.model)
      downloadText(`${part ?? 'form'}.json`, JSON.stringify(part ? definition[part] : definition, null, 2))
    }

    expose({ getModel: () => state.model })

    return () => h('div', { class: 'q-json-form-builder' }, [
      h('div', { class: 'row items-center q-gutter-sm q-mb-md' }, [
        h(QSelect, {
          modelValue: locale.value, options: languages.value, label: tr('language'), dense: true, outlined: true, style: 'min-width: 120px',
          'onUpdate:modelValue': (v: string) => { locale.value = v },
        }),
        h(QSpace),
        h(QBtn, { flat: true, dense: true, icon: 'upload', label: tr('import'), onClick: () => { importing.value = true } }),
        h(QBtnDropdown, { flat: true, dense: true, icon: 'download', label: tr('export'), autoClose: true }, () => h(QList, { dense: true }, () => [
          h(QItem, { clickable: true, onClick: () => download() }, () => h(QItemSection, () => tr('form'))),
          h(QItem, { clickable: true, onClick: () => download('schema') }, () => h(QItemSection, () => tr('exportSchema'))),
          h(QItem, { clickable: true, onClick: () => download('uischema') }, () => h(QItemSection, () => tr('exportUischema'))),
          h(QItem, { clickable: true, onClick: () => download('translations') }, () => h(QItemSection, () => tr('exportTranslations'))),
        ])),
      ]),
      h('div', { class: 'row q-col-gutter-md' }, [
        h('div', { class: 'col-12 col-md-4' }, [
          h(QCard, { flat: true, bordered: true }, () => h(QCardSection, { class: 'q-pa-sm' }, () => h(BuilderTree, {
            model: state.model, catalog: catalog.value, selected: selected.value, locale: locale.value,
            onSelect: (id: string) => { selected.value = id; if (tab.value !== 'properties') tab.value = 'properties' },
          }))),
        ]),
        h('div', { class: 'col-12 col-md-8' }, [
          h(QCard, { flat: true, bordered: true }, () => [
            h(QTabs, { modelValue: tab.value, dense: true, align: 'left', activeColor: 'primary', narrowIndicator: true, 'onUpdate:modelValue': (v: string) => { tab.value = v } }, () => [
              h(QTab, { name: 'properties', label: tr('properties') }),
              h(QTab, { name: 'preview', label: tr('preview') }),
              h(QTab, { name: 'translations', label: tr('translations') }),
              h(QTab, { name: 'source', label: tr('source') }),
            ]),
            h(QSeparator),
            h(QTabPanels, { modelValue: tab.value, animated: true, keepAlive: true, class: 'bg-transparent' }, () => [
              h(QTabPanel, { name: 'properties' }, () => h(BuilderProperties, { model: state.model, catalog: catalog.value, nodeId: selected.value, locale: locale.value })),
              h(QTabPanel, { name: 'preview' }, () => h(BuilderPreview, { model: state.model, locale: locale.value, languages: languages.value, renderers: props.renderers, config: props.config })),
              h(QTabPanel, { name: 'translations' }, () => h(BuilderTranslations, { model: state.model, languages: languages.value, locale: locale.value, onAddLanguage: (code: string) => { locale.value = code } })),
              h(QTabPanel, { name: 'source' }, () => h(BuilderSource, {
                model: state.model,
                onReplace: (definition: FormDefinition) => load(fromDefinition(definition)),
              })),
            ]),
          ]),
        ]),
      ]),
      // outside the tabs: available whichever tab is shown
      h(BuilderImport, { modelValue: importing.value, 'onUpdate:modelValue': (v: boolean) => { importing.value = v }, onImport }),
    ])
  },
})

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The live preview of the form: rendered with `QJsonForm` in the builder
 * language, with a read-only toggle and the data and errors it produces.
 */
import { h, defineComponent, computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core'
import { QToggle, QBtn, QCard, QCardSection, QSeparator, QTabs, QTab, QTabPanels, QTabPanel, QBadge, QBanner } from 'quasar'
import { useFormI18n, QJsonForm } from '../vue-plugin'
import type { FormModel } from './model'
import { toDefinition } from './model'

export default defineComponent({
  name: 'QJsonFormBuilderPreview',
  props: {
    model: { type: Object as PropType<FormModel>, required: true },
    locale: { type: String, required: true },
    languages: { type: Array as PropType<string[]>, required: true },
    renderers: { type: Array as PropType<JsonFormsRendererRegistryEntry[]>, default: () => [] },
    config: { type: Object, default: undefined },
  },
  setup(props) {
    const { translate } = useFormI18n()
    const tr = (key: string) => translate(`builder.${key}`)
    const definition = computed(() => toDefinition(props.model))
    const data = ref<Record<string, unknown>>({})
    const errors = ref<any[]>([])
    const readonly = ref(false)
    const tab = ref('data')
    const formKey = ref(0)
    // a changed schema starts the form again (the renderers may not follow a type change)
    watch(() => JSON.stringify(definition.value.schema), () => { formKey.value++ })

    return () => h('div', { class: 'q-builder-preview' }, [
      h('div', { class: 'row items-center q-gutter-sm q-mb-sm' }, [
        h(QToggle, { modelValue: readonly.value, label: tr('readonly'), dense: true, 'onUpdate:modelValue': (v: boolean) => { readonly.value = v } }),
        h(QBtn, { flat: true, dense: true, size: 'sm', icon: 'restart_alt', label: tr('data'), onClick: () => { data.value = {}; formKey.value++ } }),
      ]),
      props.model.diagnostics.length > 0
        ? h(QBanner, { dense: true, rounded: true, class: 'bg-grey-2 q-mb-sm' }, () => [
          h('div', { class: 'text-weight-medium' }, tr('diagnostics')),
          h('ul', { class: 'q-my-xs' }, props.model.diagnostics.map((d, i) => h('li', { key: i, class: d.level === 'warn' ? 'text-warning' : 'text-grey-7' }, d.message))),
        ])
        : null,
      h(QCard, { flat: true, bordered: true }, () => [
        h(QCardSection, () => h(QJsonForm, {
          key: formKey.value,
          modelValue: data.value,
          schema: definition.value.schema,
          uischema: definition.value.uischema,
          translations: definition.value.translations,
          locale: props.locale,
          languages: props.languages,
          readonly: readonly.value,
          renderers: props.renderers,
          config: props.config,
          'onUpdate:modelValue': (value: Record<string, unknown>) => { data.value = value },
          'onUpdate:errors': (value: any[]) => { errors.value = value },
        })),
        h(QSeparator),
        h(QTabs, { modelValue: tab.value, dense: true, align: 'left', activeColor: 'primary', narrowIndicator: true, 'onUpdate:modelValue': (v: string) => { tab.value = v } }, () => [
          h(QTab, { name: 'data', label: tr('data') }),
          h(QTab, { name: 'errors' }, () => h('div', { class: 'row items-center no-wrap q-gutter-x-xs' }, [
            h('span', tr('errors')),
            errors.value.length ? h(QBadge, { rounded: true, color: 'negative' }, () => String(errors.value.length)) : null,
          ])),
        ]),
        h(QSeparator),
        h(QTabPanels, { modelValue: tab.value, animated: true, class: 'bg-transparent' }, () => [
          h(QTabPanel, { name: 'data' }, () => h('pre', { class: 'q-builder-code' }, JSON.stringify(data.value, null, 2))),
          h(QTabPanel, { name: 'errors' }, () => h('pre', { class: 'q-builder-code' }, JSON.stringify(errors.value, null, 2))),
        ]),
      ]),
    ])
  },
})

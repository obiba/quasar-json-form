/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, watch, computed, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QMarkupTable, QRadio, QCheckbox, QIcon } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { useReportedErrors } from '../composables/useFormErrors'
import { renderMarkdownInline } from '../utils/markdown'

interface MatrixValue {
  key: string
  caption: string
}

interface MatrixItem {
  key: string
  name: string
}

/** `[{ key, caption }]`, `[{ value, name }]` or `{ key: caption }` */
function normalizeValues(input: any): MatrixValue[] {
  if (Array.isArray(input)) {
    return input
      .map((entry: any) => {
        if (entry && typeof entry === 'object') {
          const key = entry.key ?? entry.value ?? entry.const
          return key === undefined ? undefined : { key: String(key), caption: String(entry.caption ?? entry.name ?? entry.title ?? entry.label ?? key) }
        }
        return entry === undefined || entry === null ? undefined : { key: String(entry), caption: String(entry) }
      })
      .filter((v): v is MatrixValue => v !== undefined)
  }
  if (input && typeof input === 'object') {
    return Object.keys(input).map((key) => ({ key, caption: String(input[key]) }))
  }
  return []
}

/** `[{ key, name }]` (any of `name`, `title`, `label`, `caption` for the row label) */
function normalizeItems(input: any): MatrixItem[] {
  if (!Array.isArray(input)) return []
  return input
    .map((entry: any) => {
      if (entry && typeof entry === 'object') {
        const key = entry.key ?? entry.value
        return key === undefined ? undefined : { key: String(key), name: String(entry.name ?? entry.title ?? entry.label ?? entry.caption ?? key) }
      }
      return entry === undefined || entry === null ? undefined : { key: String(entry), name: String(entry) }
    })
    .filter((v): v is MatrixItem => v !== undefined)
}

/**
 * Object control with `format: "radioGroupCollection"` (or `"radio-matrix"`):
 * a matrix of items (rows) and values (radio columns), data
 * `{ [item.key]: value.key }`. Rows and columns come from `items` and `values`
 * in the control options or, as in the angular-schema-form add-on, directly
 * on the schema. With `options.checkboxMode`, one checkbox per item
 * (`{ [item.key]: boolean }`).
 */
export default defineComponent({
  name: 'QRadioMatrixRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const {
      isVisible, isEnabled, isReadonly, requiredMark, rootClass, options, title, description, hasError, errorMessage, validationMessage,
    } = useControlProperties(control)

    const values = computed<MatrixValue[]>(() => normalizeValues(options.value.values ?? (control.value.schema as any).values))
    const items = computed<MatrixItem[]>(() => normalizeItems(options.value.items ?? (control.value.schema as any).items))
    const checkboxMode = computed<boolean>(() => options.value.checkboxMode === true)

    const data = computed<Record<string, any>>(() => {
      const value = control.value.data
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    })

    const setValue = (itemKey: string, value: any) => {
      controlResult.handleChange(control.value.path, { ...data.value, [itemKey]: value })
    }

    // Required: every item answered (radio) / at least one checked (checkbox)
    // as soon as the object exists (a missing value is left to `required`)
    const selectionErrors = computed<string[]>(() => {
      if (!control.value.required) return []
      const value = control.value.data
      if (value === undefined || value === null || typeof value !== 'object') return []
      const complete = checkboxMode.value
        ? items.value.some((item) => data.value[item.key] === true)
        : items.value.every((item) => data.value[item.key] !== undefined && data.value[item.key] !== null)
      return complete ? [] : [validationMessage('allItemsSelected', 'radioMatrix.allItemsSelected')]
    })

    useReportedErrors(
      () => control.value.path,
      'allItemsSelected',
      computed(() => (isVisible.value ? selectionErrors.value : [])),
    )

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

      const children = []

      if (title.value) {
        children.push(h('div', {
          class: 'text-label text-grey-7 q-mb-xs',
        }, t(title.value) + requiredMark.value))
      }

      if (description.value) {
        children.push(h('div', {
          class: 'text-description text-caption text-grey-7',
        }, t(description.value)))
      }

      const header = checkboxMode.value ? null : h('thead', {}, [
        h('tr', {}, [
          h('th', {}),
          ...values.value.map((value) => h('th', { class: 'text-center', innerHTML: renderMarkdownInline(t(value.caption)) })),
        ]),
      ])

      const rows = items.value.map((item) => {
        const selected = data.value[item.key]
        const cells = checkboxMode.value
          ? [h('td', { class: 'text-center' }, [
            isReadonly.value
              ? (selected === true ? h(QIcon, { name: 'check', color: 'primary' }) : null)
              : h(QCheckbox, {
                'aria-label': t(item.name),
                modelValue: selected === true,
                'onUpdate:modelValue': (checked: boolean) => setValue(item.key, checked),
                disable: !isEnabled.value,
                dense: true,
              }),
          ])]
          : values.value.map((value) => h('td', { class: 'text-center' }, [
            isReadonly.value
              ? (selected === value.key ? h(QIcon, { name: 'check', color: 'primary' }) : null)
              : h(QRadio, {
                modelValue: selected ?? null,
                val: value.key,
                'onUpdate:modelValue': (val: any) => setValue(item.key, val),
                disable: !isEnabled.value,
                dense: true,
                'aria-label': `${t(item.name)}: ${t(value.caption)}`,
              }),
          ]))
        return h('tr', { key: item.key }, [
          h('td', { class: 'q-radio-matrix__item', innerHTML: renderMarkdownInline(t(item.name)) }),
          ...cells,
        ])
      })

      children.push(h(QMarkupTable, {
        flat: true,
        dense: true,
        wrapCells: true,
        class: 'q-radio-matrix',
      }, () => [header, h('tbody', {}, rows)]))

      const errors = [errorMessage.value, ...selectionErrors.value].filter((e) => e && e.length > 0)
      if ((hasError.value || selectionErrors.value.length > 0) && errors.length > 0) {
        children.push(h('div', { class: 'text-negative text-caption q-mt-xs' }, errors.join('; ')))
      }

      return h('div', { class: ['q-radio-matrix-renderer', rootClass.value] }, children)
    }
  },
})

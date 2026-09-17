/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The properties of the selected node: its key and required flag, its texts
 * in the builder language, its choices, the settings of its renderer (from
 * the catalog), the validation keywords of its property, its rules, and the
 * raw JSON of its element and of its property schema.
 */
import { h, defineComponent, computed, ref, watch } from 'vue'
import type { PropType, VNode } from 'vue'
import { QInput, QToggle, QBtn, QIcon, QBanner, QChip, QExpansionItem, QSeparator } from 'quasar'
import { useFormI18n, QJsonForm } from '../vue-plugin'
import type { FormModel, FormNode, JsonObject } from './model'
import { locate, propertySchema, isRequired, setRequired, containerOf, isValidKey } from './model'
import { renameProperty, ruleReferences } from './operations'
import { textSlots, getText, setText, keyPrefix } from './texts'
import type { TextSlot } from './texts'
import { matchItem, optionsSchema, rawOptions, keywordsSchema, choicesOf, expressionError, fieldNames } from './items'
import type { BuilderCatalog } from './items'

const isObject = (value: unknown): value is JsonObject => typeof value === 'object' && value !== null && !Array.isArray(value)

export default defineComponent({
  name: 'QJsonFormBuilderProperties',
  props: {
    model: { type: Object as PropType<FormModel>, required: true },
    catalog: { type: Object as PropType<BuilderCatalog>, required: true },
    nodeId: { type: String, default: undefined },
    locale: { type: String, required: true },
  },
  emits: ['change'],
  setup(props, { emit }) {
    const { translate } = useFormI18n()
    const tr = (key: string, named?: Record<string, unknown>) => translate(`builder.${key}`, named)
    const changed = () => emit('change')

    const location = computed(() => (props.nodeId ? locate(props.model, props.nodeId) : undefined))
    const node = computed<FormNode | undefined>(() => location.value?.node)
    const isDetail = computed(() => !!location.value && location.value.index < 0 && !!location.value.parent)
    const schema = computed(() => (node.value ? propertySchema(props.model, node.value.id) : undefined))
    const item = computed(() => (node.value ? matchItem(node.value, schema.value, props.catalog.items) : undefined))
    const api = computed(() => (item.value ? props.catalog.renderers[item.value.renderer] : undefined))

    // --- key

    const keyDraft = ref('')
    const keyError = ref('')
    const mentions = ref<{ key: string; expressions: string[] }>({ key: '', expressions: [] })
    watch(node, (n) => {
      keyDraft.value = n?.path ? n.path[n.path.length - 1]! : ''
      keyError.value = ''
      mentions.value = { key: '', expressions: [] }
    }, { immediate: true })

    const rename = () => {
      const n = node.value
      if (!n || !n.path) return
      const oldKey = n.path[n.path.length - 1]!
      const key = keyDraft.value.trim()
      if (key === oldKey) return
      if (!isValidKey(key)) {
        keyError.value = tr('invalidKey')
        return
      }
      if (!renameProperty(props.model, n.id, key)) {
        keyError.value = tr('keyTaken')
        return
      }
      keyError.value = ''
      const references = ruleReferences(props.model, oldKey)
      mentions.value = { key: oldKey, expressions: references.map((r) => `${r.rule}: ${r.expression}`) }
      changed()
    }

    // --- helpers

    const section = (title: string, content: VNode[], open = true): VNode =>
      h(QExpansionItem, { label: title, defaultOpened: open, dense: true, headerClass: 'text-weight-medium', class: 'q-builder-section' }, () => h('div', { class: 'q-px-md q-pb-md' }, content))

    const textInput = (slot: TextSlot, label: string, multiline = false): VNode => {
      const n = node.value!
      return h(QInput, {
        modelValue: getText(props.model, n, slot, props.locale) ?? '',
        label,
        dense: true,
        outlined: true,
        autogrow: multiline,
        type: multiline ? 'textarea' : 'text',
        class: 'q-mb-sm',
        hint: `${keyPrefix(props.model, n)}.${slot.name}`,
        hideHint: true,
        'onUpdate:modelValue': (value: string | number | null) => {
          setText(props.model, n, slot, props.locale, value === null ? '' : String(value))
          changed()
        },
      })
    }

    // --- raw JSON editors, refreshed when the node or its values change

    const pretty = (value: unknown) => JSON.stringify(value ?? {}, null, 2)
    const rawElement = { text: ref(''), error: ref('') }
    const rawSchema = { text: ref(''), error: ref('') }
    watch(() => (node.value ? pretty(node.value.element) : ''), (next) => { rawElement.text.value = next; rawElement.error.value = '' }, { immediate: true })
    watch(() => (schema.value ? pretty(schema.value) : ''), (next) => { rawSchema.text.value = next; rawSchema.error.value = '' }, { immediate: true })

    const jsonInput = (label: string, { text, error }: { text: { value: string }; error: { value: string } }, apply: (parsed: any) => void): VNode => {
      return h('div', { class: 'q-mb-md' }, [
        h(QInput, { modelValue: text.value, label, dense: true, outlined: true, type: 'textarea', autogrow: true, inputClass: 'q-builder-code', error: !!error.value, errorMessage: error.value, 'onUpdate:modelValue': (v: string | number | null) => { text.value = String(v ?? '') } }),
        h(QBtn, {
          label: tr('apply'), size: 'sm', color: 'primary', unelevated: true, class: 'q-mt-xs',
          onClick: () => {
            try {
              const parsed = JSON.parse(text.value)
              if (!isObject(parsed)) throw new Error('object expected')
              error.value = ''
              apply(parsed)
              changed()
            } catch (e) {
              error.value = `${tr('invalidJson')}: ${(e as Error).message}`
            }
          },
        }),
      ])
    }

    // --- sections

    const renderHeader = (): VNode[] => {
      const n = node.value!
      const parts: VNode[] = []
      const title = isDetail.value ? tr('items') : n === props.model.root ? tr('root') : item.value?.label ?? String(n.element.type ?? tr('element'))
      parts.push(h('div', { class: 'row items-center q-mb-sm' }, [
        h(QIcon, { name: item.value?.icon ?? (n.kind === 'control' ? 'input' : 'view_agenda'), class: 'q-mr-sm' }),
        h('span', { class: 'text-subtitle1' }, title),
        api.value ? h('span', { class: 'text-caption text-grey-6 q-ml-sm' }, api.value.name) : null,
      ]))
      if (n.kind === 'control' && n.path) {
        parts.push(h('div', { class: 'row items-center q-col-gutter-sm' }, [
          h('div', { class: 'col' }, [
            h(QInput, {
              modelValue: keyDraft.value, label: tr('key'), dense: true, outlined: true, error: !!keyError.value, errorMessage: keyError.value,
              prefix: n.path.length > 1 ? n.path.slice(0, -1).join('.') + '.' : undefined,
              'onUpdate:modelValue': (v: string | number | null) => { keyDraft.value = String(v ?? '') },
              onBlur: rename,
              onKeyup: (e: KeyboardEvent) => { if (e.key === 'Enter') rename() },
            }),
          ]),
          h('div', { class: 'col-auto' }, [
            h(QToggle, { modelValue: isRequired(props.model, n.id), label: tr('required'), dense: true, 'onUpdate:modelValue': (v: boolean) => { setRequired(props.model, n.id, v); changed() } }),
          ]),
        ]))
        if (mentions.value.expressions.length > 0) {
          parts.push(h(QBanner, { dense: true, rounded: true, class: 'bg-warning text-dark q-mt-sm' }, () => [
            h('div', tr('rulesMention', { key: mentions.value.key })),
            h('ul', { class: 'q-my-xs' }, mentions.value.expressions.map((e) => h('li', {}, h('code', e)))),
          ]))
        }
      }
      return parts
    }

    const renderTexts = (): VNode | null => {
      const n = node.value!
      const slots = textSlots(props.model, n).filter((slot) => !slot.name.startsWith('options.') && !slot.name.startsWith('validation.'))
      if (slots.length === 0) return null
      return section(tr('texts'), slots.map((slot) => textInput(slot, slot.name.startsWith('labels.') ? `${tr('label')} ${Number(slot.name.slice(7)) + 1}` : slot.name, slot.name === 'description' || slot.name === 'text' || slot.name === 'hint')))
    }

    const renderChoices = (): VNode | null => {
      const n = node.value!
      const choices = choicesOf(schema.value)
      if (!choices) return null
      const { entries, target, key } = choices
      const toOneOf = (): JsonObject[] => {
        if (key === 'enum') {
          target.oneOf = entries.map((entry) => ({ ...entry }))
          delete target.enum
        }
        return target.oneOf
      }
      const rows = entries.map((entry, index) => {
        const slot = textSlots(props.model, n).find((s) => s.name === `options.${entry.const}`)
        return h('div', { class: 'row items-center q-col-gutter-xs q-mb-xs no-wrap', key: index }, [
          h('div', { class: 'col-4' }, [h(QInput, {
            modelValue: String(entry.const ?? ''), label: tr('value'), dense: true, outlined: true,
            'onUpdate:modelValue': (v: string | number | null) => {
              const oneOf = toOneOf()
              const previous = oneOf[index]!.const
              const next = typeof previous === 'number' && v !== null && v !== '' && !isNaN(Number(v)) ? Number(v) : String(v ?? '')
              if (next === previous) return
              // the label follows the value: its key changes with it
              const prefix = keyPrefix(props.model, n)
              for (const messages of Object.values(props.model.translations)) {
                const old = `${prefix}.options.${previous}`
                if (old in messages) {
                  messages[`${prefix}.options.${next}`] = messages[old]!
                  delete messages[old]
                }
              }
              if (oneOf[index]!.title === `${prefix}.options.${previous}`) oneOf[index]!.title = `${prefix}.options.${next}`
              oneOf[index]!.const = next
              changed()
            },
          })]),
          h('div', { class: 'col' }, [slot ? h(QInput, {
            modelValue: getText(props.model, n, slot, props.locale) ?? '', label: tr('label'), dense: true, outlined: true,
            'onUpdate:modelValue': (v: string | number | null) => {
              toOneOf()
              const current = textSlots(props.model, n).find((s) => s.name === slot.name)
              if (current) setText(props.model, n, current, props.locale, String(v ?? ''))
              changed()
            },
          }) : null]),
          h('div', { class: 'col-auto' }, [h(QBtn, { flat: true, dense: true, round: true, size: 'sm', icon: 'delete', onClick: () => { toOneOf().splice(index, 1); changed() } })]),
        ])
      })
      rows.push(h(QBtn, {
        flat: true, dense: true, size: 'sm', icon: 'add', label: tr('addChoice'), class: 'q-mt-xs',
        onClick: () => {
          const oneOf = toOneOf()
          let value = `choice${oneOf.length + 1}`
          while (oneOf.some((e) => e.const === value)) value += '_'
          oneOf.push({ const: value, title: `${keyPrefix(props.model, n)}.options.${value}` })
          changed()
        },
      }))
      return section(tr('choices'), rows)
    }

    const renderSettings = (): VNode | null => {
      const n = node.value!
      const settings = optionsSchema(api.value)
      const others = rawOptions(api.value)
      if (!settings && Object.keys(others).length === 0) return null
      const content: VNode[] = []
      if (settings) {
        content.push(h(QJsonForm, {
          modelValue: isObject(n.element.options) ? n.element.options : {},
          schema: settings,
          validationMode: 'NoValidation',
          'onUpdate:modelValue': (value: JsonObject) => {
            const options = Object.fromEntries(Object.entries(value ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== ''))
            // the form also emits on mount: only a real change is applied
            if (JSON.stringify(options) === JSON.stringify(isObject(n.element.options) ? n.element.options : {})) return
            if (Object.keys(options).length > 0) n.element.options = options
            else delete n.element.options
            changed()
          },
        }))
      }
      if (Object.keys(others).length > 0) {
        content.push(h('div', { class: 'text-caption text-grey-7 q-mt-sm' }, [
          tr('rawOptions'), ' ',
          ...Object.keys(others).map((name) => h(QChip, { dense: true, size: 'sm', label: name })),
        ]))
      }
      return section(tr('options'), content, false)
    }

    const renderKeywords = (): VNode | null => {
      const n = node.value!
      const keywords = keywordsSchema(schema.value)
      if (!keywords || !schema.value) return null
      const names = Object.keys(keywords.properties)
      const current = Object.fromEntries(names.filter((name) => schema.value![name] !== undefined).map((name) => [name, schema.value![name]]))
      return section(tr('validation'), [
        h(QJsonForm, {
          modelValue: current,
          schema: keywords,
          validationMode: 'NoValidation',
          'onUpdate:modelValue': (value: JsonObject) => {
            const target = propertySchema(props.model, n.id)
            if (!target) return
            let touched = false
            for (const name of names) {
              const v = value?.[name]
              if (v === undefined || v === null || v === '') {
                if (target[name] !== undefined) { delete target[name]; touched = true }
              } else if (target[name] !== v) {
                target[name] = v
                touched = true
              }
            }
            if (touched) changed()
          },
        }),
      ], false)
    }

    const ruleInput = (n: FormNode, name: string, label: string): VNode => {
      const rules: JsonObject = isObject(n.element.rules) ? n.element.rules : {}
      const value = typeof rules[name] === 'string' ? rules[name] : ''
      const error = expressionError(value)
      return h(QInput, {
        modelValue: value, label, dense: true, outlined: true, class: 'q-mb-sm', inputClass: 'q-builder-code',
        error: !!error, errorMessage: error ? `${tr('invalidExpression')}: ${error}` : undefined,
        'onUpdate:modelValue': (v: string | number | null) => {
          const text = String(v ?? '')
          const target: JsonObject = isObject(n.element.rules) ? n.element.rules : (n.element.rules = {})
          if (text.trim()) target[name] = text
          else delete target[name]
          if (Object.keys(target).length === 0) delete n.element.rules
          changed()
        },
      })
    }

    const renderRules = (): VNode | null => {
      const n = node.value!
      if (n === props.model.root || isDetail.value) return null
      const rules: JsonObject = isObject(n.element.rules) ? n.element.rules : {}
      const content: VNode[] = []
      const names = fieldNames(containerOf(props.model, location.value?.list))
      if (names.length > 0) {
        content.push(h('div', { class: 'text-caption text-grey-7 q-mb-sm' }, [tr('fields'), ': ', ...names.map((name) => h(QChip, { dense: true, size: 'sm', label: name }))]))
      }
      content.push(ruleInput(n, 'visible', tr('visible')))
      if (n.kind === 'control') content.push(ruleInput(n, 'enabled', tr('enabled')))
      const format = schema.value?.format ?? (isObject(n.element.options) ? n.element.options.format : undefined)
      if (format === 'computed') content.push(ruleInput(n, 'compute', tr('compute')))
      if (n.kind === 'control') {
        const validation: JsonObject[] = Array.isArray(rules.validation) ? rules.validation : []
        validation.forEach((rule, index) => {
          const expr = typeof rule.expr === 'string' ? rule.expr : typeof rule.expression === 'string' ? rule.expression : ''
          const error = expressionError(expr)
          const slot = textSlots(props.model, n).find((s) => s.name === `validation.${index}`)
          content.push(h('div', { class: 'row q-col-gutter-xs items-start no-wrap q-mb-xs', key: index }, [
            h('div', { class: 'col-5' }, [h(QInput, {
              modelValue: expr, label: tr('expression'), dense: true, outlined: true, inputClass: 'q-builder-code',
              error: !!error, errorMessage: error ? `${tr('invalidExpression')}: ${error}` : undefined,
              'onUpdate:modelValue': (v: string | number | null) => { delete rule.expression; rule.expr = String(v ?? ''); changed() },
            })]),
            h('div', { class: 'col' }, [slot ? textInput(slot, tr('message')) : null]),
            h('div', { class: 'col-auto' }, [h(QBtn, { flat: true, dense: true, round: true, size: 'sm', icon: 'delete', onClick: () => { validation.splice(index, 1); if (validation.length === 0) delete rules.validation; if (Object.keys(rules).length === 0) delete n.element.rules; changed() } })]),
          ]))
        })
        content.push(h(QBtn, {
          flat: true, dense: true, size: 'sm', icon: 'add', label: tr('addRule'),
          onClick: () => {
            const target: JsonObject = isObject(n.element.rules) ? n.element.rules : (n.element.rules = {})
            if (!Array.isArray(target.validation)) target.validation = []
            const index = target.validation.length
            target.validation.push({ expr: '', message: `${keyPrefix(props.model, n)}.validation.${index}` })
            changed()
          },
        }))
      }
      return section(tr('rules'), content, false)
    }

    const renderRaw = (): VNode => {
      const n = node.value!
      const content: VNode[] = [
        jsonInput(tr('rawElement'), rawElement, (parsed) => {
          delete parsed.elements
          delete parsed.scope
          n.element = parsed
        }),
      ]
      if (n.kind === 'control' && schema.value) {
        content.push(jsonInput(tr('rawSchema'), rawSchema, (parsed) => {
          const target = propertySchema(props.model, n.id)
          if (!target) return
          for (const key of Object.keys(target)) delete target[key]
          Object.assign(target, parsed)
        }))
      }
      return section(tr('raw'), content, false)
    }

    return () => {
      if (!node.value) return h('div', { class: 'text-grey-7 q-pa-md' }, tr('noSelection'))
      return h('div', { class: 'q-builder-properties' }, [
        ...renderHeader(),
        h(QSeparator, { class: 'q-my-sm' }),
        renderTexts(),
        renderChoices(),
        renderSettings(),
        renderKeywords(),
        renderRules(),
        renderRaw(),
      ])
    }
  },
})

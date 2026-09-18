/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, h, inject, ref, watch, unref } from 'vue'
import type { Ref, ComputedRef, VNode } from 'vue'
import { useRules } from './useRules'
import { useFormI18n } from './useFormI18n'
import { useReportedErrors } from './useFormErrors'
import { DATA_KEY, READONLY_KEY, LANGUAGES_KEY } from './keys'
import { omitOptions } from '../utils/options'
import { renderMarkdown, renderMarkdownInline } from '../utils/markdown'

export interface SelectOption {
  label: string
  value: any
  /** image URL of a `oneOf` entry (`image` key), for the images control */
  image?: string
  /** grid placement of a `oneOf` entry (`grid` key), for the images control */
  grid?: Record<string, any>
  /** area of a `oneOf` entry (`area` key), for the image map control */
  area?: Record<string, any>
}

export interface ValidationRule {
  expr?: string
  expression?: string
  message: string
}

export interface ControlRules {
  visible?: string
  enabled?: string
  max?: string
  min?: string
  compute?: string
  validation?: ValidationRule[]
}

export interface ControlSchema {
  type?: string
  format?: string
  title?: string
  label?: string
  description?: string
  rules?: ControlRules
  options?: Record<string, any>
  enum?: any[]
  oneOf?: any[]
  items?: any
  properties?: Record<string, any>
}

export interface ControlUISchema {
  type?: string
  rules?: ControlRules
  options?: Record<string, any>
  title?: string
  label?: string | false
  description?: string
  hint?: string
  titleClass?: string
  descriptionClass?: string
  hintClass?: string
}

export interface Control {
  value: {
    schema: ControlSchema
    uischema: ControlUISchema
    data: any
    label?: string
    description?: string
    required: boolean
    enabled: boolean
    errors: string[]
    path: string
    config?: Record<string, any>
  }
}

/** A language a localized string can be entered in */
export interface Language {
  code: string
  label: string
}

/** `['en', 'fr']` or `{ en: 'English', fr: 'Français' }` */
export type LanguagesInput = string[] | Record<string, string> | undefined | null

export function normalizeLanguages(input: LanguagesInput): Language[] {
  if (Array.isArray(input)) {
    return input.filter((code) => typeof code === 'string' && code.length > 0).map((code) => ({ code, label: code.toUpperCase() }))
  }
  if (input && typeof input === 'object') {
    return Object.keys(input).map((code) => ({ code, label: String(input[code] || code.toUpperCase()) }))
  }
  return []
}

export interface ControlPropertiesReturn {
  isVisible: ComputedRef<boolean>
  isEnabled: ComputedRef<boolean>
  maxValue: ComputedRef<any>
  minValue: ComputedRef<any>
  computeValue: ComputedRef<any>
  hasError: ComputedRef<boolean>
  errorMessage: ComputedRef<string>
  isReadonly: ComputedRef<boolean>
  requiredMark: ComputedRef<string>
  inputLabel: ComputedRef<string | undefined>
  rootClass: ComputedRef<string | undefined>
  options: ComputedRef<Record<string, any>>
  config: ComputedRef<Record<string, any>>
  languages: ComputedRef<Language[]>
  selectOptions: ComputedRef<SelectOption[]>
  isValueValid: ComputedRef<boolean>
  /** the `title` of the element or of the schema, displayed above the control (`label: false` hides it) */
  title: ComputedRef<string | undefined>
  /** the `description`, displayed under the title */
  description: ComputedRef<string | undefined>
  /** the `label`, displayed inside the input */
  label: ComputedRef<string | undefined>
  /** the `hint`, displayed under the input */
  hint: ComputedRef<string | undefined>
  /** the title (inline markdown, with the required mark) as a `div.q-form-title`, or null */
  renderTitle: () => VNode | null
  /** the description (markdown) as a `div.q-form-description`, or null */
  renderDescription: () => VNode | null
  /** the title and the description, to display above the control */
  renderHeader: () => VNode[]
  /** the hint (markdown) as a `div.q-form-hint`, or null, to display after the component */
  renderHint: () => VNode | null
  /** `{ hint }` slot of a Quasar field (QInput, QSelect...) rendering the hint, empty when there is none */
  hintSlot: ComputedRef<Record<string, () => VNode | null>>
  /**
   * Message of a renderer-level validator: the control `options.validationMessage[name]`
   * (translated) when defined, else the built-in message `fallbackKey`.
   */
  validationMessage: (name: string, fallbackKey: string, named?: Record<string, unknown>) => string
  clearInvalidSelection: (handleChange: (path: string, value: any) => void) => () => void
}

export function useControlProperties(control: Ref<any>): ControlPropertiesReturn {
  const { t, translate } = useFormI18n()

  // Inject form data and readonly state from provider
  const injectedFormData = inject(DATA_KEY, ref({}))
  const injectedReadonly = inject(READONLY_KEY, ref(false))
  // raw value or ref, from QJsonForm or an application-level provide
  const injectedLanguages = inject<unknown>(LANGUAGES_KEY, undefined)

  const { evaluateRule } = useRules(injectedFormData)

  // Extract rule options from UI schema
  const ruleOptions = computed(() => {
    const schemaRules = control.value.schema.rules || {}
    const uischemaRules = control.value.uischema.rules || {}
    // merge rules, override uischema rules over schema rules
    const rules = {
      ...schemaRules,
      ...uischemaRules,
    }
    return rules
  })

  // Visibility rule
  const isVisible = computed(() => {
    const rule = ruleOptions.value.visible
    if (!rule) return true
    try {
      const rval = evaluateRule(rule)
      return rval === true
    } catch (error) {
      console.error('Error evaluating visibility rule:', rule, error)
      return true
    }
  })

  // Enable rule
  const isEnabled = computed(() => {
    if (!control.value.enabled) return false
    const rule = ruleOptions.value.enabled
    if (!rule) return true
    try {
      const rval = evaluateRule(rule)
      return rval === true
    } catch (error) {
      console.error('Error evaluating enable rule:', rule, error)
      return false
    }
  })

  // Max rule
  const maxValue = computed(() => {
    const rule = ruleOptions.value.max
    if (!rule) return undefined
    try {
      return evaluateRule(rule)
    } catch (error) {
      console.error('Error evaluating max rule:', rule, error)
      return undefined
    }
  })

  // Min rule
  const minValue = computed(() => {
    const rule = ruleOptions.value.min
    if (!rule) return undefined
    try {
      return evaluateRule(rule)
    } catch (error) {
      console.error('Error evaluating min rule:', rule, error)
      return undefined
    }
  })

  // Compute rule
  const computeValue = computed(() => {
    const rule = ruleOptions.value.compute
    if (!rule) return undefined
    try {
      return evaluateRule(rule)
    } catch (error) {
      console.error('Error evaluating compute rule:', rule, error)
      return undefined
    }
  })

  // Custom validation
  const customValidationErrors = computed(() => {
    const rules = ruleOptions.value.validation || []
    const errors: string[] = []

    rules.forEach((rule: ValidationRule) => {
      let expression: string | undefined
      try {
        expression = rule.expr || rule.expression
        if (expression && !evaluateRule(expression)) {
          errors.push(t(rule.message))
        }
      } catch (error) {
        console.error('Error evaluating validation rule:', expression, error)
      }
    })

    return errors
  })

  // Report the `validation` rule errors of visible controls to the form
  useReportedErrors(
    () => control.value.path,
    'validation',
    computed(() => (isVisible.value ? customValidationErrors.value : [])),
  )

  // Combined errors
  const hasError = computed(() => {
    return control.value.errors.length > 0 || customValidationErrors.value.length > 0
  })

  const errorMessage = computed(() => {
    const jsonFormsErrors = Array.isArray(control.value.errors)
      ? control.value.errors
      : [control.value.errors]
    const customErrors = customValidationErrors.value
    // Combine both error arrays
    const allErrors = [...jsonFormsErrors, ...customErrors].filter((e: any) => e && e.length > 0)
    return allErrors.join('; ')
  })

  // Extract options from ui schema or schema. `grid` is the placement of the
  // element in a GridLayout, read by the layout: not a renderer option, and
  // not to be forwarded to the Quasar components.
  const options = computed(() => {
    const opts = control.value.uischema?.options || control.value.schema?.options || {}
    return 'grid' in opts ? omitOptions(opts, ['grid']) : opts
  })

  // JSON Forms config (`config` prop of QJsonForm)
  const config = computed(() => {
    return control.value.config || {}
  })

  // Languages of localized strings: control options, then form config, then
  // the `languages` prop of QJsonForm (or an application-level provide)
  const languages = computed<Language[]>(() => {
    const candidates: LanguagesInput[] = [options.value.languages, config.value.languages, unref(injectedLanguages) as LanguagesInput]
    for (const candidate of candidates) {
      const normalized = normalizeLanguages(candidate)
      if (normalized.length > 0) return normalized
    }
    return [{ code: 'en', label: 'EN' }]
  })

  // Read-only: form-level (QJsonForm `readonly` prop), control-level (`options.readonly`)
  // or schema-level (`readOnly`). Distinct from being disabled by an `enabled` rule.
  const isReadonly = computed(() => {
    return injectedReadonly.value === true
      || options.value.readonly === true
      || options.value.readOnly === true
      || control.value.schema?.readOnly === true
  })

  // Texts of the control. The title (and its description) is displayed above
  // the control, questionnaire style; the label is the label of the input
  // itself and the hint is displayed under it. Each one is read from the UI
  // schema element first, then from the schema. `label: false` on the element
  // hides the title (JSON Forms convention).
  const title = computed(() => {
    if (control.value.uischema.label === false) return undefined
    return control.value.uischema.title || control.value.schema.title || undefined
  })

  const description = computed(() => {
    return control.value.uischema.description || control.value.schema.description || undefined
  })

  const label = computed(() => {
    const value = control.value.uischema.label || control.value.schema.label
    return typeof value === 'string' && value.length > 0 ? value : undefined
  })

  const hint = computed(() => {
    return control.value.uischema.hint || (control.value.schema as any).hint || undefined
  })

  // Marker appended to the title (or to the label when there is no title) of a required control
  const requiredMark = computed(() => (control.value.required ? ' *' : ''))

  // Translated label for input-like components, with the required marker when no title carries it
  const inputLabel = computed(() => {
    if (!label.value) return undefined
    return t(label.value) + (title.value ? '' : requiredMark.value)
  })

  const renderTitle = (): VNode | null => {
    if (!title.value) return null
    return h('div', {
      class: ['q-form-title', control.value.uischema.titleClass],
      innerHTML: renderMarkdownInline(t(title.value)) + requiredMark.value,
    })
  }

  const renderDescription = (): VNode | null => {
    if (!description.value) return null
    return h('div', {
      class: ['q-form-description text-markdown', control.value.uischema.descriptionClass],
      innerHTML: renderMarkdown(t(description.value)).trim(),
    })
  }

  const renderHeader = (): VNode[] => {
    return [renderTitle(), renderDescription()].filter((node): node is VNode => node !== null)
  }

  const renderHint = (): VNode | null => {
    if (!hint.value) return null
    return h('div', {
      class: ['q-form-hint text-markdown', control.value.uischema.hintClass],
      innerHTML: renderMarkdown(t(hint.value)).trim(),
    })
  }

  const hintSlot = computed<Record<string, () => VNode | null>>(() => {
    const slots: Record<string, () => VNode | null> = {}
    if (hint.value) slots.hint = renderHint
    return slots
  })

  // CSS classes applied to the root element of the renderer
  const rootClass = computed(() => {
    const cls = options.value.class
    return typeof cls === 'string' && cls.length > 0 ? cls : undefined
  })

  // Transform enum values into q-select options
  const selectOptions = computed(() => {
    const schema = control.value.schema

    const optionVisible = (val: any): boolean => {
      if (val.rules && val.rules.visible) {
        try {
          return evaluateRule(val.rules.visible)
        }
        catch (error) {
          console.error('Error evaluating visibility rule for option:', val, error)
          return true
        }
      }
      return true
    }

    // a `oneOf` entry: its `image`, `grid` and `area` keys are kept for the images and image map controls
    const fromEntry = (val: any): SelectOption => {
      const option: SelectOption = { label: t(String(val.title || val.const)), value: val.const }
      if (typeof val.image === 'string') option.image = val.image
      if (val.grid && typeof val.grid === 'object') option.grid = val.grid
      if (val.area && typeof val.area === 'object') option.area = val.area
      return option
    }

    if (schema.type === 'array' && schema.items) {
      const itemsSchema = schema.items
      if (itemsSchema.oneOf && Array.isArray(itemsSchema.oneOf) && itemsSchema.oneOf.length > 0) {
        // for each oneOf item, filter by visibility and map to label/value
        return itemsSchema.oneOf.filter(optionVisible).map(fromEntry)
      }

      if (itemsSchema.enum) {
        return itemsSchema.enum.map((value: any) => ({
          label: t(String(value)),
          value: value,
        }))
      }
    }

    if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
      // for each oneOf item, filter by visibility and map to label/value
      return schema.oneOf.filter(optionVisible).map(fromEntry)
    }

    if (schema.enum) {
      return schema.enum.map((value: any) => ({
        label: t(String(value)),
        value: value,
      }))
    }

    return []
  })

  // Check if current value is valid (exists in selectOptions)
  const isValueValid = computed(() => {
    const currentValue = control.value.data
    const options = selectOptions.value

    // If no value is set, it's valid (empty state)
    if (currentValue === undefined || currentValue === null) {
      return true
    }

    // Create a Set of option values for O(1) lookup performance
    const optionValues = new Set(options.map((opt: any) => opt.value))

    // Handle array values (multiple selection)
    if (Array.isArray(currentValue)) {
      // All selected values must exist in the options
      return currentValue.every(val => optionValues.has(val))
    }

    // Handle single value
    return optionValues.has(currentValue)
  })

  const validationMessage = (name: string, fallbackKey: string, named?: Record<string, unknown>): string => {
    const messages = options.value.validationMessage
    // a single string applies to every check of the control (angular-schema-form
    // convention); in a map, `default` is the fallback of the named messages
    const custom = typeof messages === 'string' ? messages : (messages?.[name] ?? messages?.default)
    if (typeof custom === 'string' && custom.length > 0) {
      return t(custom, named)
    }
    return translate(fallbackKey, named)
  }

  // Function to clear invalid selections
  const clearInvalidSelection = (handleChange: (path: string, value: any) => void) => {
    return watch(
      [selectOptions, () => control.value.data],
      () => {
        const options = selectOptions.value

        // Only clear if we have options and the current value is invalid
        // Don't clear if options are empty (might be temporary)
        // isValueValid already returns true for undefined/null, so we only get here
        // when there's an actual invalid selection that needs to be cleared
        if (!isReadonly.value && options.length > 0 && !isValueValid.value) {
          // Clear the selection if it's no longer valid
          const schema = control.value.schema
          const isMultiple = schema.type === 'array'
          handleChange(control.value.path, isMultiple ? [] : undefined)
        }
      },
      { immediate: false }
    )
  }

  return {
    isVisible,
    isEnabled,
    maxValue,
    minValue,
    computeValue,
    hasError,
    errorMessage,
    isReadonly,
    requiredMark,
    inputLabel,
    rootClass,
    options,
    config,
    languages,
    selectOptions,
    isValueValid,
    title,
    description,
    label,
    hint,
    renderTitle,
    renderDescription,
    renderHeader,
    renderHint,
    hintSlot,
    validationMessage,
    clearInvalidSelection,
  }
}

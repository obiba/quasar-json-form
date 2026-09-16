/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, inject, ref, watch, unref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useFiltrexRules } from './useFiltrexRules'
import { useFormI18n } from './useFormI18n'
import { useReportedErrors } from './useFormErrors'
import { DATA_KEY, READONLY_KEY, LANGUAGES_KEY } from './keys'

export interface SelectOption {
  label: string
  value: any
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
  label?: string
  description?: string
  hint?: string
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
  title: ComputedRef<string | undefined>
  description: ComputedRef<string | undefined>
  label: ComputedRef<string | undefined>
  hint: ComputedRef<string | undefined>
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

  const { evaluateRule } = useFiltrexRules(injectedFormData)

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

  // Report the filtrex validation errors of visible controls to the form
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

  // Extract options from ui schema or schema
  const options = computed(() => {
    return control.value.uischema?.options || control.value.schema?.options || {}
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

  // Marker appended to the label of a required control
  const requiredMark = computed(() => (control.value.required ? ' *' : ''))

  // Translated label with the required marker, for input-like components
  const inputLabel = computed(() => {
    return control.value.label ? t(control.value.label) + requiredMark.value : undefined
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

    if (schema.type === 'array' && schema.items) {
      const itemsSchema = schema.items
      if (itemsSchema.oneOf && Array.isArray(itemsSchema.oneOf) && itemsSchema.oneOf.length > 0) {
        // for each oneOf item, filter by visibility and map to label/value
        return itemsSchema.oneOf
          .filter(optionVisible)
          .map((val: any) => {
            return { label: t(String(val.title || val.const)), value: val.const }
          })
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
      return schema.oneOf
        .filter(optionVisible)
        .map((val: any) => {
          return { label: t(String(val.title || val.const)), value: val.const }
        })
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

  // `label: false` on the control hides the title (JSON Forms convention)
  const title = computed(() => {
    if ((control.value.uischema as any).label === false) return undefined
    return control.value.uischema.title || control.value.schema.title || undefined
  })

  const description = computed(() => {
    return control.value.uischema.description || control.value.schema.description || undefined
  })

  const label = computed(() => {
    return control.value.uischema.label || control.value.schema.label || undefined
  })

  const hint = computed(() => {
    return control.value.uischema.hint || control.value.schema.hint || undefined
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
    validationMessage,
    clearInvalidSelection,
  }
}

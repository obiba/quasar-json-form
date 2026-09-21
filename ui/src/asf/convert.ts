/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * angular-schema-form (ASF) compatibility: converts a `(schema, definition)`
 * pair of the ASF dialect into a `(schema, uischema)` pair for `QJsonForm`.
 *
 * The schema is nearly standard JSON Schema already (the custom `format`s are
 * understood by the renderers); the `definition` array is translated into a
 * JSON Forms UI schema. Everything the converter cannot translate is reported
 * as a diagnostic and skipped.
 */
import { transpileCondition, ConditionError } from './condition'

export interface AsfDiagnostic {
  level: 'warn' | 'info'
  message: string
  /** ASF key of the element concerned, when any */
  key?: string
  /** the definition element concerned */
  element?: unknown
}

export interface AsfConvertOptions {
  /**
   * Resolves the `t(key)` tokens found in the schema and the definition
   * (titles, help blocks, option labels, messages...). Without it, the `t()`
   * wrapper is removed and the key is kept, so that the renderers translate
   * the strings that are made of a single token with vue-i18n.
   */
  translate?: (key: string) => string
  /** languages of the localized strings, set as `options.languages` on the localized controls */
  languages?: string[] | Record<string, string>
  /** set `options.readonly` on every control */
  readonly?: boolean
  /** CSS class replacing the Bootstrap `row` (default: `row q-col-gutter-md`) */
  rowClass?: string
  /** number of rows of the `textarea` controls without `rows` (default: 3) */
  textareaRows?: number
  /** receives the diagnostics (default: `console.warn` for warnings); `false` to silence */
  logger?: ((diagnostic: AsfDiagnostic) => void) | false
}

export interface AsfConvertResult {
  schema: Record<string, any>
  uischema: Record<string, any>
  diagnostics: AsfDiagnostic[]
}

/** `t(key)` token, not preceded by an identifier character */
const T_TOKEN = /(?<![A-Za-z0-9_$])t\(([^()]*)\)/g

/** keys whose string values are never translation tokens */
const UNTRANSLATED_KEYS = new Set(['type', 'format', 'pattern', 'enum', 'const', 'default', '$ref', 'key', 'scope', 'condition', 'wordLimit', 'htmlClass', 'dateFormat'])

/** ASF definition types that map to a renderer `options.format` */
const FORMAT_TYPES: Record<string, string> = {
  password: 'password',
  email: 'email',
  url: 'url',
  date: 'datepicker',
  datepicker: 'datepicker',
  ymdatepicker: 'ymdatepicker',
  radios: 'radio',
  'radios-inline': 'radio',
  radiobuttons: 'radio',
  checkboxes: 'checkbox',
  'sf-checkboxgroup': 'checkbox',
  localizedstring: 'localizedString',
  localizedString: 'localizedString',
  obibaSimpleMde: 'obibaSimpleMde',
  obibaFileUpload: 'obibaFiles',
  radioGroupCollection: 'radioGroupCollection',
  obibaCountriesUiSelect: 'countries',
  'sf-typeahead': 'typeahead',
  typeahead: 'typeahead',
}

/** schema formats already matched by the renderer of each `options.format` */
const EQUIVALENT_FORMATS: Record<string, string[]> = {
  datepicker: ['date', 'datepicker', 'ymdatepicker', 'year-month'],
  ymdatepicker: ['ymdatepicker'],
  localizedString: ['localizedString', 'localizedstring', 'obibaSimpleMde'],
  obibaSimpleMde: ['localizedString', 'localizedstring', 'obibaSimpleMde'],
  obibaFiles: ['files', 'obibaFiles'],
  radioGroupCollection: ['radioGroupCollection', 'radio-matrix'],
  countries: ['countries', 'obibaCountriesUiSelect'],
  typeahead: ['typeahead'],
  password: ['password'],
  email: ['email'],
  url: ['url', 'uri'],
}

const LOCALIZED_FORMATS = ['localizedString', 'localizedstring', 'obibaSimpleMde']

/** definition types that are plain controls of the schema type */
const DEFAULT_TYPES = ['string', 'text', 'number', 'integer', 'checkbox', 'select', 'array', 'boolean', 'object']

/** definition types without a JSON Forms equivalent */
const SKIPPED_TYPES = ['actions', 'submit', 'button', 'reset', 'template', 'hidden', 'sf-obiba-selection-tree']

/** definition keys copied as-is into the control options */
const PASSTHROUGH_OPTIONS = ['rows', 'marked', 'wordLimit', 'wordMin', 'wordMax', 'emptyMessage', 'placeholder', 'minItems', 'maxItems']

interface KeyContext {
  /** ASF key segments of the enclosing array item (`['staff', '[]']`), the scopes are relative to it */
  prefix: string[]
  /** the enclosing array definition is read-only */
  readonly?: boolean
}

interface ResolvedKey {
  key: string
  segments: string[]
  /** JSON Forms scope, relative to the enclosing array item */
  scope: string
  /** schema of the property (in the converted schema copy) */
  node: any
  /** schema holding the property (`required` is declared there) */
  parent: any
  /** property name in `parent` */
  name: string
}

function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function hasType(schema: any, type: string): boolean {
  if (!isObject(schema)) return false
  return Array.isArray(schema.type) ? schema.type.includes(type) : schema.type === type
}

function parseKey(key: string | (string | number)[]): string[] {
  const text = Array.isArray(key)
    ? key.map((segment) => (segment === '' || typeof segment === 'number' ? '[]' : String(segment))).join('.')
    : String(key)
  const segments: string[] = []
  text.split('.').forEach((part) => {
    let rest = part
    while (rest.length > 0) {
      const bracket = rest.indexOf('[')
      if (bracket === -1) {
        segments.push(rest)
        break
      }
      if (bracket > 0) segments.push(rest.slice(0, bracket))
      const close = rest.indexOf(']', bracket)
      const index = close === -1 ? '' : rest.slice(bracket + 1, close)
      segments.push(index === '' ? '[]' : `[${index}]`)
      rest = close === -1 ? '' : rest.slice(close + 1)
    }
  })
  return segments.filter((segment) => segment.length > 0)
}

class Converter {
  readonly schema: any
  readonly diagnostics: AsfDiagnostic[] = []
  private readonly explicitKeys = new Set<string>()

  constructor(schema: any, private readonly options: AsfConvertOptions) {
    this.schema = this.resolveTokens(JSON.parse(JSON.stringify(schema ?? { type: 'object', properties: {} })))
    if (!isObject(this.schema.properties)) this.schema.properties = {}
  }

  // ---------------------------------------------------------------- helpers

  text(value: unknown): string {
    const text = String(value)
    return text.replace(T_TOKEN, (_match: string, key: string) => {
      const trimmed = key.trim()
      return this.options.translate ? this.options.translate(trimmed) : trimmed
    })
  }

  /** resolves the `t()` tokens of every string of a JSON value (schema, options...) */
  resolveTokens<T>(value: T, key?: string): T {
    if (typeof value === 'string') {
      return (key !== undefined && UNTRANSLATED_KEYS.has(key) ? value : this.text(value)) as T
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.resolveTokens(item, key)) as T
    }
    if (isObject(value)) {
      const result: Record<string, any> = {}
      Object.keys(value).forEach((name) => {
        result[name] = this.resolveTokens((value as any)[name], name)
      })
      return result as T
    }
    return value
  }

  warn(message: string, element?: unknown, key?: string): void {
    this.report({ level: 'warn', message, element, key })
  }

  info(message: string, element?: unknown, key?: string): void {
    this.report({ level: 'info', message, element, key })
  }

  private report(diagnostic: AsfDiagnostic): void {
    if (diagnostic.key === undefined) delete diagnostic.key
    if (diagnostic.element === undefined) delete diagnostic.element
    this.diagnostics.push(diagnostic)
    const logger = this.options.logger
    if (logger === false) return
    if (logger) {
      logger(diagnostic)
    } else if (diagnostic.level === 'warn') {
      console.warn(`[asf] ${diagnostic.message}${diagnostic.key ? ` (${diagnostic.key})` : ''}`)
    }
  }

  htmlClass(value: unknown): string | undefined {
    if (typeof value !== 'string' || value.trim().length === 0) return undefined
    const rowClass = this.options.rowClass ?? 'row q-col-gutter-md'
    return value
      .trim()
      .split(/\s+/)
      .map((cls) => {
        if (cls === 'row') return rowClass
        // Bootstrap 3 grid: col-xs-6 → col-6, col-xs-offset-3 → offset-3, col-md-offset-3 → offset-md-3
        const offset = /^col-(xs|sm|md|lg|xl)-offset-(\d+)$/.exec(cls)
        if (offset) return offset[1] === 'xs' ? `offset-${offset[2]}` : `offset-${offset[1]}-${offset[2]}`
        const col = /^col-xs-(\d+|auto)$/.exec(cls)
        if (col) return `col-${col[1]}`
        return cls
      })
      .join(' ')
  }

  resolveKey(item: any, ctx: KeyContext): ResolvedKey | undefined {
    const key = Array.isArray(item.key) ? item.key.join('.') : String(item.key)
    const segments = parseKey(item.key)
    if (segments.some((segment) => /^\[\d+\]$/.test(segment))) {
      this.warn(`indexed array keys are not supported: '${key}'`, item, key)
      return undefined
    }
    if (ctx.prefix.length > 0 && !ctx.prefix.every((segment, index) => segments[index] === segment)) {
      this.warn(`key '${key}' does not belong to the array item '${ctx.prefix.join('.')}'`, item, key)
      return undefined
    }
    let node: any = this.schema
    let parent: any = undefined
    let name = ''
    for (const segment of segments) {
      if (!isObject(node)) {
        node = undefined
        break
      }
      parent = node
      name = segment
      node = segment === '[]' ? node.items : node.properties?.[segment]
    }
    if (!isObject(node)) {
      this.warn(`key '${key}' is not defined in the schema`, item, key)
      return undefined
    }
    const relative = segments.slice(ctx.prefix.length)
    const scope = '#' + relative.map((segment) => (segment === '[]' ? '/items' : `/properties/${segment}`)).join('')
    return { key, segments, scope, node, parent, name }
  }

  // ------------------------------------------------------------- definition

  convert(definition: unknown): Record<string, any> {
    const items = Array.isArray(definition) ? definition : []
    this.collectExplicitKeys(items)
    return { type: 'VerticalLayout', elements: this.convertItems(items, { prefix: [] }) }
  }

  /**
   * Root property names listed in the definition (for `"*"`). Inside a keyed
   * element (object fieldset or array), only keys under that same root property
   * count: a relative key there is rejected by `resolveKey`.
   */
  private collectExplicitKeys(items: any[], root?: string): void {
    const add = (key: unknown): string | undefined => {
      const first = parseKey(key as string)[0]
      if (first === undefined || (root !== undefined && first !== root)) return undefined
      this.explicitKeys.add(first)
      return first
    }
    items.forEach((item) => {
      if (typeof item === 'string') {
        if (item !== '*') add(item)
      } else if (isObject(item)) {
        const itemRoot = item.key !== undefined ? add(item.key) ?? root : root
        if (Array.isArray(item.items)) this.collectExplicitKeys(item.items, itemRoot)
        if (Array.isArray(item.tabs)) item.tabs.forEach((tab: any) => Array.isArray(tab?.items) && this.collectExplicitKeys(tab.items, itemRoot))
      }
    })
  }

  convertItems(items: any[], ctx: KeyContext): any[] {
    const elements: any[] = []
    items.forEach((item) => {
      elements.push(...this.convertItem(item, ctx))
    })
    return elements
  }

  convertItem(item: any, ctx: KeyContext): any[] {
    if (typeof item === 'string') {
      if (item === '*') return this.convertRemaining(ctx)
      return this.convertItem({ key: item }, ctx)
    }
    if (!isObject(item)) {
      this.warn(`unsupported definition element: ${JSON.stringify(item)}`, item)
      return []
    }
    const type = typeof item.type === 'string' ? item.type : undefined
    if (type !== undefined && SKIPPED_TYPES.includes(type)) {
      this.info(`'${type}' elements are not rendered`, item, item.key !== undefined ? String(item.key) : undefined)
      return []
    }
    if (item.key !== undefined) {
      const element = this.convertKeyed(item, ctx)
      return element ? [element] : []
    }
    switch (type) {
      case 'help':
        return [this.withCommon(item, { type: 'Label', text: this.text(item.helpvalue ?? item.description ?? '') })]
      case 'section':
      case 'conditional':
      case undefined:
        return [this.withCommon(item, { type: 'VerticalLayout', elements: this.convertItems(item.items ?? [], ctx) })]
      case 'fieldset': {
        const group: any = { type: 'Group' }
        if (typeof item.title === 'string' && item.title.length > 0) group.label = this.text(item.title)
        group.elements = this.convertItems(item.items ?? [], ctx)
        return [this.withCommon(item, group)]
      }
      case 'tabs': {
        const tabs = Array.isArray(item.tabs) ? item.tabs : []
        const categorization: any = {
          type: 'Categorization',
          elements: tabs.map((tab: any) => ({
            type: 'Category',
            label: this.text(tab?.title ?? ''),
            elements: this.convertItems(tab?.items ?? [], ctx),
          })),
        }
        return [this.withCommon(item, categorization)]
      }
      default:
        this.warn(`unsupported definition type '${type}' without key`, item)
        return []
    }
  }

  /** `"*"`: every root property not listed elsewhere in the definition */
  private convertRemaining(ctx: KeyContext): any[] {
    if (ctx.prefix.length > 0) {
      this.warn("'*' is only supported at the root of the definition")
      return []
    }
    const elements: any[] = []
    Object.keys(this.schema.properties).forEach((name) => {
      if (!this.explicitKeys.has(name)) {
        elements.push(...this.convertItem({ key: name }, ctx))
      }
    })
    return elements
  }

  /** `htmlClass` and `condition`, common to controls, layouts and labels */
  private withCommon(item: any, element: any): any {
    const cls = this.htmlClass(item.htmlClass)
    if (cls) {
      element.options = { ...(element.options || {}), class: cls }
    }
    if (typeof item.condition === 'string' && item.condition.trim().length > 0) {
      try {
        element.rules = { ...(element.rules || {}), visible: transpileCondition(item.condition) }
      } catch (error) {
        const message = error instanceof ConditionError ? error.message : String(error)
        this.warn(`condition not converted: ${item.condition} (${message})`, item, item.key !== undefined ? String(item.key) : undefined)
      }
    }
    return element
  }

  private convertKeyed(item: any, ctx: KeyContext): any | undefined {
    const resolved = this.resolveKey(item, ctx)
    if (!resolved) return undefined
    const { node } = resolved
    // `x-schema-form` in the schema holds definition defaults for the key
    const merged = isObject(node['x-schema-form']) ? { ...node['x-schema-form'], ...item } : item
    const type = typeof merged.type === 'string' ? merged.type : undefined

    if (merged.required === true || node.required === true) {
      this.markRequired(resolved)
    }
    if (node.required === true) delete node.required
    if (typeof merged.title === 'string') node.title = this.text(merged.title)
    if (typeof merged.description === 'string') node.description = this.text(merged.description)

    const isWidget = typeof node.format === 'string' || (type !== undefined && FORMAT_TYPES[type] !== undefined)
    const isObjectLayout = hasType(node, 'object') && !isWidget && (Array.isArray(merged.items) || isObject(node.properties))
    if (isObjectLayout) {
      return this.convertObject(merged, resolved, ctx)
    }
    return this.convertControl(merged, resolved, ctx)
  }

  private markRequired(resolved: ResolvedKey): void {
    const { parent, name } = resolved
    if (!isObject(parent) || name === '[]') return
    const required = Array.isArray(parent.required) ? parent.required : []
    if (!required.includes(name)) parent.required = [...required, name]
  }

  /** an object key rendered as a fieldset of its properties (or of the given `items`) */
  private convertObject(item: any, resolved: ResolvedKey, ctx: KeyContext): any {
    const { node } = resolved
    const children = Array.isArray(item.items)
      ? this.convertItems(item.items, ctx)
      : Object.keys(node.properties || {}).flatMap((name) => this.convertItem({ key: `${resolved.key}.${name}` }, ctx))
    const title = item.notitle === true ? undefined : node.title
    const element: any = title ? { type: 'Group', label: title, elements: children } : { type: 'VerticalLayout', elements: children }
    return this.withCommon(item, element)
  }

  private convertControl(item: any, resolved: ResolvedKey, ctx: KeyContext): any {
    const { node, scope } = resolved
    const type = typeof item.type === 'string' ? item.type : undefined
    const element: any = { type: 'Control', scope }
    const options: Record<string, any> = {}
    const rules: Record<string, any> = {}

    if (item.notitle === true) element.label = false

    // ASF renders the description as a help block under the input: the hint
    // of the control (the schema `description` is displayed above the input)
    if (typeof node.description === 'string' && node.description.length > 0) {
      element.hint = node.description
      delete node.description
    }

    // definition type → renderer format / options
    if (type === 'textarea' || type === 'ui-ace') {
      options.rows = typeof item.rows === 'number' ? item.rows : (this.options.textareaRows ?? 3)
      if (type === 'ui-ace') this.info("'ui-ace' rendered as a textarea", item, resolved.key)
    } else if (type !== undefined && FORMAT_TYPES[type] !== undefined) {
      const format = FORMAT_TYPES[type]!
      const equivalents = EQUIVALENT_FORMATS[format] || []
      if (typeof node.format !== 'string' || !equivalents.includes(node.format)) {
        options.format = format
      }
      if (type === 'obibaSimpleMde') options.marked = true
    } else if (type !== undefined && !DEFAULT_TYPES.includes(type) && !['fieldset', 'section'].includes(type)) {
      this.warn(`unknown definition type '${type}', rendered from the schema`, item, resolved.key)
    }

    // enum labels: titleMap → oneOf
    if (item.titleMap !== undefined) {
      this.applyTitleMap(item.titleMap, node, resolved.key)
    }
    // ASF renders an array of enum values as checkboxes by default
    if (hasType(node, 'array') && isObject(node.items) && (node.items.enum !== undefined || node.items.oneOf !== undefined)) {
      node.uniqueItems = true
      if (options.format === undefined && (type === undefined || type === 'array')) options.format = 'checkbox'
    }

    PASSTHROUGH_OPTIONS.forEach((name) => {
      if (item[name] !== undefined) options[name] = this.resolveTokens(item[name], name)
    })
    if (options.minItems !== undefined || options.maxItems !== undefined) {
      // renderers read the item bounds from the schema
      if (options.minItems !== undefined) node.minItems = options.minItems
      if (options.maxItems !== undefined) node.maxItems = options.maxItems
      delete options.minItems
      delete options.maxItems
    }
    if (item.validationMessage !== undefined) {
      options.validationMessage = this.resolveTokens(item.validationMessage)
    }
    if (typeof item.add === 'string') options.addLabel = this.text(item.add)
    const readonly = item.readonly === true || ctx.readonly === true || this.options.readonly === true
    if (readonly) options.readonly = true
    if (this.options.languages && (LOCALIZED_FORMATS.includes(node.format) || LOCALIZED_FORMATS.includes(options.format))) {
      options.languages = this.options.languages
    }
    if (isObject(item.dateOptions)) {
      this.applyDateOptions(item.dateOptions, options, rules)
    }

    // array items
    if (hasType(node, 'array') && !isWidgetSchema(node, options)) {
      const itemsElement = this.convertArrayItems(item, resolved, readonly)
      if (itemsElement) options.items = itemsElement
    }

    if (Object.keys(options).length > 0) element.options = options
    if (Object.keys(rules).length > 0) element.rules = rules
    return this.withCommon(item, element)
  }

  private applyTitleMap(titleMap: unknown, node: any, key: string): void {
    let entries: { value: any; name: string }[]
    if (Array.isArray(titleMap)) {
      entries = titleMap.filter(isObject).map((entry) => ({ value: entry.value, name: String(entry.name ?? entry.value) }))
    } else if (isObject(titleMap)) {
      entries = Object.keys(titleMap).map((value) => ({ value, name: String(titleMap[value]) }))
    } else {
      this.warn('titleMap must be an array or an object', titleMap, key)
      return
    }
    const target = hasType(node, 'array') && isObject(node.items) ? node.items : node
    const oneOf = entries
      .filter((entry) => {
        if (entry.value === null && !hasType(target, 'null')) {
          this.info(`titleMap entry '${entry.name}' with a null value dropped: the schema does not allow null`, undefined, key)
          return false
        }
        return true
      })
      .map((entry) => ({ const: entry.value, title: this.text(entry.name) }))
    delete target.enum
    target.oneOf = oneOf
  }

  private applyDateOptions(dateOptions: Record<string, any>, options: Record<string, any>, rules: Record<string, any>): void {
    const { minDate, maxDate, minDateIsRef, maxDateIsRef, validationMessage, ...rest } = dateOptions
    if (Object.keys(rest).length > 0) options.dateOptions = this.resolveTokens(rest)
    if (isObject(validationMessage)) {
      // a control-wide string message stays the fallback of the date-specific ones
      const current = options.validationMessage
      const base = isObject(current) ? current : typeof current === 'string' ? { default: current } : {}
      options.validationMessage = { ...base, ...this.resolveTokens(validationMessage) }
    }
    if (minDate !== undefined) {
      if (minDateIsRef === true) rules.min = String(minDate)
      else options.min = minDate
    }
    if (maxDate !== undefined) {
      if (maxDateIsRef === true) rules.max = String(maxDate)
      else options.max = maxDate
    }
  }

  /** UI schema of the items of an array control (relative to the item schema) */
  private convertArrayItems(item: any, resolved: ResolvedKey, readonly: boolean): any | undefined {
    const itemsSchema = resolved.node.items
    const itemContext: KeyContext = { prefix: [...resolved.segments, '[]'], readonly }
    if (Array.isArray(item.items)) {
      const elements = this.convertItems(item.items, itemContext)
      // a single control of the item itself (`key[]`) needs no layout
      if (elements.length === 1 && elements[0].type === 'Control' && elements[0].scope === '#') return elements[0]
      return { type: 'VerticalLayout', elements }
    }
    if (!isObject(itemsSchema)) return undefined
    if (hasType(itemsSchema, 'object') && isObject(itemsSchema.properties) && typeof itemsSchema.format !== 'string') {
      const elements = Object.keys(itemsSchema.properties).flatMap((name) =>
        this.convertItem({ key: `${resolved.key}[].${name}` }, itemContext),
      )
      return { type: 'VerticalLayout', elements }
    }
    // the item itself is the control: it carries the converter-level control options too
    const element: any = { type: 'Control', scope: '#', label: false }
    const options: Record<string, any> = {}
    if (readonly) options.readonly = true
    if (this.options.languages && LOCALIZED_FORMATS.includes(itemsSchema.format)) options.languages = this.options.languages
    if (Object.keys(options).length > 0) element.options = options
    return element
  }
}

/** true when the array schema is rendered by a widget (files, countries...) rather than as a list */
function isWidgetSchema(node: any, options: Record<string, any>): boolean {
  if (typeof node.format === 'string' || typeof options.format === 'string') return true
  return isObject(node.items) && (node.items.enum !== undefined || node.items.oneOf !== undefined)
}

/**
 * Converts an angular-schema-form `(schema, definition)` pair into a JSON
 * Forms `(schema, uischema)` pair. The returned schema is a copy of the input
 * with the `t()` tokens resolved and the definition-level information the
 * renderers read from the schema (`titleMap` as `oneOf`, `required`,
 * `title` / `description` overrides, `minItems` / `maxItems`).
 */
export function convert(schema: unknown, definition: unknown, options: AsfConvertOptions = {}): AsfConvertResult {
  const converter = new Converter(schema, options)
  const uischema = converter.convert(definition)
  return { schema: converter.schema, uischema, diagnostics: converter.diagnostics }
}

/** true for an ASF definition (an array), false for a JSON Forms UI schema (an object) */
export function isAsfDefinition(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Accepts either dialect: an ASF definition (array) is converted, a JSON Forms
 * UI schema (object) is returned as-is with the `t()` tokens of the schema and
 * of the UI schema resolved.
 */
export function toJsonForms(schema: unknown, definitionOrUischema: unknown, options: AsfConvertOptions = {}): AsfConvertResult {
  if (isAsfDefinition(definitionOrUischema)) {
    return convert(schema, definitionOrUischema, options)
  }
  const converter = new Converter(schema, options)
  const uischema = isObject(definitionOrUischema) ? converter.resolveTokens(JSON.parse(JSON.stringify(definitionOrUischema))) : { type: 'VerticalLayout', elements: [] }
  return { schema: converter.schema, uischema, diagnostics: converter.diagnostics }
}

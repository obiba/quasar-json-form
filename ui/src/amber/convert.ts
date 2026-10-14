/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Amber compatibility: converts the schema of an Amber form (a tree of
 * `items`, with its `i18n` translations) into a `(schema, uischema,
 * translations)` bundle for `QJsonForm`, collecting the same data: a group is
 * a nested object, a multiple choice an array, a map a GeoJSON `Feature`...
 *
 * The root UI schema is a `VerticalLayout` with one element per top-level
 * item, so that an application paging the form (Amber `layout: "multi"`)
 * renders `uischema.elements[page]`. Everything the converter cannot
 * translate is reported as a diagnostic and skipped. The form-level settings
 * of Amber (`label`, `idLabel`, `idMask`, `layout`, `license`...) are not
 * part of the conversion.
 */
// the rule engine of the library entry: the functions registered by the application are known
import { ruleEngine } from '../vue-plugin'

export interface AmberDiagnostic {
  level: 'warn' | 'info'
  message: string
  /** data path (`GROUP.ITEM`) of the item concerned, when any */
  key?: string
}

export interface AmberConvertOptions {
  /** receives the diagnostics (default: `console.warn` for warnings); `false` to silence */
  logger?: ((diagnostic: AmberDiagnostic) => void) | false
}

export interface AmberConvertResult {
  schema: Record<string, any>
  uischema: Record<string, any>
  translations: Record<string, Record<string, string>>
  diagnostics: AmberDiagnostic[]
}

const isObject = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** An Amber form schema: an `items` array, and none of the JSON Schema keywords of an object */
export function isAmberSchema(value: unknown): boolean {
  return isObject(value) && Array.isArray(value.items) && value.type === undefined && value.properties === undefined
}

const CHOICE_TYPES = ['radiogroup', 'checkboxgroup', 'select', 'autocomplete', 'image-select']

/**
 * Rewrites an Amber expression (JavaScript) into a rule: `$('A.B')` and
 * `formData.A.B` become `A.B`, `val` the path of the item itself,
 * `Date.parse()` / `Date.now()` the `parseDate()` / `now()` functions,
 * `list.includes(v)` and the `indexOf` tests `contains(list, v)`, `x.length`
 * `length(x)`; a single-expression arrow function `(data) => data.A` is
 * reduced to its body. Throws an Error when the result is not a valid rule.
 */
export function rewriteExpression(expression: string, self?: string): string {
  let rule = expression.trim()
  // (data) => data.A ...: the body, the parameter prefix removed
  const arrow = /^\(?\s*([A-Za-z_$][\w$]*)\s*\)?\s*=>\s*([^{][\s\S]*)$/.exec(rule)
  if (arrow) rule = arrow[2]!.replace(new RegExp(`(?<![\\w$.])${arrow[1]}\\.`, 'g'), '')
  rule = rule
    .replace(/\$\(\s*(['"])([\w.]+)\1\s*\)/g, '$2')
    .replace(/(?<![\w$.])formData\./g, '')
    .replace(/(?<![\w$.])Date\.parse\(/g, 'parseDate(')
    .replace(/(?<![\w$.])Date\.now\(\s*\)/g, 'now()')
  if (self) rule = rule.replace(/(?<![\w$.'"])val(?![\w$'"])/g, self)
  const path = '([A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*)'
  rule = rule
    .replace(new RegExp(`${path}\\.indexOf\\(([^()]*)\\)\\s*(?:>=\\s*0|>\\s*-1|!==?\\s*-1)`, 'g'), 'contains($1, $2)')
    .replace(new RegExp(`${path}\\.indexOf\\(([^()]*)\\)\\s*(?:<\\s*0|===?\\s*-1)`, 'g'), '!contains($1, $2)')
    .replace(new RegExp(`${path}\\.includes\\(([^()]*)\\)`, 'g'), 'contains($1, $2)')
    .replace(new RegExp(`${path}\\.length(?![\\w$])`, 'g'), 'length($1)')
  const error = ruleEngine.expressionError(rule)
  if (error) throw new Error(`${error}: ${expression}`)
  return rule
}

/** `"['1', '2']"`, `"1"` or an array: the values of a multiple choice default */
function toArray(value: unknown): unknown[] | undefined {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const text = value.trim()
  if (!(text.startsWith('[') && text.endsWith(']'))) return [text]
  return text.slice(1, -1).split(',').map((v) => v.trim()).filter((v) => v.length > 0)
    .map((v) => ((v.startsWith('\'') && v.endsWith('\'')) || (v.startsWith('"') && v.endsWith('"')) ? v.slice(1, -1) : v))
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return isFinite(value) ? value : undefined
  if (typeof value !== 'string' || value.trim() === '') return undefined
  const number = Number.parseFloat(value)
  return isFinite(number) ? number : undefined
}

/** `"0,0 150,0 150,750, 0,750"` → `[0, 0, 150, 0, 150, 750, 0, 750]` */
function toCoords(points: unknown): number[] | undefined {
  if (typeof points !== 'string') return undefined
  const coords = points.split(/[\s,]+/).filter((v) => v.length > 0).map(Number)
  return coords.length >= 6 && coords.length % 2 === 0 && coords.every((v) => isFinite(v)) ? coords : undefined
}

/** The JSON Schema `type` of option values, when they share one */
function valuesType(values: unknown[]): string | undefined {
  const types = new Set<string>(values.map((v) => typeof v))
  return types.size === 1 ? ['string', 'number', 'boolean'].find((t) => types.has(t)) : undefined
}

class Converter {
  diagnostics: AmberDiagnostic[] = []

  constructor(private options: AmberConvertOptions) {}

  report(level: AmberDiagnostic['level'], message: string, key?: string) {
    const diagnostic: AmberDiagnostic = { level, message, key }
    this.diagnostics.push(diagnostic)
    const logger = this.options.logger
    if (logger === false) return
    if (logger) logger(diagnostic)
    else if (level === 'warn') console.warn(`[amber] ${key ? key + ': ' : ''}${message}`)
  }

  /** a rule from an Amber expression, undefined (and reported) when it cannot be converted */
  rule(expression: unknown, name: string, key: string, self?: string): string | undefined {
    if (typeof expression !== 'string' || expression.trim() === '') return undefined
    try {
      return rewriteExpression(expression, self)
    } catch (error) {
      this.report('warn', `${name} not converted, ${(error as Error).message}`, key)
      return undefined
    }
  }

  /**
   * Converts the items of a group (or of the form) into the properties of
   * `container` and returns their UI schema elements.
   */
  items(items: any[], container: any, prefix: string, scope: string): any[] {
    const elements: any[] = []
    items.forEach((item, index) => {
      if (!isObject(item)) return
      const name = typeof item.name === 'string' ? item.name : undefined
      const key = name ? prefix + name : `${prefix}#${index}`
      if (!name || !/^[\w-]+$/.test(name)) {
        this.report('warn', `item without a valid name skipped`, key)
        return
      }
      if (item.type !== 'section' && container.properties[name]) {
        this.report('warn', `duplicate name, item skipped`, key)
        return
      }
      const element = this.item(item, container, key, `${scope}/properties/${name}`)
      if (element) elements.push(element)
    })
    return elements
  }

  item(item: any, container: any, key: string, scope: string): any | undefined {
    const name: string = item.name
    const rules: Record<string, any> = {}
    const visible = this.rule(item.condition, 'condition', key)
    if (visible) rules.visible = visible

    if (item.type === 'section') {
      const element: any = { type: 'Section' }
      if (item.label) element.label = item.label
      if (item.description) element.description = item.description
      if (item.labelClass) element.labelClass = item.labelClass
      if (item.descriptionClass) element.descriptionClass = item.descriptionClass
      if (visible) element.rules = rules
      return element
    }

    if (item.type === 'group') {
      const property: any = { type: 'object', properties: {} }
      const children = this.items(Array.isArray(item.items) ? item.items : [], property, key + '.', scope)
      if (Array.isArray(property.required) && property.required.length === 0) delete property.required
      container.properties[name] = property
      const element: any = item.label || item.description ? { type: 'Group' } : { type: 'VerticalLayout' }
      if (item.label) element.label = item.label
      if (item.description) element.description = item.description
      if (item.labelClass) element.titleClass = item.labelClass
      if (item.descriptionClass) element.descriptionClass = item.descriptionClass
      element.elements = children
      if (visible) element.rules = rules
      return element
    }

    const control = this.control(item, key)
    if (!control) {
      this.report('warn', `item type "${item.type}" not supported, item skipped`, key)
      return undefined
    }
    const { property, options } = control
    if (item.label) property.title = item.label
    if (item.description) property.description = item.description

    // a required item of a group is a rule: AJV does not validate the
    // properties of a group object that does not exist yet (nothing answered)
    if ((item.required === true || item.required === 'true') && !key.includes('.')) {
      container.required = [...(container.required ?? []), name]
    } else if (item.required === true || item.required === 'true') {
      rules.required = 'true'
    } else if (item.required) {
      const required = this.rule(item.required, 'required', key, key)
      if (required) rules.required = required
    }
    const disabled = this.rule(item.disabled, 'disabled', key, key)
    if (disabled) rules.enabled = `!(${disabled})`
    if (item.validation) {
      const expr = this.rule(item.validation, 'validation', key, key)
      if (expr) rules.validation = [{ expr, message: item.validationMessage || 'error.default' }]
    }

    container.properties[name] = property
    const element: any = { type: 'Control', scope }
    if (item.hint) element.hint = item.hint
    if (item.labelClass) element.titleClass = item.labelClass
    if (item.descriptionClass) element.descriptionClass = item.descriptionClass
    if (item.placeholder) options.placeholder = item.placeholder
    if (Object.keys(options).length > 0) element.options = options
    if (Object.keys(rules).length > 0) element.rules = rules
    return element
  }

  /** the schema property and the control options of an item holding a value */
  control(item: any, key: string): { property: any; options: Record<string, any> } | undefined {
    const options: Record<string, any> = {}
    const multiple = item.multiple === true || item.multiple === 'true'
    let property: any

    if (CHOICE_TYPES.includes(item.type)) {
      const entries = (Array.isArray(item.options) ? item.options : []).filter((o: any) => isObject(o) && o.value !== undefined)
      if (entries.length === 0) this.report('warn', 'choice without options', key)
      const values = entries.map((o: any) => o.value)
      const oneOf = entries.map((o: any) => ({ const: o.value, title: o.label ?? String(o.value) }))
      const many = item.type === 'checkboxgroup' || multiple
      const type = valuesType(values)

      if (item.type === 'autocomplete') {
        options.format = 'typeahead'
        options.values = entries.map((o: any) => ({ value: o.value, label: o.label ?? String(o.value) }))
        if (item.newValue === true || item.newValue === 'true') options.editable = true
        property = many ? { type: 'array', uniqueItems: true, items: { type: 'string' } } : { type: 'string' }
      } else {
        const choice: any = type ? { type, oneOf } : { oneOf }
        property = many ? { type: 'array', uniqueItems: true, items: choice } : choice
        if (item.type === 'radiogroup') options.format = 'radio'
        if (item.type === 'checkboxgroup') options.format = 'checkbox'
      }
      if (item.type === 'image-select') {
        options.format = 'image-map'
        if (item.imageSrc) options.image = item.imageSrc
        const areas: Record<string, any> = {}
        ;(Array.isArray(item.areas) ? item.areas : []).forEach((area: any) => {
          const coords = toCoords(area?.points)
          if (area?.value !== undefined && coords) areas[String(area.value)] = { shape: 'poly', coords }
          else this.report('warn', `image area ${JSON.stringify(area?.value)} without valid points skipped`, key)
        })
        options.areas = areas
        if (item.showSelect === false || item.showSelect === 'false') options.select = false
      }
      const defaults = many ? toArray(item.default) : (item.default !== undefined && item.default !== '' ? item.default : undefined)
      if (defaults !== undefined) property.default = defaults
      return { property, options }
    }

    switch (item.type) {
      case 'text':
        property = { type: 'string' }
        if (item.mask) options.mask = item.mask
        break
      case 'textarea':
        property = { type: 'string' }
        options.rows = 3
        break
      case 'number':
        property = { type: 'number' }
        break
      case 'slider':
        // the bounds on the schema: validated, and read by the renderer
        property = { type: 'integer', minimum: toNumber(item.min) ?? 0, maximum: toNumber(item.max) ?? 100 }
        options.format = 'slider'
        options.labelAlways = true
        break
      case 'rating':
        property = { type: 'integer', minimum: 0, maximum: toNumber(item.max) ?? 5 }
        options.format = 'rating'
        options.icon = item.icon || 'star'
        options.color = item.color || 'primary'
        options.size = item.size || '2em'
        break
      case 'toggle':
        property = { type: 'boolean' }
        if (item.default !== undefined && item.default !== '') property.default = item.default === true || item.default === 'true'
        return { property, options }
      case 'date':
        property = { type: 'string', format: 'date' }
        break
      case 'datetime':
        property = { type: 'string', format: 'date-time' }
        break
      case 'time':
        property = { type: 'string', format: 'time' }
        break
      case 'computed': {
        // displayed by nothing, as in Amber (the title stays in the schema)
        property = { format: 'computed' }
        options.hidden = true
        const compute = this.rule(item.compute, 'compute', key)
        if (compute) property.rules = { compute }
        return { property, options }
      }
      case 'map':
        return this.map(item, key, multiple)
      default:
        return undefined
    }

    if (['number', 'slider', 'rating'].includes(item.type)) {
      const value = toNumber(item.default)
      if (value !== undefined) property.default = value
    } else if (item.default !== undefined && item.default !== '') {
      property.default = item.default
    }
    return { property, options }
  }

  map(item: any, key: string, multiple: boolean): { property: any; options: Record<string, any> } {
    const geo: Record<string, any> = { feature: true }
    const geometry = typeof item.geometryType === 'string' ? item.geometryType.toLowerCase() : 'point'
    geo.geometries = [geometry]
    const height = toNumber(item.mapHeight)
    if (height !== undefined) geo.height = height
    if (Array.isArray(item.center)) geo.center = item.center
    const zoom = toNumber(item.zoom)
    if (zoom !== undefined) geo.zoom = zoom
    if (item.geoLocation === false || item.geoLocation === 'false') geo.locate = false

    let defaults = item.defaultValue
    if (typeof defaults === 'string') {
      try {
        defaults = defaults.trim() ? JSON.parse(defaults) : undefined
      } catch {
        this.report('warn', 'default map value is not valid JSON, ignored', key)
        defaults = undefined
      }
    }
    if (!multiple) {
      const property: any = { type: 'object', format: 'geo' }
      if (defaults !== undefined) property.default = defaults
      return { property, options: geo }
    }
    const property: any = { type: 'array', items: { type: 'object', format: 'geo' } }
    if (defaults !== undefined) property.default = defaults
    return { property, options: { items: { type: 'Control', scope: '#', label: false, options: geo } } }
  }
}

/**
 * Converts an Amber form schema. The `i18n` translations are copied as they
 * are: Amber texts are keys (or literals) looked up in them, as the
 * `translations` of `QJsonForm` are.
 */
export function convert(amberSchema: unknown, options: AmberConvertOptions = {}): AmberConvertResult {
  const converter = new Converter(options)
  const schema: any = { type: 'object', properties: {} }
  const source = isObject(amberSchema) ? amberSchema : {}
  if (!isAmberSchema(source)) converter.report('warn', 'not an Amber form schema (no items)')
  const elements = converter.items(Array.isArray(source.items) ? source.items : [], schema, '', '#')
  if (Array.isArray(schema.required) && schema.required.length === 0) delete schema.required
  const translations: Record<string, Record<string, string>> = {}
  if (isObject(source.i18n)) {
    Object.entries(source.i18n).forEach(([locale, messages]) => {
      if (isObject(messages)) translations[locale] = { ...messages }
    })
  }
  return { schema, uischema: { type: 'VerticalLayout', elements }, translations, diagnostics: converter.diagnostics }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * What the builder knows about the renderers: the palette (the catalog items,
 * plus the ones of the application), which item a node was made from, the
 * options a renderer understands as a form, and the expression checks.
 */
import { catalog, catalogItems, rendererOptions } from '../catalog'
import type { ApiEntry, CatalogItem, RendererApi } from '../catalog'
import { filtrexEngine } from '../vue-plugin'
import type { FormNode, JsonObject } from './model'

export interface BuilderCatalog {
  /** the palette items, built-in then application ones */
  items: CatalogItem[]
  /** the renderers, by name */
  renderers: Record<string, RendererApi>
}

/** The built-in catalog extended with the renderers of the application. */
export function builderCatalog(extra: RendererApi[] = []): BuilderCatalog {
  const renderers: Record<string, RendererApi> = { ...catalog }
  const items = [...catalogItems]
  for (const api of extra) {
    renderers[api.name] = api
    for (const item of api.items ?? []) items.push({ ...item, renderer: api.name })
  }
  return { items, renderers }
}

const isObject = (value: unknown): value is JsonObject => typeof value === 'object' && value !== null && !Array.isArray(value)

const optionFormat = (element: JsonObject): unknown => (isObject(element.options) ? element.options.format : undefined)

/**
 * The palette item a node was most likely made from: for a control, the item
 * whose schema type matches, preferring the same schema `format`, the same
 * `options.format` and the same choice shape (`oneOf` / `enum`, `items`);
 * for a layout or an element, the item of the same UI schema type.
 */
export function matchItem(node: FormNode, schema: JsonObject | undefined, items: CatalogItem[]): CatalogItem | undefined {
  if (node.kind !== 'control') {
    return items.find((item) => !item.schema && item.uischema.type === node.element.type)
  }
  if (!schema) return undefined
  const hasChoices = (s: unknown) => isObject(s) && (Array.isArray(s.oneOf) || Array.isArray(s.enum))
  let best: CatalogItem | undefined
  let bestScore = -1
  for (const item of items) {
    if (!item.schema || item.schema.type !== schema.type) continue
    let score = 0
    if (item.schema.format === schema.format) score += 4
    else if (item.schema.format !== undefined || schema.format !== undefined) score -= 2
    if (optionFormat(item.uischema) === optionFormat(node.element)) score += 3
    else if (optionFormat(item.uischema) !== undefined) score -= 3
    const itemChoices = hasChoices(item.schema) || hasChoices(item.schema.items)
    const nodeChoices = hasChoices(schema) || hasChoices(schema.items)
    if (itemChoices === nodeChoices) score += 2
    if (isObject(item.schema.items) && isObject(schema.items) && item.schema.items.type === schema.items.type) score += 1
    if (score > bestScore) {
      best = item
      bestScore = score
    }
  }
  return best
}

/** The icon of a node: the one of its item, else one for its kind. */
export function nodeIcon(node: FormNode, item: CatalogItem | undefined, isDetail = false): string {
  if (isDetail) return 'list'
  if (item) return item.icon
  return node.kind === 'layout' ? 'view_agenda' : node.kind === 'element' ? 'label' : 'input'
}

/** The default property key of a new control made from an item (`image-map` gives `imageMap`). */
export function itemKey(item: CatalogItem): string {
  return item.name.replace(/-(\w)/g, (_m, c: string) => c.toUpperCase())
}

const OPTION_TYPES: Record<string, JsonObject> = {
  String: { type: 'string' },
  Number: { type: 'number' },
  Boolean: { type: 'boolean' },
  'String | Number': { type: 'string' },
  'Number | String': { type: 'string' },
}

/** options managed by the builder itself, or not editable as a field */
const MANAGED_OPTIONS = new Set(['format', 'validationMessage', 'languages', 'items', 'detail'])

/**
 * The JSON schema of the options of a renderer that can be edited as fields
 * (strings, numbers and booleans), for the settings form of the builder;
 * undefined when there is none.
 */
export function optionsSchema(api: RendererApi | undefined): JsonObject | undefined {
  if (!api) return undefined
  const properties: JsonObject = {}
  for (const [name, entry] of Object.entries(rendererOptions(api))) {
    if (MANAGED_OPTIONS.has(name)) continue
    const type = OPTION_TYPES[entry.type ?? '']
    if (!type) continue
    properties[name] = { ...type, title: name, description: entry.desc }
  }
  return Object.keys(properties).length > 0 ? { type: 'object', properties } : undefined
}

/** The options of a renderer that the settings form does not edit (arrays, objects...). */
export function rawOptions(api: RendererApi | undefined): Record<string, ApiEntry> {
  if (!api) return {}
  return Object.fromEntries(Object.entries(rendererOptions(api)).filter(([name, entry]) => !MANAGED_OPTIONS.has(name) && !OPTION_TYPES[entry.type ?? ''] && name !== '…'))
}

/** The validation keywords of a property, by schema type, as a JSON schema for the builder form. */
export function keywordsSchema(schema: JsonObject | undefined): JsonObject | undefined {
  const type = schema?.type
  const properties: JsonObject = {}
  if (type === 'string') {
    properties.minLength = { type: 'integer', title: 'minLength', minimum: 0 }
    properties.maxLength = { type: 'integer', title: 'maxLength', minimum: 0 }
    properties.pattern = { type: 'string', title: 'pattern' }
    properties.format = { type: 'string', title: 'format' }
  } else if (type === 'number' || type === 'integer') {
    properties.minimum = { type: 'number', title: 'minimum' }
    properties.maximum = { type: 'number', title: 'maximum' }
    properties.exclusiveMinimum = { type: 'number', title: 'exclusiveMinimum' }
    properties.exclusiveMaximum = { type: 'number', title: 'exclusiveMaximum' }
    properties.multipleOf = { type: 'number', title: 'multipleOf', exclusiveMinimum: 0 }
  } else if (type === 'array') {
    properties.minItems = { type: 'integer', title: 'minItems', minimum: 0 }
    properties.maxItems = { type: 'integer', title: 'maxItems', minimum: 0 }
    properties.uniqueItems = { type: 'boolean', title: 'uniqueItems' }
  } else if (type === 'object') {
    properties.format = { type: 'string', title: 'format' }
  }
  return Object.keys(properties).length > 0 ? { type: 'object', properties } : undefined
}

/** The choices of a control: the `oneOf` entries of its schema or of its items, or its `enum` values as entries. */
export function choicesOf(schema: JsonObject | undefined): { entries: JsonObject[]; target: JsonObject; key: 'oneOf' | 'enum' } | undefined {
  if (!schema) return undefined
  const targets = [schema, isObject(schema.items) ? schema.items : undefined]
  for (const target of targets) {
    if (!target) continue
    if (Array.isArray(target.oneOf)) return { entries: target.oneOf.filter(isObject), target, key: 'oneOf' }
    if (Array.isArray(target.enum)) return { entries: target.enum.map((value: unknown) => ({ const: value, title: String(value) })), target, key: 'enum' }
  }
  return undefined
}

/** The error of a filtrex expression, or undefined when it compiles (an empty expression is fine). */
export function expressionError(expression: string | undefined): string | undefined {
  return expression ? filtrexEngine.expressionError(expression) : undefined
}

/** The names the rules of a level can use: the properties of its container object. */
export function fieldNames(container: JsonObject | undefined): string[] {
  return container && isObject(container.properties) ? Object.keys(container.properties) : []
}

/**
 * The `moveNode` index of a drop: sortablejs gives the final index of the
 * element in the target list, `moveNode` expects the index before the element
 * leaves its list (an element moved down its own list is inserted one further).
 */
export function dropIndex(sameList: boolean, oldIndex: number, newIndex: number): number {
  return sameList && newIndex > oldIndex ? newIndex + 1 : newIndex
}

/** Downloads a text as a file (no-op outside a browser). */
export function downloadText(name: string, text: string, type = 'application/json'): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return
  const url = URL.createObjectURL(new Blob([text], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

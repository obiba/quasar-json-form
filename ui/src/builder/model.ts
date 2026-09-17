/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The form model of the builder: a tree of nodes mirroring the UI schema,
 * bound to the JSON schema of the data and to the translations of the form.
 *
 * A node is a `control` (an element with a `scope`, bound to a property of
 * its container object schema), a `layout` (an element with `elements`), or
 * a plain `element` (a label, a section...). A list of objects carries the
 * layout of its items (`options.items`) as its `detail` node, whose controls
 * are bound to the properties of the `items` schema of the list.
 *
 * Everything the model does not understand is kept as-is on the element or
 * in the schema, so that a form edited by the builder round-trips.
 */
import type { FormTranslations } from '../utils/i18n'
import { toJsonForms } from '../asf'
import type { AsfConvertOptions, AsfDiagnostic } from '../asf'

export type JsonObject = Record<string, any>

/** A form: the JSON schema of its data, its UI schema and its translations. */
export interface FormDefinition {
  schema: JsonObject
  /** when omitted or empty, a vertical layout with one control per property */
  uischema?: JsonObject
  /** messages keyed by language, flat dotted keys or nested objects */
  translations?: FormTranslations
}

export type NodeKind = 'control' | 'layout' | 'element'

export interface FormNode {
  /** unique in the model, not persisted */
  id: string
  kind: NodeKind
  /** the UI schema element, without its `scope`, its `elements` and its `options.items` layout */
  element: JsonObject
  /** the elements of a layout */
  children: FormNode[]
  /**
   * control: the property path in the container object schema, one segment
   * per `properties` level of the scope (`['address', 'street']` for
   * `#/properties/address/properties/street`); undefined when the scope is
   * not of that form (kept on the element)
   */
  path?: string[]
  /** control: the layout of the items of a list of objects (`options.items`) */
  detail?: FormNode
}

export interface ModelDiagnostic {
  level: 'warn' | 'info'
  message: string
  nodeId?: string
}

export interface FormModel {
  schema: JsonObject
  root: FormNode
  /** flat dotted keys, one map per language */
  translations: Record<string, Record<string, string>>
  /** what the import could not fully model */
  diagnostics: ModelDiagnostic[]
  /** counter of the node ids */
  nextId: number
}

/** The position of a node in the tree. */
export interface NodeLocation {
  node: FormNode
  /** the layout holding the node, or the list control holding it as `detail`; undefined for the root */
  parent?: FormNode
  /** index in `parent.children`, -1 for a `detail` */
  index: number
  /** the list control whose items the node belongs to, undefined at the root level */
  list?: FormNode
}

/** A palette item, or any pair of fragments: what a new node is made of. */
export interface NodeTemplate {
  /** the schema of the property of a new control */
  schema?: JsonObject
  /** the UI schema element */
  uischema: JsonObject
}

const clone = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)))
const isObject = (value: unknown): value is JsonObject => typeof value === 'object' && value !== null && !Array.isArray(value)

/** true when the object has the key itself (`in` would find `constructor`, `toString`... on the prototype) */
export const hasOwn = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key)

/** `#/properties/a/properties/b` to `['a', 'b']`; undefined for any other scope */
export function parseScope(scope: unknown): string[] | undefined {
  if (typeof scope !== 'string' || !scope.startsWith('#/')) return undefined
  const segments = scope.slice(2).split('/')
  const path: string[] = []
  for (let i = 0; i < segments.length; i += 2) {
    if (segments[i] !== 'properties' || segments[i + 1] === undefined) return undefined
    path.push(decodeURIComponent(segments[i + 1]!.replace(/~1/g, '/').replace(/~0/g, '~')))
  }
  return path.length > 0 ? path : undefined
}

/** `['a', 'b']` to `#/properties/a/properties/b` */
export function toScope(path: string[]): string {
  return '#' + path.map((segment) => '/properties/' + encodeURIComponent(segment.replace(/~/g, '~0').replace(/\//g, '~1'))).join('')
}

/** A property key usable in scopes, filtrex rules and translation keys. */
export function isValidKey(key: unknown): key is string {
  return typeof key === 'string' && /^[A-Za-z_$][\w$]*$/.test(key)
}

// ---------------------------------------------------------------------------
// Definition <-> model

function flattenMessages(messages: JsonObject, prefix = '', into: Record<string, string> = {}): Record<string, string> {
  for (const [key, value] of Object.entries(messages)) {
    const full = prefix ? `${prefix}.${key}` : key
    if (isObject(value)) flattenMessages(value, full, into)
    else if (typeof value === 'string') into[full] = value
  }
  return into
}

function defaultUischema(schema: JsonObject): JsonObject {
  const properties = isObject(schema.properties) ? Object.keys(schema.properties) : []
  return { type: 'VerticalLayout', elements: properties.map((key) => ({ type: 'Control', scope: toScope([key]) })) }
}

/** The node of a UI schema element (and of its elements), ids assigned; internal */
export function toNode(model: FormModel, element: JsonObject): FormNode {
  const id = `n${++model.nextId}`
  const isControl = element.type === 'Control' || typeof element.scope === 'string'
  if (isControl) {
    const { scope, ...rest } = element
    const path = parseScope(scope)
    const node: FormNode = { id, kind: 'control', element: rest, children: [] }
    if (path) node.path = path
    else {
      node.element.scope = scope
      model.diagnostics.push({ level: 'warn', message: `Scope "${scope}" is not a property path: the control is kept as-is`, nodeId: id })
    }
    const items = isObject(rest.options) ? rest.options.items : undefined
    if (isObject(items) && typeof items.type === 'string') {
      node.element.options = { ...rest.options }
      delete node.element.options.items
      node.detail = toNode(model, items)
    }
    return node
  }
  if (Array.isArray(element.elements)) {
    const { elements, ...rest } = element
    const node: FormNode = { id, kind: 'layout', element: rest, children: [] }
    node.children = elements.filter(isObject).map((child: JsonObject) => toNode(model, child))
    if (node.children.length !== elements.length) {
      model.diagnostics.push({ level: 'warn', message: `${elements.length - node.children.length} element(s) of the ${rest.type} layout are not objects and were dropped`, nodeId: id })
    }
    return node
  }
  return { id, kind: 'element', element, children: [] }
}

function fromNode(node: FormNode): JsonObject {
  if (node.kind === 'control') {
    const { type, ...rest } = node.element
    const element: JsonObject = { type: type ?? 'Control' }
    if (node.path) element.scope = toScope(node.path)
    Object.assign(element, rest)
    if (node.detail) element.options = { ...(isObject(rest.options) ? rest.options : {}), items: fromNode(node.detail) }
    return element
  }
  if (node.kind === 'layout') {
    return { ...node.element, elements: node.children.map(fromNode) }
  }
  return { ...node.element }
}

/**
 * Builds the model of a form. The schema, UI schema and translations are
 * copied; a missing or empty UI schema is generated from the schema
 * properties, and a UI schema whose root is not a layout is wrapped in a
 * vertical layout. Nested translation objects are flattened to dotted keys.
 */
export function fromDefinition(definition: FormDefinition): FormModel {
  const model: FormModel = { schema: clone(definition.schema ?? {}), root: undefined as unknown as FormNode, translations: {}, diagnostics: [], nextId: 0 }
  if (!isObject(model.schema)) model.schema = {}
  const uischema = isObject(definition.uischema) && Object.keys(definition.uischema).length > 0 ? clone(definition.uischema) : defaultUischema(model.schema)
  const root = toNode(model, uischema)
  if (root.kind === 'layout') model.root = root
  else {
    model.root = { id: `n${++model.nextId}`, kind: 'layout', element: { type: 'VerticalLayout' }, children: [root] }
    model.diagnostics.push({ level: 'info', message: `The root of the UI schema is a ${root.element.type ?? 'control'}: wrapped in a vertical layout` })
  }
  for (const [locale, messages] of Object.entries(definition.translations ?? {})) {
    if (isObject(messages)) model.translations[locale] = flattenMessages(messages)
  }
  // controls whose property does not exist
  for (const location of locations(model)) {
    const { node, list } = location
    if (node.kind === 'control' && node.path && propertyIn(containerOf(model, list), node.path) === undefined) {
      model.diagnostics.push({ level: 'warn', message: `Property "${node.path.join('.')}" is not in the schema`, nodeId: node.id })
    }
  }
  return model
}

/** The form of a model: its schema, UI schema and translations, as new objects. */
export function toDefinition(model: FormModel): Required<FormDefinition> {
  return { schema: clone(model.schema), uischema: fromNode(model.root), translations: clone(model.translations) }
}

/** The model of an angular-schema-form `(schema, definition)` pair, or of a JSON Forms pair. */
export function fromAsf(schema: unknown, definitionOrUischema: unknown, options: AsfConvertOptions = {}): FormModel {
  // the converter diagnostics are reported by the model (no console logging unless asked)
  const result = toJsonForms(schema, definitionOrUischema, { logger: false, ...options })
  const model = fromDefinition({ schema: result.schema, uischema: result.uischema })
  model.diagnostics.unshift(...result.diagnostics.map((d: AsfDiagnostic) => ({ level: d.level, message: d.key ? `${d.key}: ${d.message}` : d.message })))
  return model
}

// ---------------------------------------------------------------------------
// Tree navigation

/** Every node of the tree, depth first, with its location. */
export function locations(model: FormModel): NodeLocation[] {
  const result: NodeLocation[] = []
  const visit = (node: FormNode, parent: FormNode | undefined, index: number, list: FormNode | undefined) => {
    result.push({ node, parent, index, list })
    node.children.forEach((child, i) => visit(child, node, i, list))
    if (node.detail) visit(node.detail, node, -1, node)
  }
  visit(model.root, undefined, -1, undefined)
  return result
}

/** The node of the given id, with its location, or undefined. */
export function locate(model: FormModel, id: string): NodeLocation | undefined {
  return locations(model).find((location) => location.node.id === id)
}

export function findNode(model: FormModel, id: string): FormNode | undefined {
  return locate(model, id)?.node
}

/** The nodes of the subtree of a node (itself included), detail layouts included. */
export function descendants(node: FormNode): FormNode[] {
  const result: FormNode[] = [node]
  node.children.forEach((child) => result.push(...descendants(child)))
  if (node.detail) result.push(...descendants(node.detail))
  return result
}

/** The list control whose items a node belongs to, or undefined at the root level. */
export function listOf(model: FormModel, id: string): FormNode | undefined {
  return locate(model, id)?.list
}

/**
 * The object schema holding the properties of the controls of a level: the
 * root schema, or the `items` schema of a list (created when missing).
 */
export function containerOf(model: FormModel, list: FormNode | undefined): JsonObject {
  if (!list) return model.schema
  const listSchema = list.path ? propertyIn(containerOf(model, listOf(model, list.id)), list.path) : undefined
  if (!listSchema) return {}
  if (!isObject(listSchema.items)) listSchema.items = { type: 'object', properties: {} }
  return listSchema.items
}

/** The schema of a property path in an object schema, or undefined. */
export function propertyIn(container: JsonObject | undefined, path: string[]): JsonObject | undefined {
  let schema: JsonObject | undefined = container
  for (const key of path) {
    const properties = schema && isObject(schema.properties) ? schema.properties : undefined
    schema = properties && isObject(properties[key]) ? properties[key] : undefined
    if (!schema) return undefined
  }
  return schema
}

/** The object schema holding the last segment of a property path, or undefined. */
export function parentSchemaIn(container: JsonObject | undefined, path: string[]): JsonObject | undefined {
  return path.length === 1 ? container : propertyIn(container, path.slice(0, -1))
}

/** The schema of the property of a control, or undefined (not a control, or not in the schema). */
export function propertySchema(model: FormModel, id: string): JsonObject | undefined {
  const location = locate(model, id)
  if (!location || !location.node.path) return undefined
  return propertyIn(containerOf(model, location.list), location.node.path)
}

/** Whether the property of a control is required in its object schema. */
export function isRequired(model: FormModel, id: string): boolean {
  const location = locate(model, id)
  if (!location || !location.node.path) return false
  const parent = parentSchemaIn(containerOf(model, location.list), location.node.path)
  return Array.isArray(parent?.required) && parent!.required.includes(location.node.path[location.node.path.length - 1])
}

export function setRequired(model: FormModel, id: string, required: boolean): void {
  const location = locate(model, id)
  if (!location || !location.node.path) return
  const parent = parentSchemaIn(containerOf(model, location.list), location.node.path)
  if (!parent) return
  const key = location.node.path[location.node.path.length - 1]!
  const current: string[] = Array.isArray(parent.required) ? parent.required : []
  const next = required ? (current.includes(key) ? current : [...current, key]) : current.filter((k) => k !== key)
  if (next.length > 0) parent.required = next
  else delete parent.required
}

// ---------------------------------------------------------------------------
// Keys

/** A key not used by the properties of an object schema: `base`, `base2`, `base3`... */
export function uniqueKey(container: JsonObject | undefined, base: string): string {
  const properties = container && isObject(container.properties) ? container.properties : {}
  const stem = isValidKey(base) ? base : 'field'
  if (!hasOwn(properties, stem)) return stem
  let n = 2
  while (hasOwn(properties, `${stem}${n}`)) n++
  return `${stem}${n}`
}

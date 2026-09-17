/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The operations of the builder on a form model: add, remove, move,
 * duplicate and rename nodes, keeping the schema and the translations in
 * step with the tree.
 */
import type { FormModel, FormNode, JsonObject, NodeLocation, NodeTemplate } from './model'
import { locate, locations, descendants, containerOf, parentSchemaIn, propertyIn, uniqueKey, isValidKey, toNode } from './model'
import { keyPrefix, retargetKeys } from './texts'

const clone = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)))
const isObject = (value: unknown): value is JsonObject => typeof value === 'object' && value !== null && !Array.isArray(value)

function insertChild(parent: FormNode, node: FormNode, index?: number): void {
  const at = index === undefined || index < 0 || index > parent.children.length ? parent.children.length : index
  parent.children.splice(at, 0, node)
}

/**
 * Adds a node made from a template under a layout, at the given index (the
 * end by default). A control template (with a `schema`) creates the property
 * under `key` (made unique, `field` by default) in the container of the
 * layout. Returns the new node, or undefined when the parent is not a layout.
 */
export function addNode(model: FormModel, parentId: string, template: NodeTemplate, index?: number, key?: string): FormNode | undefined {
  const location = locate(model, parentId)
  if (!location || location.node.kind !== 'layout') return undefined
  const node = toNode(model, clone(template.uischema))
  if (template.schema) {
    const container = containerOf(model, location.list)
    const name = uniqueKey(container, key ?? 'field')
    if (!isObject(container.properties)) container.properties = {}
    container.properties[name] = clone(template.schema)
    node.kind = 'control'
    node.path = [name]
    delete node.element.scope
    if (node.element.type === undefined) node.element.type = 'Control'
  }
  insertChild(location.node, node, index)
  return node
}

function detach(model: FormModel, id: string): NodeLocation | undefined {
  const location = locate(model, id)
  if (!location || !location.parent) return undefined
  if (location.index >= 0) location.parent.children.splice(location.index, 1)
  else delete location.parent.detail
  return location
}

/** true when a control outside the subtree, at the same level, is bound to the path, a parent of it or a nested property */
function isReferenced(model: FormModel, subtree: FormNode[], list: FormNode | undefined, path: string[]): boolean {
  const related = (other: string[]) => {
    const depth = Math.min(other.length, path.length)
    return other.slice(0, depth).every((segment, i) => segment === path[i])
  }
  return locations(model).some(({ node, list: nodeList }) =>
    node.kind === 'control' && !!node.path && nodeList === list && !subtree.includes(node) && related(node.path))
}

/**
 * Removes a node (and its subtree). The property of a removed control is
 * removed from the schema unless another control still uses it (bound to it,
 * to its object, or to one of its properties). Returns the removed node, or
 * undefined (not found, or the root).
 */
export function removeNode(model: FormModel, id: string): FormNode | undefined {
  const location = locate(model, id)
  if (!location || !location.parent) return undefined
  const subtree = descendants(location.node)
  // resolved while the subtree is still attached
  const removals: { parent: JsonObject; key: string }[] = []
  for (const { node, list } of locations(model)) {
    if (!subtree.includes(node) || node.kind !== 'control' || !node.path) continue
    if (isReferenced(model, subtree, list, node.path)) continue
    const parent = parentSchemaIn(containerOf(model, list), node.path)
    if (parent) removals.push({ parent, key: node.path[node.path.length - 1]! })
  }
  detach(model, id)
  for (const { parent, key } of removals) {
    if (isObject(parent.properties)) delete parent.properties[key]
    if (Array.isArray(parent.required)) {
      parent.required = parent.required.filter((k: string) => k !== key)
      if (parent.required.length === 0) delete parent.required
    }
  }
  return location.node
}

/**
 * Whether a node can move under a layout: not the root, not into its own
 * subtree, and a control stays at its level (the items of a list, or the
 * root level).
 */
export function canMove(model: FormModel, id: string, parentId: string): boolean {
  const source = locate(model, id)
  const target = locate(model, parentId)
  if (!source || !target || !source.parent || target.node.kind !== 'layout') return false
  if (descendants(source.node).includes(target.node)) return false
  return source.list === target.list
}

/**
 * Moves a node under a layout, at the given index (the end by default). A
 * control stays at its level: it cannot move into or out of the items of a
 * list. Returns false when the move is not possible.
 */
export function moveNode(model: FormModel, id: string, parentId: string, index?: number): boolean {
  if (!canMove(model, id, parentId)) return false
  const source = locate(model, id)!
  const target = locate(model, parentId)!
  let at = index === undefined ? target.node.children.length : index
  if (source.parent === target.node && source.index >= 0 && source.index < at) at--
  detach(model, id)
  insertChild(target.node, source.node, at)
  return true
}

function renumber(model: FormModel, node: FormNode): void {
  node.id = `n${++model.nextId}`
  node.children.forEach((child) => renumber(model, child))
  if (node.detail) renumber(model, node.detail)
}

/**
 * Duplicates a node after itself. The property of a duplicated control (the
 * last segment of its path) is copied under a new key; the controls of its
 * subtree keep their paths (bound to the copied properties of a list, or to
 * the same properties otherwise), and its translations are copied under the
 * new key. Returns the copy, or undefined.
 */
export function duplicateNode(model: FormModel, id: string): FormNode | undefined {
  const location = locate(model, id)
  if (!location || !location.parent || location.index < 0) return undefined
  const copy = clone(location.node)
  renumber(model, copy)
  const container = containerOf(model, location.list)
  if (copy.kind === 'control' && copy.path) {
    const parent = parentSchemaIn(container, copy.path)
    const key = copy.path[copy.path.length - 1]!
    if (parent && isObject(parent.properties) && isObject(parent.properties[key])) {
      const name = uniqueKey(parent, key)
      parent.properties[name] = clone(parent.properties[key])
      if (Array.isArray(parent.required) && parent.required.includes(key)) parent.required.push(name)
      copy.path = [...copy.path.slice(0, -1), name]
    }
  }
  insertChild(location.parent, copy, location.index + 1)
  if (copy.kind === 'control' && copy.path) {
    retargetKeys(model, descendants(copy), keyPrefix(model, location.node), keyPrefix(model, copy), true)
  }
  return copy
}

/**
 * Renames the property of a control: the last segment of its path, in the
 * schema (properties and required, order kept), in the scopes of every
 * control of the level bound to it or to a nested property, and in the
 * translations (`name.*` becomes `fullName.*`). Returns false
 * when the key is invalid or taken, or the node is not a control.
 */
export function renameProperty(model: FormModel, id: string, key: string): boolean {
  const location = locate(model, id)
  if (!location || !location.node.path || !isValidKey(key)) return false
  const path = location.node.path
  const oldKey = path[path.length - 1]!
  if (key === oldKey) return true
  const parent = parentSchemaIn(containerOf(model, location.list), path)
  if (!parent || !isObject(parent.properties) || key in parent.properties) return false
  parent.properties = Object.fromEntries(Object.entries(parent.properties).map(([k, v]) => [k === oldKey ? key : k, v]))
  if (Array.isArray(parent.required)) parent.required = parent.required.map((k: string) => (k === oldKey ? key : k))
  const oldPrefix = keyPrefix(model, location.node)
  const depth = path.length - 1
  const renamed: FormNode[] = []
  for (const { node, list } of locations(model)) {
    if (node.kind !== 'control' || list !== location.list || !node.path || node.path.length <= depth) continue
    if (node.path.slice(0, depth).every((segment, i) => segment === path[i]) && node.path[depth] === oldKey) {
      node.path = [...node.path.slice(0, depth), key, ...node.path.slice(depth + 1)]
      renamed.push(...descendants(node))
    }
  }
  retargetKeys(model, renamed, oldPrefix, keyPrefix(model, location.node))
  return true
}

/** The filtrex rules of the tree mentioning a name (as a whole word), with their node. */
export function ruleReferences(model: FormModel, name: string): { node: FormNode; rule: string; expression: string }[] {
  const pattern = new RegExp(`(^|[^\\w$.])${name.replace(/[$]/g, '\\$')}(?![\\w$])`)
  const result: { node: FormNode; rule: string; expression: string }[] = []
  const check = (node: FormNode, rules: unknown) => {
    if (!isObject(rules)) return
    for (const [rule, value] of Object.entries(rules)) {
      const expressions: string[] = typeof value === 'string' ? [value]
        : Array.isArray(value) ? value.map((v: any) => (isObject(v) ? v.expr ?? v.expression : v)).filter((v: unknown) => typeof v === 'string') : []
      expressions.filter((expression) => pattern.test(expression)).forEach((expression) => result.push({ node, rule, expression }))
    }
  }
  for (const { node, list } of locations(model)) {
    check(node, node.element.rules)
    if (node.path) check(node, propertyIn(containerOf(model, list), node.path)?.rules)
  }
  return result
}

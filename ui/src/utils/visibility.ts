/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolveSchema, toDataPathSegments } from '@jsonforms/core'
import type { ErrorObject } from 'ajv'

/**
 * Data paths (`/a/b`, JSON pointer style like the AJV `instancePath`) of the
 * controls hidden by a `visible` rule, their own or the rule of an enclosing
 * layout, evaluated against the current form data. A control found under a
 * hidden element is hidden whatever its own rule says.
 *
 * The elements of each list item (the item UI schema, scopes relative to the
 * item schema) are walked too, their paths under the item path (`/list/0/b`).
 * As when rendered, their rules are evaluated against the form data.
 */
export function collectHiddenPaths(
  uischema: any,
  schema: any,
  evaluate: (rule: string) => boolean,
  data?: any,
): string[] {
  const hidden: string[] = []

  // element: UI schema element, base: schema its scope is relative to, prefix: data path of base
  const walk = (element: any, base: any, prefix: string, ancestorHidden: boolean): void => {
    if (!element || typeof element !== 'object') return
    const property = element.type === 'Control' && typeof element.scope === 'string'
      ? safeResolve(base, element.scope, schema)
      : undefined
    const rule = (element.rules && element.rules.visible) || (property && property.rules && property.rules.visible)
    const isHidden = ancestorHidden || (typeof rule === 'string' && rule.length > 0 && evaluate(rule) !== true)
    if (element.type === 'Control') {
      if (typeof element.scope !== 'string') return
      const path = prefix + toDataPath(element.scope)
      if (isHidden) {
        if (path) hidden.push(path)
        return
      }
      const value = getDataPath(data, path)
      if (Array.isArray(value) && property && property.items && typeof property.items === 'object') {
        const itemUischema = listItemUischema(element, property.items)
        value.forEach((_item, index) => walk(itemUischema, property.items, `${path}/${index}`, false))
      }
      return
    }
    if (Array.isArray(element.elements)) {
      element.elements.forEach((child: any) => walk(child, base, prefix, isHidden))
    }
  }

  walk(uischema, schema, '', false)
  return hidden
}

/**
 * UI schema of one item of a list control (`options.items`, scopes relative to
 * the item schema): by default one control per property of an object item, or
 * the item itself.
 */
export function listItemUischema(uischema: any, itemsSchema: any): any {
  if (uischema?.options?.items) return uischema.options.items
  const properties = itemsSchema?.properties
  if (properties && typeof properties === 'object' && !itemsSchema?.format) {
    return {
      type: 'VerticalLayout',
      elements: Object.keys(properties).map((key) => ({
        type: 'Control',
        scope: `#/properties/${key}`,
      })),
    }
  }
  return { type: 'Control', scope: '#', label: false }
}

function getDataPath(data: any, path: string): any {
  return path
    .split('/')
    .slice(1)
    .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((value, key) => (value !== null && typeof value === 'object' ? value[key] : undefined), data)
}

function safeResolve(schema: any, scope: string, rootSchema: any): any {
  try {
    return resolveSchema(schema, scope, rootSchema)
  } catch {
    return undefined
  }
}

/** `#/properties/a/properties/b` → `/a/b` */
function toDataPath(scope: string): string {
  const segments = toDataPathSegments(scope)
  return segments.length ? '/' + segments.map(escapePointer).join('/') : ''
}

function escapePointer(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1')
}

/** data path an AJV error is about: the `required` errors point at the missing property */
export function errorDataPath(error: ErrorObject): string {
  const missing = error.keyword === 'required' && error.params ? (error.params as any).missingProperty : undefined
  return typeof missing === 'string' ? `${error.instancePath}/${escapePointer(missing)}` : error.instancePath
}

/** the errors that are not about a hidden control or one of its descendants */
export function filterHiddenErrors<T extends ErrorObject>(errors: T[], hiddenPaths: string[]): T[] {
  if (hiddenPaths.length === 0) return errors
  return errors.filter((error) => {
    const path = errorDataPath(error)
    return !hiddenPaths.some((hidden) => path === hidden || path.startsWith(hidden + '/'))
  })
}

/**
 * A copy of `data` without the value at the data path (`/a/b`), the objects
 * along the path copied, or `data` itself when there is no value there.
 */
export function unsetDataPath(data: any, path: string): any {
  const segments = path.split('/').slice(1).map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'))
  const unset = (value: any, index: number): any => {
    if (value === null || typeof value !== 'object') return value
    const key = segments[index]!
    if (!Object.prototype.hasOwnProperty.call(value, key)) return value
    if (index === segments.length - 1) {
      if (Array.isArray(value)) return value
      const { [key]: _removed, ...rest } = value
      return rest
    }
    const child = unset(value[key], index + 1)
    if (child === value[key]) return value
    return Array.isArray(value) ? Object.assign([...value], { [key]: child }) : { ...value, [key]: child }
  }
  return segments.length ? unset(data, 0) : data
}

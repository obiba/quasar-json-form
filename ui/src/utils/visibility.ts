/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolveSchema, toDataPathSegments } from '@jsonforms/core'
import type { ErrorObject } from 'ajv'

/**
 * Data paths (`/a/b`, JSON pointer style like the AJV `instancePath`) of the
 * controls hidden by a `visible` rule, their own or the rule of an enclosing
 * layout, evaluated against the current form data. A control found under a
 * hidden element is hidden whatever its own rule says.
 *
 * The rules of the elements of a list item (`options.items`) are relative to
 * the item data and are not evaluated here: a hidden list hides its items
 * through its own path.
 */
export function collectHiddenPaths(
  uischema: any,
  schema: any,
  evaluate: (rule: string) => boolean,
): string[] {
  const hidden: string[] = []

  const visibleRule = (element: any): string | undefined => {
    const fromUischema = element.rules && element.rules.visible
    if (fromUischema) return fromUischema
    if (element.type === 'Control' && typeof element.scope === 'string') {
      const property = safeResolve(schema, element.scope)
      return property && property.rules && property.rules.visible
    }
    return undefined
  }

  const walk = (element: any, ancestorHidden: boolean): void => {
    if (!element || typeof element !== 'object') return
    const rule = visibleRule(element)
    const isHidden = ancestorHidden || (typeof rule === 'string' && rule.length > 0 && evaluate(rule) !== true)
    if (element.type === 'Control') {
      if (isHidden && typeof element.scope === 'string') {
        const path = toDataPath(element.scope)
        if (path) hidden.push(path)
      }
      return
    }
    if (Array.isArray(element.elements)) {
      element.elements.forEach((child: any) => walk(child, isHidden))
    }
  }

  walk(uischema, false)
  return hidden
}

function safeResolve(schema: any, scope: string): any {
  try {
    return resolveSchema(schema, scope, schema)
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

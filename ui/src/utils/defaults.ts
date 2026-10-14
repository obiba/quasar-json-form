/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A copy of `data` in which every property of the schema that has a
 * `default` and no value gets that default, walking the nested object
 * properties (the items of a list get theirs when added). Returns the data
 * paths (`/a/b`) of the values set, `data` itself when there is none.
 */
export function fillDefaults(schema: any, data: any): { data: any; paths: string[] } {
  const paths: string[] = []

  const fill = (objectSchema: any, value: any, prefix: string): any => {
    const properties = objectSchema?.properties
    if (!properties || typeof properties !== 'object') return value
    if (value !== undefined && (value === null || typeof value !== 'object' || Array.isArray(value))) return value
    let result = value
    for (const [key, property] of Object.entries<any>(properties)) {
      if (!property || typeof property !== 'object') continue
      const path = `${prefix}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`
      const current = result?.[key]
      let next = current
      if (current === undefined && property.default !== undefined) {
        next = structuredClone(property.default)
        paths.push(path)
      } else {
        next = fill(property, current, path)
      }
      if (next !== current) result = { ...(result ?? {}), [key]: next }
    }
    return result
  }

  const filled = fill(schema, data ?? {}, '')
  return { data: paths.length > 0 ? filled : data, paths }
}

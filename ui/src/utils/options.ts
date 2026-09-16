/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Renderer options that are interpreted by the renderers and must not be
 * spread as props/attributes on the underlying Quasar component.
 */
export const RENDERER_OPTION_KEYS = [
  'format',
  'validationMessage',
  'wordLimit',
  'wordMin',
  'wordMax',
  'languages',
  'marked',
  'dateFormat',
  'dateOptions',
  'yearRef',
  'monthRef',
  'lastDay',
  'min',
  'max',
  'countries',
  'values',
  'items',
  'checkboxMode',
  'editable',
  'multiple',
  'itemsKey',
  'emptyMessage',
  'uploadUrl',
  'uploadMethod',
  'uploadHeaders',
  'fileField',
  'pathKey',
  'metadataUrl',
  'deleteUrl',
  'downloadUrl',
  'accept',
  'acceptedFileTypes',
  'ordering',
  'confirmation',
  'addLabel',
  'addIcon',
  'items',
  'grid',
]

/** Copy of `options` without the given keys (defaults to `RENDERER_OPTION_KEYS`). */
export function omitOptions(options: Record<string, any> | undefined, keys: string[] = RENDERER_OPTION_KEYS): Record<string, any> {
  const result: Record<string, any> = {}
  Object.keys(options || {}).forEach((key) => {
    if (!keys.includes(key)) result[key] = (options as any)[key]
  })
  return result
}

/** `a.b.c` lookup in a plain object */
export function getByPath(obj: any, path: string | string[]): any {
  const segments = Array.isArray(path) ? path : path.split('.').filter((s) => s.length > 0)
  return segments.reduce((current: any, segment: string) => current?.[segment], obj)
}

/** Human readable file size */
export function formatFileSize(bytes: unknown): string | undefined {
  if (typeof bytes !== 'number' || isNaN(bytes)) return undefined
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`
}

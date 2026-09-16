/* eslint-disable @typescript-eslint/no-explicit-any */

/** Number of whitespace-separated words in a string (0 for anything else). */
export function countWords(value: unknown): number {
  if (typeof value !== 'string') return 0
  return (value.match(/\S+/g) || []).length
}

export interface WordLimit {
  min?: number
  max?: number
  /** the option the limit was read from */
  source: 'wordLimit' | 'wordMin' | 'wordMax'
}

const toInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined
  const n = parseInt(String(value), 10)
  return isNaN(n) ? undefined : n
}

/**
 * Reads a word limit from renderer options: `wordLimit: "min:max"` or
 * `wordLimit: max` (the angular-schema-form convention used by Mica), or the
 * separate `wordMin` / `wordMax` options.
 */
export function parseWordLimit(options: Record<string, any> | undefined): WordLimit | undefined {
  if (!options) return undefined
  if (options.wordLimit !== undefined && options.wordLimit !== null) {
    const parts = String(options.wordLimit).split(':')
    if (parts.length > 1) {
      return { min: toInt(parts[0]), max: toInt(parts[1]), source: 'wordLimit' }
    }
    return { min: 0, max: toInt(parts[0]), source: 'wordLimit' }
  }
  const min = toInt(options.wordMin)
  const max = toInt(options.wordMax)
  if (min === undefined && max === undefined) return undefined
  return { min, max, source: max !== undefined ? 'wordMax' : 'wordMin' }
}

/** true when the value respects the limit (an empty value always does) */
export function isWithinWordLimit(value: unknown, limit: WordLimit): boolean {
  if (value === undefined || value === null || value === '') return true
  const count = countWords(value)
  if (limit.min !== undefined && count < limit.min) return false
  if (limit.max !== undefined && count > limit.max) return false
  return true
}

import { describe, it, expect } from 'vitest'
import { omitOptions, getByPath, formatFileSize, RENDERER_OPTION_KEYS } from '../src/utils/options'

describe('omitOptions', () => {
  it('drops the renderer options by default', () => {
    const result = omitOptions({ format: 'markdown', rows: 3, dense: true, validationMessage: 'x' })
    expect(result).toEqual({ rows: 3, dense: true })
    expect(RENDERER_OPTION_KEYS).toContain('format')
  })

  it('accepts a custom key list and undefined options', () => {
    expect(omitOptions({ a: 1, b: 2 }, ['a'])).toEqual({ b: 2 })
    expect(omitOptions(undefined)).toEqual({})
  })
})

describe('getByPath', () => {
  const data = { a: { b: { c: 1 } }, list: [{ x: 'y' }] }

  it('looks dotted paths and path arrays up', () => {
    expect(getByPath(data, 'a.b.c')).toBe(1)
    expect(getByPath(data, ['a', 'b'])).toEqual({ c: 1 })
    expect(getByPath(data, 'list.0.x')).toBe('y')
  })

  it('returns undefined on missing segments and ignores empty segments', () => {
    expect(getByPath(data, 'a.z.c')).toBeUndefined()
    expect(getByPath(undefined, 'a')).toBeUndefined()
    expect(getByPath(data, '')).toBe(data)
    expect(getByPath(data, 'a..b')).toEqual({ c: 1 })
  })
})

describe('formatFileSize', () => {
  it('formats bytes in human readable units', () => {
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(2048)).toBe('2.0 KB')
    expect(formatFileSize(1536 * 1024)).toBe('1.5 MB')
    expect(formatFileSize(3 * 1024 ** 3)).toBe('3.0 GB')
    expect(formatFileSize(2 * 1024 ** 4)).toBe('2.0 TB')
    expect(formatFileSize(5 * 1024 ** 5)).toBe('5120.0 TB')
  })

  it('returns undefined for non numbers', () => {
    expect(formatFileSize('10')).toBeUndefined()
    expect(formatFileSize(NaN)).toBeUndefined()
    expect(formatFileSize(undefined)).toBeUndefined()
  })
})

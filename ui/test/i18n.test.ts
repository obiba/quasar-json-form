import { describe, it, expect } from 'vitest'
import type { ErrorObject } from 'ajv'
import { createTranslator, errorTranslator } from '../src/utils/i18n'
import type { TranslationSource } from '../src/utils/i18n'

function source(messages: Record<string, Record<string, string>>, locale = 'en', fallbackLocale?: string): TranslationSource {
  return {
    locale,
    fallbackLocale,
    te: (key: string, loc?: string) => (messages[loc || locale] || {})[key] !== undefined,
    t: (key: string, named?: Record<string, unknown>) => {
      const msg = (messages[locale] || {})[key] ?? (fallbackLocale ? (messages[fallbackLocale] || {})[key] : undefined) ?? key
      return msg.replace(/\{(\w+)\}/g, (_m: string, n: string) => String(named?.[n]))
    },
  }
}

function ajvError(keyword: string, params: Record<string, unknown> = {}, message = 'ajv message'): ErrorObject {
  return { keyword, params, message, instancePath: '/name', schemaPath: '#/properties/name/' + keyword } as ErrorObject
}

describe('createTranslator', () => {
  it('prefers the application messages', () => {
    const t = createTranslator(source({ en: { 'error.required': 'Required!' } }))
    expect(t('error.required', undefined)).toBe('Required!')
  })

  it('uses the application fallback locale before the built-in messages', () => {
    const t = createTranslator(source({ en: { 'error.required': 'Required!' }, fr: {} }, 'fr', 'en'))
    expect(t('error.required', undefined)).toBe('Required!')
  })

  it('falls back to the built-in messages with interpolation', () => {
    const t = createTranslator(source({}))
    expect(t('error.required', undefined)).toBe('This field is required')
    expect(t('error.minLength', undefined, { error: ajvError('minLength', { limit: 3 }) })).toBe('Must be at least 3 characters long')
  })

  it('selects the built-in messages of the current locale, including regional locales', () => {
    expect(createTranslator(source({}, 'fr'))('error.required', undefined)).toBe('Ce champ est requis')
    expect(createTranslator(source({}, 'fr-CA'))('error.required', undefined)).toBe('Ce champ est requis')
    expect(createTranslator(source({}, 'de'))('error.required', undefined)).toBe('This field is required')
  })

  it('returns the JSON Forms default for unknown keys', () => {
    const t = createTranslator(source({}))
    expect(t('name.label', 'Name')).toBe('Name')
    expect(t('name.label', undefined)).toBeUndefined()
    expect(t('must be string', undefined)).toBeUndefined()
  })
})

describe('errorTranslator', () => {
  const t = createTranslator(source({ en: { 'error.pattern': 'Bad format: {pattern}' } }))

  it('translates keyword errors', () => {
    expect(errorTranslator(ajvError('required', { missingProperty: 'name' }), t)).toBe('This field is required')
    expect(errorTranslator(ajvError('maximum', { limit: 10, comparison: '<=' }), t)).toBe('Must be less than or equal to 10')
    expect(errorTranslator(ajvError('pattern', { pattern: '^[a-z]+$' }), t)).toBe('Bad format: ^[a-z]+$')
  })

  it('uses the generic message when the keyword has no translation', () => {
    expect(errorTranslator(ajvError('oneOf', {}, 'must match exactly one schema in oneOf'), t)).toBe('This value is not valid')
  })

  it('honours a control specific message through the i18n prefix', () => {
    const t2 = createTranslator(source({ en: { 'name.error.required': 'Please name it' } }))
    expect(errorTranslator(ajvError('required', { missingProperty: 'name' }), t2)).toBe('Please name it')
  })
})

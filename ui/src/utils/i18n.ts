/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ErrorTranslator, JsonFormsI18nState, Translator } from '@jsonforms/core'
import { defaultErrorTranslator } from '@jsonforms/core'
import { messages as defaultMessages } from '../i18n/messages'

/**
 * The subset of a vue-i18n composer (or any compatible object) needed to
 * translate JSON Forms keys and AJV errors.
 */
export interface TranslationSource {
  locale: string
  fallbackLocale?: string
  /** true when `key` exists for `locale` (current locale when omitted) */
  te: (key: string, locale?: string) => boolean
  t: (key: string, named?: Record<string, unknown>) => string
}

function getPath(obj: any, path: string): string | undefined {
  const value = path.split('.').reduce((current: any, segment: string) => current?.[segment], obj)
  return typeof value === 'string' ? value : undefined
}

/** Replaces the `{name}` placeholders of a message with the named values. */
export function interpolate(message: string, values: Record<string, unknown>): string {
  return message.replace(/\{(\w+)\}/g, (match: string, name: string) => {
    const value = values[name]
    return value === undefined || value === null ? match : String(value)
  })
}

/** Messages of one language: flat dotted keys (`'name.title'`), nested objects, or a mix of both. */
export type Messages = Record<string, unknown>

/**
 * Translations embedded in a form, keyed by language:
 * `{ en: { 'name.title': 'Name' }, fr: { name: { title: 'Nom' } } }`.
 */
export type FormTranslations = Record<string, Messages>

function lookup(messages: Messages | undefined, key: string): string | undefined {
  if (!messages) return undefined
  const flat = messages[key]
  return typeof flat === 'string' ? flat : getPath(messages, key)
}

/**
 * Looks a key up in the translations of a form, in the given locale then in
 * its language part (`fr` for `fr-CA`); undefined when not found.
 */
export function lookupTranslation(translations: FormTranslations | undefined, locale: string | undefined, key: string): string | undefined {
  if (!translations || !locale || !key) return undefined
  const language = locale.split('-')[0]!
  return lookup(translations[locale], key) ?? (language !== locale ? lookup(translations[language], key) : undefined)
}

/**
 * Flattens the values JSON Forms hands to the translator into vue-i18n named
 * parameters: for AJV errors, the error params (`limit`, `pattern`, ...) and
 * the keyword become directly interpolable.
 */
function toNamed(values: any): Record<string, unknown> {
  if (values && values.error) {
    const error = values.error
    return { ...values, ...(error.params || {}), keyword: error.keyword }
  }
  return values || {}
}

/**
 * Looks a key up in the application messages first, then in the library
 * default messages (current locale, then english), and finally returns the
 * JSON Forms default.
 */
export function createTranslator(source: TranslationSource): Translator {
  const translate = (id: string, defaultMessage?: string, values?: any): string | undefined => {
    if (!id) return defaultMessage
    const named = toNamed(values)
    if (source.te(id) || (source.fallbackLocale && source.te(id, source.fallbackLocale))) {
      return source.t(id, named)
    }
    const builtin = getPath(defaultMessages[source.locale], id)
      ?? getPath(defaultMessages[source.locale.split('-')[0]!], id)
      ?? getPath(defaultMessages.en, id)
    if (builtin !== undefined) {
      return interpolate(builtin, named)
    }
    return defaultMessage
  }
  return translate as Translator
}

/**
 * JSON Forms error translator: `<i18n prefix>.error.<keyword>`, then
 * `error.<keyword>`, then the raw AJV message as a key, and when none of these
 * resolve, `error.default` (the "does not validate" catch-all).
 */
export const errorTranslator: ErrorTranslator = (error, translate, uischema) => {
  const message = defaultErrorTranslator(error, translate, uischema)
  if (message === undefined || message === error.message) {
    return translate('error.default', message ?? '', { error }) as string
  }
  return message
}

export function createJsonFormsI18n(source: TranslationSource): JsonFormsI18nState {
  return {
    locale: source.locale,
    translate: createTranslator(source),
    translateError: errorTranslator,
  }
}

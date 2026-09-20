import { Notify } from 'quasar'
import { i18n } from '../boot/i18n'

/** rewrites Angular-style '{{key}}' placeholders into vue-i18n's '{key}' syntax, recursively */
function toVueI18nSyntax<T>(value: T): T {
  if (typeof value === 'string') {
    return value.replace(/\{\{\s*([\w-]+)\s*\}\}/g, '{$1}') as T
  }
  if (Array.isArray(value)) {
    return value.map(toVueI18nSyntax) as T
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, toVueI18nSyntax(val)])) as T
  }
  return value
}

/**
 * Reads a `{ locale: { ...nested keys } }` JSON file (e.g. an application's vue-i18n bundle, or
 * a legacy Angular-style one using '{{arg0}}' placeholders) and merges it into the application's
 * global i18n instance, so that `t(<key>)` strings in a playground schema/definition resolve.
 */
export function loadTranslationsFile (file: File | null, invalidJsonLabel: string, loadedLabel: string): void {
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result))
      for (const [locale, messages] of Object.entries(parsed)) {
        i18n.global.mergeLocaleMessage(locale, toVueI18nSyntax(messages as Record<string, unknown>))
      }
      Notify.create({ message: loadedLabel, type: 'positive', timeout: 1500 })
    } catch (e) {
      Notify.create({ message: `${invalidJsonLabel}: ${(e as Error).message}`, type: 'negative', timeout: 3000 })
    }
  }
  reader.onerror = () => {
    Notify.create({ message: String(reader.error), type: 'negative', timeout: 3000 })
  }
  reader.readAsText(file)
}

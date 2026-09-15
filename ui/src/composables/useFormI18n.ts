import { ref } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createTranslator } from '../utils/i18n'

/**
 * Translation functions used by the renderers.
 */
export interface FormI18n {
  /** translate a key, returning the key itself when unknown */
  t: (key: string, named?: Record<string, unknown>) => string
  /**
   * translate a key, falling back to the library built-in messages
   * (`i18n/messages.ts`) when the application does not define it, then to the
   * key itself
   */
  translate: (key: string, named?: Record<string, unknown>) => string
  /** true when the key exists (in the given locale, or the current one) */
  te: (key: string, locale?: string) => boolean
  locale: Ref<string>
  /** the application fallback locale when it is a single locale, else undefined */
  fallbackLocale: Ref<string | undefined>
}

let warned = false

function withBuiltinFallback(i18n: Omit<FormI18n, 'translate'>): FormI18n {
  const translate = (key: string, named?: Record<string, unknown>): string => {
    const translator = createTranslator({
      locale: String(i18n.locale.value),
      fallbackLocale: i18n.fallbackLocale.value,
      te: i18n.te,
      t: i18n.t,
    })
    return translator(key, key, named) ?? key
  }
  return { ...i18n, translate }
}

/**
 * `useI18n()` from vue-i18n when the plugin is installed in the application,
 * otherwise a pass-through: keys are displayed as-is and the validation
 * messages come from the library defaults (see `i18n/messages.ts`).
 *
 * Must be called at the top of a component `setup` function.
 */
export function useFormI18n(): FormI18n {
  try {
    const { t, te, locale, fallbackLocale } = useI18n()
    return withBuiltinFallback({
      t: (key: string, named?: Record<string, unknown>) => t(key, named ?? {}),
      te: (key: string, loc?: string) => te(key, loc as never),
      locale: locale as Ref<string>,
      fallbackLocale: ref(typeof fallbackLocale.value === 'string' ? fallbackLocale.value : undefined),
    })
  } catch (error) {
    if (!warned) {
      warned = true
      console.warn('[quasar-json-form] vue-i18n is not installed (app.use(i18n)): labels and messages will not be translated.', error)
    }
    return withBuiltinFallback({
      t: (key: string) => key,
      te: () => false,
      locale: ref('en'),
      fallbackLocale: ref(undefined),
    })
  }
}

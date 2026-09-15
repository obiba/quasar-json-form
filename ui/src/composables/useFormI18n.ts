import { ref } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Translation functions used by the renderers.
 */
export interface FormI18n {
  /** translate a key, returning the key itself when unknown */
  t: (key: string, named?: Record<string, unknown>) => string
  /** true when the key exists (in the given locale, or the current one) */
  te: (key: string, locale?: string) => boolean
  locale: Ref<string>
  /** the application fallback locale when it is a single locale, else undefined */
  fallbackLocale: Ref<string | undefined>
}

let warned = false

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
    return {
      t: (key: string, named?: Record<string, unknown>) => t(key, named ?? {}),
      te: (key: string, loc?: string) => te(key, loc as never),
      locale: locale as Ref<string>,
      fallbackLocale: ref(typeof fallbackLocale.value === 'string' ? fallbackLocale.value : undefined),
    }
  } catch (error) {
    if (!warned) {
      warned = true
      console.warn('[quasar-json-form] vue-i18n is not installed (app.use(i18n)): labels and messages will not be translated.', error)
    }
    return {
      t: (key: string) => key,
      te: () => false,
      locale: ref('en'),
      fallbackLocale: ref(undefined),
    }
  }
}

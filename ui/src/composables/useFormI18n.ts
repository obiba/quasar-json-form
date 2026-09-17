import { computed, inject, ref, unref } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { createTranslator, interpolate, lookupTranslation } from '../utils/i18n'
import type { FormTranslations } from '../utils/i18n'
import { I18N_KEY } from './keys'

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

/**
 * Translations and locale of a form, provided by `QJsonForm` under `I18N_KEY`
 * (an application can also provide them at its own level).
 */
export interface FormI18nOverride {
  /** locale of the form, overriding the vue-i18n one for its renderers */
  locale?: string
  /** translations of the form, looked up before the vue-i18n messages */
  translations?: FormTranslations
}

/** The application level translation functions: vue-i18n, or a pass-through */
interface BaseI18n {
  t: (key: string, named: Record<string, unknown>, locale?: string) => string
  te: (key: string, locale?: string) => boolean
  locale: Ref<string>
  fallbackLocale: Ref<string | undefined>
}

let warned = false

function baseI18n(): BaseI18n {
  try {
    const { t, te, locale, fallbackLocale } = useI18n()
    return {
      t: (key: string, named: Record<string, unknown>, loc?: string) => (loc ? t(key, named, { locale: loc }) : t(key, named)),
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
 * Wraps the application translation functions with the translations and
 * locale of the form: a key is looked up in the form translations for the
 * form locale, then for the application fallback locale, and then handed to
 * the application (in the form locale when it is set).
 */
function withFormTranslations(base: BaseI18n, override: Ref<FormI18nOverride | undefined>): Omit<FormI18n, 'translate'> {
  const formLocale = computed<string | undefined>(() => unref(override)?.locale)
  const locale = computed<string>(() => formLocale.value ?? String(base.locale.value))
  const find = (key: string, loc?: string): string | undefined =>
    lookupTranslation(unref(override)?.translations, loc ?? locale.value, key)
  return {
    t: (key: string, named?: Record<string, unknown>) => {
      const fallback = base.fallbackLocale.value
      const message = find(key) ?? (fallback ? find(key, fallback) : undefined)
      return message !== undefined ? interpolate(message, named ?? {}) : base.t(key, named ?? {}, formLocale.value)
    },
    te: (key: string, loc?: string) => find(key, loc) !== undefined || base.te(key, loc ?? formLocale.value),
    locale: locale as unknown as Ref<string>,
    fallbackLocale: base.fallbackLocale,
  }
}

/**
 * `useI18n()` from vue-i18n when the plugin is installed in the application,
 * otherwise a pass-through: keys are displayed as-is and the validation
 * messages come from the library defaults (see `i18n/messages.ts`).
 *
 * The translations and locale of the enclosing `QJsonForm` (its
 * `translations` and `locale` props, provided under `I18N_KEY`) take
 * precedence; `QJsonForm` itself passes them as `override`.
 *
 * Must be called at the top of a component `setup` function.
 */
export function useFormI18n(override?: Ref<FormI18nOverride | undefined>): FormI18n {
  const base = baseI18n()
  const scoped = override ?? inject<Ref<FormI18nOverride | undefined> | undefined>(I18N_KEY, undefined)
  if (!scoped) {
    return withBuiltinFallback({
      t: (key: string, named?: Record<string, unknown>) => base.t(key, named ?? {}),
      te: base.te,
      locale: base.locale,
      fallbackLocale: base.fallbackLocale,
    })
  }
  return withBuiltinFallback(withFormTranslations(base, scoped))
}

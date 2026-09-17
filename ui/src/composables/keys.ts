/**
 * Vue provide/inject keys shared by `QJsonForm` and the renderers. They are
 * plain strings so that an application can also provide them at its own level
 * (for instance `app.provide('jsonforms-languages', ['en', 'fr'])`).
 */

/** form data (`Ref<object>`) */
export const DATA_KEY = 'jsonforms-data'
/** form-level read-only flag (`Ref<boolean>`) */
export const READONLY_KEY = 'jsonforms-readonly'
/** languages of the localized strings (`Ref<string[] | Record<string, string>>`) */
export const LANGUAGES_KEY = 'jsonforms-languages'
/** language currently displayed by the localized string controls (`Ref<string | undefined>`) */
export const LOCALE_KEY = 'jsonforms-locale'
/** ISO country list for the countries renderer (`Ref<CountryCode[] | Record<string, CountryCode[]>>`) */
export const COUNTRIES_KEY = 'jsonforms-countries'
/** translations and locale of the form (`Ref<FormI18nOverride | undefined>`, see `useFormI18n`) */
export const I18N_KEY = 'jsonforms-i18n'
/** renderer-level errors registry (see `useFormErrors`) */
export const FORM_ERRORS_KEY = 'jsonforms-custom-errors'

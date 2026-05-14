import { boot } from 'quasar/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'
import { Quasar } from 'quasar'

const locales = ['en', 'fr'] as const
type Locale = typeof locales[number]

let detectedLocale: Locale = Quasar.lang.getLocale().split('-')[0] as Locale
if (!locales.includes(detectedLocale)) {
  detectedLocale = locales[0]
}

const i18n = createI18n({
  legacy: false,
  locale: detectedLocale,
  fallbackLocale: locales[0],
  warnHtmlMessage: false,
  missingWarn: false,
  fallbackWarn: false,
  messages
})
const t = i18n.global.t

export default boot(({ app }) => {
  app.use(i18n)
})

export { i18n, t, locales }
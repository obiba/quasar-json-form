import { describe, it, expect } from 'vitest'
import { createApp } from 'vue'
import * as plugin from '../src/vue-plugin'
import esm from '../src/index.esm'
import { messages } from '../src/i18n/messages'
import { countryCodes } from '../src/data/countries'

const COMPONENTS = [
  'QDateRenderer', 'QTimeRenderer', 'QDateTimeRenderer', 'QSelectRenderer', 'QOptionsRenderer',
  'QNumberRenderer', 'QRatingRenderer', 'QSliderRenderer', 'QRangeRenderer', 'QStringRenderer', 'QFileUploadRenderer',
  'QToggleRenderer', 'QSectionRenderer', 'QListRenderer', 'QLabelRenderer', 'QTabsLayout',
  'QStepperLayout', 'QGridLayout', 'QGroupRenderer', 'QLayoutRenderer', 'QComputedRenderer', 'QLocalizedStringRenderer',
  'QMarkdownRenderer', 'QMarkdownEditor', 'QRadioMatrixRenderer', 'QCountriesRenderer',
  'QTypeaheadRenderer', 'QJsonForm',
]

describe('vue plugin', () => {
  it('registers every component globally', () => {
    const app = createApp({ render: () => null })
    app.use(plugin as any)
    for (const name of COMPONENTS) {
      expect(app.component(name), name).toBeDefined()
    }
  })

  it('exposes the version and the public helpers', () => {
    expect(plugin.version).toBe('test')
    expect(plugin.messages).toBe(messages)
    expect(plugin.countryCodes).toBe(countryCodes)
    expect(typeof plugin.createJsonFormsI18n).toBe('function')
    expect(typeof plugin.createTranslator).toBe('function')
    expect(typeof plugin.errorTranslator).toBe('function')
    expect(typeof plugin.renderMarkdown).toBe('function')
    expect(typeof plugin.renderMarkdownInline).toBe('function')
    expect(typeof plugin.countWords).toBe('function')
    expect(typeof plugin.parseWordLimit).toBe('function')
    expect(typeof plugin.createFormErrorRegistry).toBe('function')
    expect(typeof plugin.toInstancePath).toBe('function')
    expect(typeof plugin.normalizeLanguages).toBe('function')
    expect(typeof plugin.useControlProperties).toBe('function')
    expect(typeof plugin.useFormI18n).toBe('function')
    expect(typeof plugin.useReportedErrors).toBe('function')
    expect(typeof plugin.omitOptions).toBe('function')
    expect(plugin.RENDERER_OPTION_KEYS).toContain('format')
    expect(typeof plugin.convertAsf).toBe('function')
    expect(typeof plugin.toJsonForms).toBe('function')
    expect(typeof plugin.isAsfDefinition).toBe('function')
    expect(typeof plugin.transpileAsfCondition).toBe('function')
    expect(plugin.filtrexEngine).toBeInstanceOf(plugin.FiltrexRuleEngine)
    expect(plugin.AsfConditionError.prototype).toBeInstanceOf(Error)
    expect(plugin.DATA_KEY).toBe('jsonforms-data')
    expect(plugin.READONLY_KEY).toBe('jsonforms-readonly')
    expect(plugin.LANGUAGES_KEY).toBe('jsonforms-languages')
    expect(plugin.LOCALE_KEY).toBeDefined()
    expect(plugin.COUNTRIES_KEY).toBe('jsonforms-countries')
    expect(plugin.FORM_ERRORS_KEY).toBeDefined()
  })

  it('is the default export of the ESM entry', () => {
    expect(esm.install).toBe(plugin.install)
    expect(esm.QJsonForm).toBe(plugin.QJsonForm)
  })
})

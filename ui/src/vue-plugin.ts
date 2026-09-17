import type { App } from 'vue'
import QDateRenderer from './components/QDateRenderer'

declare const __UI_VERSION__: string
import QTimeRenderer from './components/QTimeRenderer'
import QDateTimeRenderer from './components/QDateTimeRenderer'
import QSelectRenderer from './components/QSelectRenderer'
import QOptionsRenderer from './components/QOptionsRenderer'
import QNumberRenderer from './components/QNumberRenderer'
import QRatingRenderer from './components/QRatingRenderer'
import QSliderRenderer from './components/QSliderRenderer'
import QRangeRenderer from './components/QRangeRenderer'
import QStringRenderer from './components/QStringRenderer'
import QFileUploadRenderer from './components/QFileUploadRenderer'
import QToggleRenderer from './components/QToggleRenderer'
import QSectionRenderer from './components/QSectionRenderer'
import QLabelRenderer from './components/QLabelRenderer'
import QListRenderer from './components/QListRenderer'
import QTabsLayout from './components/QTabsLayout'
import QStepperLayout from './components/QStepperLayout'
import QGridLayout from './components/QGridLayout'
import QGroupRenderer from './components/QGroupRenderer'
import QLayoutRenderer from './components/QLayoutRenderer'
import QComputedRenderer from './components/QComputedRenderer'
import QLocalizedStringRenderer from './components/QLocalizedStringRenderer'
import QMarkdownRenderer from './components/QMarkdownRenderer'
import QMarkdownEditor from './components/QMarkdownEditor'
import QRadioMatrixRenderer from './components/QRadioMatrixRenderer'
import QCountriesRenderer from './components/QCountriesRenderer'
import QTypeaheadRenderer from './components/QTypeaheadRenderer'
import QImagesRenderer, { isSupportedImage, ratioPadding, IMAGE_MIME_TYPES } from './components/QImagesRenderer'
import type { ImageEntry, ImageTile } from './components/QImagesRenderer'
import QJsonForm from './components/QJsonForm'
import { messages } from './i18n/messages'
import { countryCodes } from './data/countries'
import type { CountryCode } from './data/countries'
import { createJsonFormsI18n, createTranslator, errorTranslator } from './utils/i18n'
import { renderMarkdown, renderMarkdownInline } from './utils/markdown'
import { countWords, parseWordLimit } from './utils/words'
import { filtrexEngine, FiltrexRuleEngine } from './composables/useFiltrexRules'
import { createFormErrorRegistry, toInstancePath, useReportedErrors } from './composables/useFormErrors'
import type { FormErrorRegistry } from './composables/useFormErrors'
import { normalizeLanguages, useControlProperties } from './composables/useControlProperties'
import type { Language, LanguagesInput, ControlPropertiesReturn, SelectOption } from './composables/useControlProperties'
import { useFormI18n } from './composables/useFormI18n'
import type { FormI18n } from './composables/useFormI18n'
import { omitOptions, RENDERER_OPTION_KEYS } from './utils/options'
import type { FileItem, FileUploadHooks, FileUploadContext } from './components/QFileUploadRenderer'
import { DATA_KEY, READONLY_KEY, LANGUAGES_KEY, LOCALE_KEY, COUNTRIES_KEY, FORM_ERRORS_KEY } from './composables/keys'
import { convert as convertAsf, toJsonForms, isAsfDefinition, transpileCondition as transpileAsfCondition, ConditionError as AsfConditionError } from './asf'
import type { AsfConvertOptions, AsfConvertResult, AsfDiagnostic } from './asf'

const version = __UI_VERSION__

function install(app: App): void {
  app.component(QDateRenderer.name!, QDateRenderer)
  app.component(QTimeRenderer.name!, QTimeRenderer)
  app.component(QDateTimeRenderer.name!, QDateTimeRenderer)
  app.component(QSelectRenderer.name!, QSelectRenderer)
  app.component(QOptionsRenderer.name!, QOptionsRenderer)
  app.component(QNumberRenderer.name!, QNumberRenderer)
  app.component(QRatingRenderer.name!, QRatingRenderer)
  app.component(QSliderRenderer.name!, QSliderRenderer)
  app.component(QRangeRenderer.name!, QRangeRenderer)
  app.component(QStringRenderer.name!, QStringRenderer)
  app.component(QFileUploadRenderer.name!, QFileUploadRenderer)
  app.component(QToggleRenderer.name!, QToggleRenderer)
  app.component(QSectionRenderer.name!, QSectionRenderer)
  app.component(QListRenderer.name!, QListRenderer)
  app.component(QLabelRenderer.name!, QLabelRenderer)
  app.component(QTabsLayout.name!, QTabsLayout)
  app.component(QStepperLayout.name!, QStepperLayout)
  app.component(QGridLayout.name!, QGridLayout)
  app.component(QGroupRenderer.name!, QGroupRenderer)
  app.component(QLayoutRenderer.name!, QLayoutRenderer)
  app.component(QComputedRenderer.name!, QComputedRenderer)
  app.component(QLocalizedStringRenderer.name!, QLocalizedStringRenderer)
  app.component(QMarkdownRenderer.name!, QMarkdownRenderer)
  app.component(QMarkdownEditor.name!, QMarkdownEditor)
  app.component(QRadioMatrixRenderer.name!, QRadioMatrixRenderer)
  app.component(QCountriesRenderer.name!, QCountriesRenderer)
  app.component(QTypeaheadRenderer.name!, QTypeaheadRenderer)
  app.component(QImagesRenderer.name!, QImagesRenderer)
  app.component(QJsonForm.name!, QJsonForm)
}

export {
  version,
  QDateRenderer,
  QTimeRenderer,
  QDateTimeRenderer,
  QSelectRenderer,
  QOptionsRenderer,
  QNumberRenderer,
  QRatingRenderer,
  QSliderRenderer,
  QRangeRenderer,
  QStringRenderer,
  QFileUploadRenderer,
  QToggleRenderer,
  QSectionRenderer,
  QListRenderer,
  QLabelRenderer,
  QTabsLayout,
  QStepperLayout,
  QGridLayout,
  QGroupRenderer,
  QLayoutRenderer,
  QComputedRenderer,
  QLocalizedStringRenderer,
  QMarkdownRenderer,
  QMarkdownEditor,
  QRadioMatrixRenderer,
  QCountriesRenderer,
  QTypeaheadRenderer,
  QImagesRenderer,
  QJsonForm,
  messages,
  isSupportedImage,
  ratioPadding,
  IMAGE_MIME_TYPES,
  countryCodes,
  createJsonFormsI18n,
  createTranslator,
  errorTranslator,
  renderMarkdown,
  renderMarkdownInline,
  countWords,
  parseWordLimit,
  filtrexEngine,
  FiltrexRuleEngine,
  createFormErrorRegistry,
  toInstancePath,
  useReportedErrors,
  normalizeLanguages,
  useControlProperties,
  useFormI18n,
  omitOptions,
  RENDERER_OPTION_KEYS,
  DATA_KEY,
  READONLY_KEY,
  LANGUAGES_KEY,
  LOCALE_KEY,
  COUNTRIES_KEY,
  FORM_ERRORS_KEY,
  convertAsf,
  toJsonForms,
  isAsfDefinition,
  transpileAsfCondition,
  AsfConditionError,
  install
}

export type {
  CountryCode,
  FormErrorRegistry,
  Language,
  LanguagesInput,
  ControlPropertiesReturn,
  SelectOption,
  FormI18n,
  FileItem,
  FileUploadHooks,
  FileUploadContext,
  ImageEntry,
  ImageTile,
  AsfConvertOptions,
  AsfConvertResult,
  AsfDiagnostic,
}

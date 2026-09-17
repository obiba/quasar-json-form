/**
 * Catalog of the renderers: `@obiba/quasar-ui-json-form/catalog`
 *
 * The description of every built-in renderer and of the form component, the
 * single source of truth of the API documentation and of the form builder
 * palette: what triggers a renderer, the element keys, options and validation
 * checks it understands, and the items it contributes to the palette.
 */
import QComputedRenderer from './QComputedRenderer'
import QCountriesRenderer from './QCountriesRenderer'
import QDateRenderer from './QDateRenderer'
import QDateTimeRenderer from './QDateTimeRenderer'
import QFileUploadRenderer from './QFileUploadRenderer'
import QGeoRenderer from './QGeoRenderer'
import QGridLayout from './QGridLayout'
import QGroupRenderer from './QGroupRenderer'
import QImageMapRenderer from './QImageMapRenderer'
import QImagesRenderer from './QImagesRenderer'
import QJsonForm from './QJsonForm'
import QLabelRenderer from './QLabelRenderer'
import QLayoutRenderer from './QLayoutRenderer'
import QListRenderer from './QListRenderer'
import QLocalizedStringRenderer from './QLocalizedStringRenderer'
import QMarkdownRenderer from './QMarkdownRenderer'
import QNumberRenderer from './QNumberRenderer'
import QOptionsRenderer from './QOptionsRenderer'
import QRadioMatrixRenderer from './QRadioMatrixRenderer'
import QRangeRenderer from './QRangeRenderer'
import QRatingRenderer from './QRatingRenderer'
import QSectionRenderer from './QSectionRenderer'
import QSelectRenderer from './QSelectRenderer'
import QSliderRenderer from './QSliderRenderer'
import QStepperLayout from './QStepperLayout'
import QStringRenderer from './QStringRenderer'
import QTabsLayout from './QTabsLayout'
import QTimeRenderer from './QTimeRenderer'
import QToggleRenderer from './QToggleRenderer'
import QTypeaheadRenderer from './QTypeaheadRenderer'

export { controlApi } from './control'
export type { ApiEntry, ApiTrigger, ControlApi, PaletteItem, RendererApi, RendererKind } from './types'
import { controlApi } from './control'
import type { ApiEntry, PaletteItem, RendererApi } from './types'

/** The built-in renderers and the form component, keyed by name. */
export const catalog: Record<string, RendererApi> = {
  QComputedRenderer,
  QCountriesRenderer,
  QDateRenderer,
  QDateTimeRenderer,
  QFileUploadRenderer,
  QGeoRenderer,
  QGridLayout,
  QGroupRenderer,
  QImageMapRenderer,
  QImagesRenderer,
  QJsonForm,
  QLabelRenderer,
  QLayoutRenderer,
  QListRenderer,
  QLocalizedStringRenderer,
  QMarkdownRenderer,
  QNumberRenderer,
  QOptionsRenderer,
  QRadioMatrixRenderer,
  QRangeRenderer,
  QRatingRenderer,
  QSectionRenderer,
  QSelectRenderer,
  QSliderRenderer,
  QStepperLayout,
  QStringRenderer,
  QTabsLayout,
  QTimeRenderer,
  QToggleRenderer,
  QTypeaheadRenderer,
}

/** A palette item with the name of the renderer it comes from. */
export interface CatalogItem extends PaletteItem {
  renderer: string
}

/** The palette items of every renderer of the catalog, in catalog order. */
export const catalogItems: CatalogItem[] = Object.values(catalog).flatMap((api) =>
  (api.items ?? []).map((item) => ({ ...item, renderer: api.name })),
)

/** The item of the given name, when any. */
export function findCatalogItem(name: string): CatalogItem | undefined {
  return catalogItems.find((item) => item.name === name)
}

/**
 * The options a renderer understands, including the ones common to every
 * control when it inherits them.
 */
export function rendererOptions(api: RendererApi): Record<string, ApiEntry> {
  return api.inherits === 'control' ? { ...controlApi.options, ...(api.options ?? {}) } : { ...(api.options ?? {}) }
}

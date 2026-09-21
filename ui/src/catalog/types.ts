/**
 * Types of the renderer catalog: the description of a renderer, as displayed
 * by the API documentation and used by the form builder.
 */

/** A prop, element key, option, event or validation check of a renderer. */
export interface ApiEntry {
  /** type, as documented (`String`, `Number`, `Boolean`, `Array | Object`, `any`...) */
  type?: string
  /** default value, as documented */
  default?: string
  /** i18n key of the message, for a validation check */
  message?: string
  /** description, inline markdown */
  desc: string
}

/** A schema or UI schema shape that selects the renderer. */
export interface ApiTrigger {
  /** the shape, as documented */
  schema: string
  /** rank of the tester */
  rank: number
  /** description, inline markdown */
  desc: string
}

/**
 * An entry of the form builder palette: what a new element made from it looks
 * like. A control item has both fragments, a layout item only the UI schema one.
 */
export interface PaletteItem {
  /** identifier, unique in the catalog (`text`, `radio`, `tabs`...) */
  name: string
  /** label of the palette entry */
  label: string
  /** Material icon of the palette entry */
  icon: string
  /** schema of the new property, for a control */
  schema?: Record<string, unknown>
  /** other `format` names the renderer accepts for this item (`radioGroupCollection` for `radio-matrix`) */
  formats?: string[]
  /** UI schema element (`type`, `options`, `elements`...) */
  uischema: Record<string, unknown>
}

/**
 * `control`: a renderer bound to a schema property; `layout`: an element of
 * the UI schema without data (layouts, groups, sections, labels); `form`: the
 * form component itself.
 */
export type RendererKind = 'control' | 'layout' | 'form'

/** The description of a renderer, or of the form component. */
export interface RendererApi {
  /** component name (`QStringRenderer`...) */
  name: string
  kind: RendererKind
  /** `control`: the element keys and options of `controlApi` apply too */
  inherits?: 'control'
  triggers?: ApiTrigger[]
  /** props of the component (the form) */
  props?: Record<string, ApiEntry>
  /** keys read on the UI schema element itself, next to `type`, `scope` and `options` */
  element?: Record<string, ApiEntry>
  events?: Record<string, ApiEntry>
  /** `options` of the UI schema element */
  options?: Record<string, ApiEntry>
  /** checks made by the renderer itself, with the i18n key of their message */
  validation?: Record<string, ApiEntry>
  /** the data written by the renderer */
  data?: { desc: string; example?: string }
  /** the entries this renderer contributes to the form builder palette */
  items?: PaletteItem[]
}

/** The element keys and options common to every control. */
export interface ControlApi {
  name: string
  element: Record<string, ApiEntry>
  options: Record<string, ApiEntry>
}

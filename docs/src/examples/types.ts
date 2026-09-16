/** A live example: the inputs of `QJsonForm`. */
export interface DocExampleDef {
  schema: Record<string, unknown>
  uischema?: Record<string, unknown>
  data?: Record<string, unknown>
  config?: Record<string, unknown>
  /** JavaScript source displayed in the Config tab, when `config` is not plain JSON */
  configCode?: string
  languages?: string[] | Record<string, string>
  readonly?: boolean
  /**
   * Called with the new data on every change, before it is applied, with the
   * live schema: the application-side logic of the example (the handler of
   * the `update:modelValue` event), which may rewrite both.
   */
  onUpdate?: (data: Record<string, unknown>, schema: Record<string, unknown>) => void
  /** JavaScript source displayed in the Code tab (the `onUpdate` handler) */
  code?: string
  validationMode?: 'ValidateAndShow' | 'ValidateAndHide' | 'NoValidation'
}

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
  validationMode?: 'ValidateAndShow' | 'ValidateAndHide' | 'NoValidation'
}

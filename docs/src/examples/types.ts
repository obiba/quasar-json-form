/** A live example: the inputs of `QJsonForm`. */
export interface DocExampleDef {
  schema: Record<string, unknown>
  uischema?: Record<string, unknown>
  data?: Record<string, unknown>
  config?: Record<string, unknown>
  languages?: string[] | Record<string, string>
  readonly?: boolean
  validationMode?: 'ValidateAndShow' | 'ValidateAndHide' | 'NoValidation'
}

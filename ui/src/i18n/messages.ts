/**
 * Default messages used by the renderers when the host application does not
 * define them in its own vue-i18n bundles. Any key defined by the application
 * takes precedence: the library only falls back to these.
 *
 * Applications can also merge these into their own messages:
 *   createI18n({ messages: { en: { ...messages.en, ...appEn } } })
 *
 * Error keys follow the JSON Forms convention: `error.<ajv keyword>`, with the
 * AJV error params available for interpolation (e.g. `{limit}`), plus
 * `error.default` when no keyword-specific message exists.
 */
export interface FormMessages {
  error: Record<string, string>
  [key: string]: unknown
}

const en: FormMessages = {
  error: {
    default: 'This value is not valid',
    required: 'This field is required',
    type: 'Must be of type {type}',
    enum: 'Must be one of the allowed values',
    const: 'Must be equal to {allowedValue}',
    minLength: 'Must be at least {limit} characters long',
    maxLength: 'Must be at most {limit} characters long',
    pattern: 'Must match the pattern "{pattern}"',
    format: 'Must be a valid {format}',
    minimum: 'Must be greater than or equal to {limit}',
    maximum: 'Must be less than or equal to {limit}',
    exclusiveMinimum: 'Must be greater than {limit}',
    exclusiveMaximum: 'Must be less than {limit}',
    multipleOf: 'Must be a multiple of {multipleOf}',
    minItems: 'Must have at least {limit} items',
    maxItems: 'Must have at most {limit} items',
    uniqueItems: 'Must not contain duplicate items',
    minProperties: 'Must have at least {limit} properties',
    maxProperties: 'Must have at most {limit} properties',
  },
}

const fr: FormMessages = {
  error: {
    default: 'Cette valeur est invalide',
    required: 'Ce champ est requis',
    type: 'Doit être de type {type}',
    enum: 'Doit être une des valeurs permises',
    const: 'Doit être égal à {allowedValue}',
    minLength: 'Doit contenir au moins {limit} caractères',
    maxLength: 'Doit contenir au plus {limit} caractères',
    pattern: 'Doit correspondre au motif "{pattern}"',
    format: 'Doit être un {format} valide',
    minimum: 'Doit être supérieur ou égal à {limit}',
    maximum: 'Doit être inférieur ou égal à {limit}',
    exclusiveMinimum: 'Doit être supérieur à {limit}',
    exclusiveMaximum: 'Doit être inférieur à {limit}',
    multipleOf: 'Doit être un multiple de {multipleOf}',
    minItems: 'Doit contenir au moins {limit} éléments',
    maxItems: 'Doit contenir au plus {limit} éléments',
    uniqueItems: 'Ne doit pas contenir de doublons',
    minProperties: 'Doit avoir au moins {limit} propriétés',
    maxProperties: 'Doit avoir au plus {limit} propriétés',
  },
}

export const messages: Record<string, FormMessages> = { en, fr }

export default messages

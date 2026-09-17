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
 * `error.default` when no keyword-specific message exists. The other keys are
 * the messages of the renderers (file upload, localized strings...).
 */
export interface FormMessages {
  error: Record<string, string>
  [key: string]: unknown
}

const en: FormMessages = {
  close: 'Close',
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
    wordLimit: 'Must have between {min} and {max} words',
    wordMin: 'Must have at least {limit} words',
    wordMax: 'Must have at most {limit} words',
    dateRange: 'Must be between {min} and {max}',
    dateMin: 'Must be on or after {limit}',
    dateMax: 'Must be on or before {limit}',
    dateInvalid: 'Must be a valid date ({format})',
  },
  words: '{count} / {limit} words',
  localized: {
    completed: 'Must be completed in all languages',
  },
  markdown: {
    bold: 'Bold',
    italic: 'Italic',
    heading: 'Heading',
    list: 'List',
    link: 'Link',
    preview: 'Preview',
    edit: 'Edit',
  },
  files: {
    upload: 'Upload',
    empty: 'No file',
    missing: 'At least one file is required',
    minItems: 'Must have at least {limit} files',
    maxItems: 'Must have at most {limit} files',
    uploadUrlMissing: 'No upload URL is configured',
    uploadFailed: 'Upload failed: {message}',
    remove: 'Remove',
    download: 'Download',
  },
  radioMatrix: {
    allItemsSelected: 'All options must be selected',
  },
  images: {
    moveBefore: 'Move before',
    moveAfter: 'Move after',
  },
  geo: {
    point: 'Point',
    linestring: 'Line',
    polygon: 'Polygon',
    locate: 'My position',
    clear: 'Clear',
    latitude: 'Latitude',
    longitude: 'Longitude',
    points: '{count} points',
    locateError: 'The current position could not be obtained',
    loadError: 'The map could not be loaded',
  },
}

const fr: FormMessages = {
  close: 'Fermer',
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
    wordLimit: 'Doit contenir entre {min} et {max} mots',
    wordMin: 'Doit contenir au moins {limit} mots',
    wordMax: 'Doit contenir au plus {limit} mots',
    dateRange: 'Doit être entre {min} et {max}',
    dateMin: 'Doit être le {limit} ou après',
    dateMax: 'Doit être le {limit} ou avant',
    dateInvalid: 'Doit être une date valide ({format})',
  },
  words: '{count} / {limit} mots',
  localized: {
    completed: 'Doit être complété dans toutes les langues',
  },
  markdown: {
    bold: 'Gras',
    italic: 'Italique',
    heading: 'Titre',
    list: 'Liste',
    link: 'Lien',
    preview: 'Aperçu',
    edit: 'Éditer',
  },
  files: {
    upload: 'Téléverser',
    empty: 'Aucun fichier',
    missing: 'Au moins un fichier est requis',
    minItems: 'Doit contenir au moins {limit} fichiers',
    maxItems: 'Doit contenir au plus {limit} fichiers',
    uploadUrlMissing: "Aucune URL de téléversement n'est configurée",
    uploadFailed: 'Échec du téléversement : {message}',
    remove: 'Retirer',
    download: 'Télécharger',
  },
  radioMatrix: {
    allItemsSelected: 'Toutes les options doivent être sélectionnées',
  },
  images: {
    moveBefore: 'Déplacer avant',
    moveAfter: 'Déplacer après',
  },
  geo: {
    point: 'Point',
    linestring: 'Ligne',
    polygon: 'Polygone',
    locate: 'Ma position',
    clear: 'Effacer',
    latitude: 'Latitude',
    longitude: 'Longitude',
    points: '{count} points',
    locateError: "La position actuelle n'a pas pu être obtenue",
    loadError: "La carte n'a pas pu être chargée",
  },
}

export const messages: Record<string, FormMessages> = { en, fr }

export default messages

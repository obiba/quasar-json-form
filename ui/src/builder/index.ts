/**
 * Form builder: `@obiba/quasar-ui-json-form/builder`
 *
 * The `QJsonFormBuilder` component, and the model of a form under
 * construction (a tree of nodes bound to a JSON schema and to the
 * translations of the form) with its operations.
 */
import QJsonFormBuilder from './QJsonFormBuilder'

export { QJsonFormBuilder }
export { builderApi } from './api'
export { builderCatalog, matchItem, nodeIcon, itemKey, optionsSchema, rawOptions, keywordsSchema, choicesOf, expressionError, fieldNames, dropIndex, downloadText } from './items'
export type { BuilderCatalog } from './items'
export { recognize } from './BuilderImport'
export { parseCsv, translationsToCsv, mergeCsv } from './csv'
export type { CsvImport } from './csv'
export type { ImportedForm } from './BuilderImport'
export {
  fromDefinition, toDefinition, fromAsf,
  parseScope, toScope, isValidKey,
  locations, locate, findNode, descendants, listOf, containerOf, propertyIn, parentSchemaIn, propertySchema,
  isRequired, setRequired, uniqueKey,
} from './model'
export { addNode, removeNode, moveNode, canMove, duplicateNode, renameProperty, ruleReferences } from './operations'
export type { FormDefinition, FormModel, FormNode, NodeKind, NodeLocation, NodeTemplate, ModelDiagnostic, JsonObject } from './model'
export {
  textSlots, rawText, getText, setText, textKey, keyPrefix, isKnownKey,
  usedKeys, isMissing, missingTranslations, pruneTranslations, retargetKeys, renewKeys, collectKeys,
} from './texts'
export type { TextSlot } from './texts'

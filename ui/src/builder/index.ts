/**
 * Form builder: `@obiba/quasar-ui-json-form/builder`
 *
 * The model of a form under construction (a tree of nodes bound to a JSON
 * schema and to the translations of the form), and its operations.
 */
export {
  fromDefinition, toDefinition, fromAsf,
  parseScope, toScope, isValidKey,
  locations, locate, findNode, descendants, listOf, containerOf, propertyIn, parentSchemaIn, propertySchema,
  isRequired, setRequired, uniqueKey,
} from './model'
export { addNode, removeNode, moveNode, duplicateNode, renameProperty, ruleReferences } from './operations'
export type { FormDefinition, FormModel, FormNode, NodeKind, NodeLocation, NodeTemplate, ModelDiagnostic, JsonObject } from './model'
export {
  textSlots, rawText, getText, setText, textKey, keyPrefix, isKnownKey,
  usedKeys, missingTranslations, pruneTranslations, retargetKeys,
} from './texts'
export type { TextSlot } from './texts'

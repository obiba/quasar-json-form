/**
 * angular-schema-form compatibility layer: `@obiba/quasar-ui-json-form/asf`
 *
 * ```ts
 * import { convert } from '@obiba/quasar-ui-json-form/asf'
 * const { schema, uischema, diagnostics } = convert(asfSchema, asfDefinition, { translate: t })
 * ```
 */
export { convert, toJsonForms, isAsfDefinition } from './convert'
export type { AsfConvertOptions, AsfConvertResult, AsfDiagnostic } from './convert'
export { transpileCondition, ConditionError } from './condition'

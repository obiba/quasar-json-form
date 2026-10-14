/**
 * Amber forms compatibility layer: `@obiba/quasar-ui-json-form/amber`
 *
 * ```ts
 * import { convert } from '@obiba/quasar-ui-json-form/amber'
 * const { schema, uischema, translations, diagnostics } = convert(amberSchema)
 * ```
 */
export { convert, isAmberSchema, rewriteExpression } from './convert'
export type { AmberConvertOptions, AmberConvertResult, AmberDiagnostic } from './convert'

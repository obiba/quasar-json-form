/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, inject } from 'vue'
import { useJsonFormsControl } from '@jsonforms/vue'
import { hasEnableRule, isInherentlyEnabled } from '@jsonforms/core'

/**
 * `useJsonFormsControl` for the elements without a scope (layouts, groups,
 * labels, sections): the control is built from the renderer props, the form
 * config and readonly state, not from the JSON Forms core state that is
 * replaced on every data change of the form. It is therefore not recomputed,
 * and the element not rendered again, on each keystroke. Only an element with
 * a JSON Forms `ENABLE`/`DISABLE` rule depends on the data.
 */
export function useLayoutControl(props: any) {
  const jsonforms = inject<any>('jsonforms')
  if (!jsonforms) {
    throw new Error("'jsonforms' couldn't be injected. Are you within JSON Forms?")
  }
  const control = computed(() => {
    const uischema = props.uischema
    const schema = props.schema ?? jsonforms.core.schema
    const rootData = hasEnableRule(uischema) ? jsonforms.core.data : undefined
    return {
      ...props,
      schema,
      config: jsonforms.config,
      enabled: isInherentlyEnabled({ jsonforms }, props, uischema, schema, rootData, jsonforms.config),
      data: undefined,
      label: '',
      description: '',
      errors: '',
      required: false,
    }
  })
  return { control }
}

/** true when both objects have the same keys with identical values */
function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keys = Object.keys(a)
  return keys.length === Object.keys(b).length && keys.every((key) => Object.is(a[key], b[key]))
}

/**
 * `useJsonFormsControl` whose control keeps its previous value when none of
 * its entries changed: JSON Forms builds a new control on every data change
 * of the form, which rendered every control again on each keystroke.
 */
export function useControl(props: any) {
  const result = useJsonFormsControl(props)
  const control = computed<typeof result.control.value>((previous) => {
    const next = result.control.value
    return previous && shallowEqual(previous, next) ? previous : next
  })
  return { ...result, control }
}

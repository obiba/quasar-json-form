/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, computed, defineComponent, inject, toRaw } from 'vue'
import { rendererProps, UnknownRenderer } from '@jsonforms/vue'

/**
 * `DispatchRenderer` of JSON Forms for the children of the layouts: renders
 * an element with the renderer whose tester ranks highest.
 *
 * The JSON Forms one reads the core state, which is replaced on every data
 * change, and renders its child with dynamic slots, which Vue always renders
 * again: every element of the form was rendered again on each keystroke.
 * This one only depends on its props (the root schema is read without
 * tracking: a new root schema reaches the layouts as a new `schema` prop) and
 * renders without slots, so that an element whose props did not change is
 * not rendered again.
 */
export default defineComponent({
  name: 'QDispatchRenderer',
  props: rendererProps(),
  setup(props: any) {
    const jsonforms = inject<any>('jsonforms')
    if (!jsonforms) {
      throw new Error("'jsonforms' couldn't be injected. Are you within JSON Forms?")
    }

    const rootSchema = computed(() => {
      void props.schema
      return toRaw(jsonforms).core.schema
    })

    const renderer = computed(() => ({
      renderers: props.renderers || jsonforms.renderers,
      cells: props.cells || jsonforms.cells,
      schema: props.schema || rootSchema.value,
      uischema: props.uischema,
      path: props.path,
      enabled: props.enabled,
      config: jsonforms.config,
    }))

    const determinedRenderer = computed(() => {
      const { renderers, uischema, schema } = renderer.value
      const context = { rootSchema: rootSchema.value, config: props.config }
      // the first of the highest ranked, as lodash `maxBy` in JSON Forms
      let best: any
      let bestRank = -1
      for (const entry of renderers) {
        const rank = entry.tester(uischema, schema, context)
        if (rank > bestRank) {
          best = entry
          bestRank = rank
        }
      }
      return best ? best.renderer : UnknownRenderer
    })

    return () => h(determinedRenderer.value, renderer.value)
  },
})

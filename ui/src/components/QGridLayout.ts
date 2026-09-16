import { h, computed, defineComponent } from 'vue'
import { DispatchRenderer, rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { useQuasar } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { gridContainerStyle, gridCellStyle } from '../utils/grid'
import type { Breakpoint } from '../utils/grid'

/**
 * GridLayout renderer: a CSS grid container.
 *
 * `options` of the layout declare the grid (`columns`, `rows`, `areas`, `gap`,
 * `autoFlow`...), `options.grid` of each element declares its placement
 * (`column`, `row`, `colSpan`, `rowSpan`, `area`...). Every element is wrapped
 * in a `.q-grid-layout__cell` carrying the placement style, so that placement
 * works with any renderer. Values can be Quasar breakpoint maps, resolved
 * against `$q.screen` (see utils/grid.ts).
 */
export default defineComponent({
  name: 'QGridLayout',
  props: rendererProps(),
  setup(props: any) {
    const $q = useQuasar()

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const { isVisible, isEnabled, rootClass } = useControlProperties(control)

    const screen = computed<Breakpoint>(() => ($q?.screen?.name as Breakpoint) || 'xs')

    const elements = computed(() => {
      const uischema = props.uischema
      return uischema && Array.isArray(uischema.elements) ? uischema.elements : []
    })

    const containerStyle = computed(() => gridContainerStyle(props.uischema?.options, screen.value))

    return () => {
      if (!isVisible.value) {
        return null
      }

      return h('div', {
        class: ['q-grid-layout', rootClass.value],
        style: containerStyle.value,
      }, elements.value.map((element: any, index: number) =>
        h('div', {
          key: `${props.path}-${index}`,
          class: 'q-grid-layout__cell',
          style: gridCellStyle(element?.options?.grid, screen.value),
        }, [
          h(DispatchRenderer, {
            schema: props.schema,
            uischema: element,
            path: props.path,
            enabled: props.enabled !== false && isEnabled.value,
            visible: props.visible && isVisible.value,
            cells: props.cells,
            renderers: props.renderers,
            config: props.config,
          }),
        ])
      ))
    }
  },
})

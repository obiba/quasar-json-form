import { h, computed, defineComponent } from 'vue'
import { rendererProps } from '@jsonforms/vue'
import QDispatchRenderer from './QDispatchRenderer'
import { useControlProperties } from '../composables/useControlProperties'
import { useLayoutControl } from '../composables/useControl'

/**
 * VerticalLayout / HorizontalLayout renderer.
 *
 * Elements are rendered as direct children of the layout root so that
 * `options.class` can carry Quasar grid classes: a layout with
 * `options: { class: 'row q-col-gutter-md' }` containing layouts with
 * `options: { class: 'col-md-6' }` renders as a Quasar grid. When `row`,
 * `column` or `flex` is present in the class, the default flex stacking of the
 * layout is not applied (see QJsonForm.sass).
 */
export default defineComponent({
  name: 'QLayoutRenderer',
  props: rendererProps(),
  setup(props: any) {
    const controlResult = useLayoutControl(props)

    const control = controlResult.control

    const { isVisible, isEnabled, rootClass } = useControlProperties(control)

    const isHorizontal = computed(() => props.uischema?.type === 'HorizontalLayout')

    const elements = computed(() => {
      const uischema = props.uischema
      return uischema && Array.isArray(uischema.elements) ? uischema.elements : []
    })

    return () => {
      if (!isVisible.value) {
        return null
      }

      return h('div', {
        class: [isHorizontal.value ? 'q-horizontal-layout' : 'q-vertical-layout', rootClass.value],
      }, elements.value.map((element: any, index: number) =>
        h(QDispatchRenderer, {
          key: `${props.path}-${index}`,
          schema: props.schema,
          uischema: element,
          path: props.path,
          enabled: props.enabled !== false && isEnabled.value,
          visible: props.visible && isVisible.value,
          cells: props.cells,
          renderers: props.renderers,
          config: props.config,
        })
      ))
    }
  },
})

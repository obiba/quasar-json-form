import { h, watch, defineComponent, onMounted } from 'vue'
import type { VNode } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'


export default defineComponent({
  name: 'QComputedRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()
    
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, computeValue, rootClass, renderHeader, renderHint } = useControlProperties(control)

    onMounted(() => {
      // Initialize computed value on mount
      const computedVal = computeValue.value
      onChange(isVisible.value ? computedVal : undefined)
    })

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined)
        } else {
          // Recompute value when becoming visible
          const computedVal = computeValue.value
          onChange(computedVal)
        }
      },
    )

    watch(
      () => computeValue.value,
      (newValue) => {
        onChange(isVisible.value ? newValue : undefined)
      },
    )

    const onChange = (value: any) => {
      controlResult.handleChange(control.value.path, value)
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      const children: (VNode | null)[] = [...renderHeader()]

      // show computed value
      if (control.value.uischema.options?.show === true) {
        children.push(h('div', {
          class: 'q-computed-value q-pa-md q-mt-sm bg-grey-2 border-radius',
        }, computeValue.value !== undefined && computeValue.value !== null
          ? String(computeValue.value)
          : t('noValue')))
      }

      children.push(renderHint())

      return h('div', {
        class: ['q-computed-renderer', rootClass.value],
      }, children)
    }
  },
})

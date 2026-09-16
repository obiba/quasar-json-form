import { h, defineComponent } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { rankWith, isStringControl, optionIs, and } from '@jsonforms/core'
import type { ControlElement, JsonFormsRendererRegistryEntry } from '@jsonforms/core'
import { QColor } from 'quasar'
import { useControlProperties, omitOptions } from 'ui'

/** A string control with `options.format: "color"`, edited with a QColor palette. */
const QColorRenderer = defineComponent({
  name: 'QColorRenderer',
  props: rendererProps<ControlElement>(),
  setup (props) {
    const { control, handleChange } = useJsonFormsControl(props)
    const { isVisible, isEnabled, isReadonly, rootClass, hasError, errorMessage, options, renderHeader, renderHint } =
      useControlProperties(control)

    const onChange = (value: string | null) => handleChange(control.value.path, value ?? undefined)

    // the palette view of QColor does not mark the selected swatch: preview it
    const renderPreview = () => {
      const value = control.value.data as string | undefined
      return h('div', { class: 'row items-center q-gutter-x-sm q-mb-xs' }, [
        h('div', {
          class: 'rounded-borders',
          style: `width: 24px; height: 24px; border: 1px solid rgba(128, 128, 128, 0.5); background: ${value ?? 'transparent'}`,
        }),
        h('span', { class: value ? 'text-body2' : 'text-body2 text-grey-6' }, value ?? '—'),
      ])
    }

    return () => {
      if (!isVisible.value) return null
      return h('div', { class: ['q-color-renderer q-mt-md', rootClass.value] }, [
        ...renderHeader(),
        renderPreview(),
        h(QColor, {
          ...omitOptions(options.value),
          modelValue: control.value.data ?? null,
          'onUpdate:modelValue': onChange,
          disable: !isEnabled.value,
          readonly: isReadonly.value,
          noHeader: true,
          noFooter: true,
          defaultView: 'palette',
          style: 'max-width: 250px',
        }),
        hasError.value
          ? h('div', { class: 'q-form-error text-caption text-negative' }, errorMessage.value)
          : renderHint(),
      ])
    }
  },
})

/** The entry for the `renderers` prop: rank 4 beats the string renderer (3). */
export const colorRenderer: JsonFormsRendererRegistryEntry = {
  renderer: QColorRenderer,
  tester: rankWith(4, and(isStringControl, optionIs('format', 'color'))),
}

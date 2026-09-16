import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { rankWith, isStringControl, optionIs, and } from '@jsonforms/core'
import { mountForm, flush } from './utils'
import { useControlProperties } from '../src/composables/useControlProperties'

const ColorRenderer = defineComponent({
  name: 'ColorRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { control, handleChange } = useJsonFormsControl(props)
    const { isVisible, renderHeader } = useControlProperties(control)
    return () => (isVisible.value
      ? h('div', { class: 'color-renderer' }, [
        ...renderHeader(),
        h('input', { type: 'color', value: control.value.data, onInput: (e: Event) => handleChange(control.value.path, (e.target as HTMLInputElement).value) }),
      ])
      : null)
  },
})

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    color: { type: 'string', title: 'Color', rules: { visible: 'name != "plain"' } },
  },
}
const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/name' },
    { type: 'Control', scope: '#/properties/color', options: { format: 'color' } },
  ],
}

describe('renderers prop', () => {
  it('renders a control with an application renderer', async () => {
    const renderers = [{ renderer: ColorRenderer, tester: rankWith(4, and(isStringControl, optionIs('format', 'color'))) }]
    const wrapper = mountForm({ modelValue: { name: 'x', color: '#112233' }, schema, uischema, renderers })
    await flush()
    const input = wrapper.find('.color-renderer input')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('#112233')
    expect(wrapper.find('.color-renderer .q-form-title').text()).toBe('Color')
    // the name control is still rendered by the library
    expect(wrapper.findAll('.q-string-renderer, .q-field').length).toBeGreaterThan(0)

    await input.setValue('#445566')
    await flush()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1]![0]).toEqual({ name: 'x', color: '#445566' })
    wrapper.unmount()
  })

  it('falls back to the built-in renderer without the entry', async () => {
    const wrapper = mountForm({ modelValue: {}, schema, uischema })
    await flush()
    expect(wrapper.find('.color-renderer').exists()).toBe(false)
    expect(wrapper.findAll('.q-field').length).toBe(2)
    wrapper.unmount()
  })

  it('wins a tie with a built-in renderer', async () => {
    const renderers = [{ renderer: ColorRenderer, tester: rankWith(3, and(isStringControl, optionIs('format', 'color'))) }]
    const wrapper = mountForm({ modelValue: {}, schema, uischema, renderers })
    await flush()
    expect(wrapper.find('.color-renderer').exists()).toBe(true)
    wrapper.unmount()
  })

  it('evaluates the rules through useControlProperties', async () => {
    const renderers = [{ renderer: ColorRenderer, tester: rankWith(4, and(isStringControl, optionIs('format', 'color'))) }]
    const wrapper = mountForm({ modelValue: { name: 'plain' }, schema, uischema, renderers })
    await flush()
    expect(wrapper.find('.color-renderer').exists()).toBe(false)
    wrapper.unmount()
  })
})

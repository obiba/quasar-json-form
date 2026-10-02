import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, isReactive, reactive, toRaw } from 'vue'
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

describe('tester ranks', () => {
  it('are not computed again on a data change, and testers get raw schemas', async () => {
    const tester = vi.fn((uischema: any, schema: any) => {
      expect(isReactive(uischema) || isReactive(schema)).toBe(false)
      return -1
    })
    const wrapper = mountForm({ modelValue: { name: 'x' }, schema: reactive(schema), uischema: reactive(uischema), renderers: [{ renderer: ColorRenderer, tester }] })
    await flush()
    const calls = tester.mock.calls.length
    expect(calls).toBeGreaterThan(0)

    await wrapper.setProps({ modelValue: { name: 'y' } })
    await wrapper.find('input').setValue('z')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(tester.mock.calls.length).toBe(calls)
    wrapper.unmount()
  })

  it('leave the caller schemas reactive and follow their in-place changes', async () => {
    const state = reactive({ schema: structuredClone(schema), uischema: structuredClone(uischema) })
    const renderers = [{ renderer: ColorRenderer, tester: rankWith(4, and(isStringControl, optionIs('format', 'color'))) }]
    const wrapper = mountForm({ modelValue: { name: 'x' }, schema: state.schema, uischema: state.uischema, renderers })
    await flush()
    expect(wrapper.findAll('.color-renderer')).toHaveLength(1)
    expect(isReactive(state.schema) && isReactive(state.uischema)).toBe(true)
    expect(isReactive(reactive(toRaw(state.schema)))).toBe(true)

    state.uischema.elements[0].options = { format: 'color' }
    await flush()
    expect(wrapper.findAll('.color-renderer')).toHaveLength(2)
    wrapper.unmount()
  })

  it('follow an in-place change of a schema without UI schema', async () => {
    const reactiveSchema = reactive(structuredClone(schema)) as any
    const wrapper = mountForm({ modelValue: {}, schema: reactiveSchema })
    await flush()
    const inputs = wrapper.findAll('input').length
    reactiveSchema.properties.age = { type: 'string', title: 'Age' }
    await flush()
    expect(wrapper.findAll('input').length).toBeGreaterThan(inputs)
    wrapper.unmount()
  })
})

import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const schema = {
  type: 'object',
  properties: {
    a: { type: 'number', title: 'A' },
    b: { type: 'number', title: 'B' },
    show: { type: 'boolean' },
    total: { type: 'number', title: 'Total', description: 'Sum of **A** and B', format: 'computed', rules: { compute: 'a + b' } },
  },
}

const control = (options: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/a' },
    { type: 'Control', scope: '#/properties/b' },
    { type: 'Control', scope: '#/properties/show' },
    { type: 'Control', scope: '#/properties/total', options, ...extra },
  ],
})

describe('computed renderer', () => {
  it('computes the value on mount and follows the data', async () => {
    const wrapper = mountForm({ schema, uischema: control(), modelValue: { a: 1, b: 2 } })
    await flush()
    expect(lastData(wrapper).total).toBe(3)
    await wrapper.setProps({ modelValue: { a: 5, b: 2, total: 3 } })
    await flush()
    expect(lastData(wrapper).total).toBe(7)
    wrapper.unmount()
  })

  it('renders the label and the markdown description, and the value with the show option', async () => {
    const wrapper = mountForm({ schema, uischema: control({ show: true }), modelValue: { a: 1, b: 2 } })
    await flush()
    const renderer = wrapper.find('.q-computed-renderer')
    expect(renderer.exists()).toBe(true)
    expect(renderer.find('.text-bold').text()).toBe('Total')
    expect(renderer.find('.text-grey-7').html()).toContain('<strong>A</strong>')
    expect(renderer.find('.q-computed-value').text()).toBe('3')
    wrapper.unmount()
  })

  it('hides the value without the show option and uses custom classes', async () => {
    const wrapper = mountForm({
      schema,
      uischema: control({ class: 'my-computed' }, { labelClass: 'lbl', descriptionClass: 'desc' }),
      modelValue: { a: 1, b: 2 },
    })
    await flush()
    const renderer = wrapper.find('.q-computed-renderer')
    expect(renderer.classes()).toContain('my-computed')
    expect(renderer.find('.lbl').text()).toBe('Total')
    expect(renderer.find('.desc').exists()).toBe(true)
    expect(renderer.find('.q-computed-value').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows the no value placeholder when the rule yields nothing', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { v: { type: 'string', format: 'computed', rules: { compute: 'missing' } } } },
      uischema: { type: 'Control', scope: '#/properties/v', options: { show: true } },
      modelValue: {},
    }, { messages: { en: { noValue: 'nothing' } } })
    await flush()
    expect(wrapper.find('.q-computed-value').text()).toBe('nothing')
    wrapper.unmount()
  })

  it('clears the value when hidden and recomputes when shown again', async () => {
    const uischema = control({}, { rules: { visible: 'truthy(show)' } })
    const wrapper = mountForm({ schema, uischema, modelValue: { a: 1, b: 2, show: true } })
    await flush()
    expect(lastData(wrapper).total).toBe(3)
    await wrapper.setProps({ modelValue: { a: 1, b: 2, show: false, total: 3 } })
    await flush()
    expect(wrapper.find('.q-computed-renderer').exists()).toBe(false)
    expect(lastData(wrapper).total).toBeUndefined()
    await wrapper.setProps({ modelValue: { a: 4, b: 2, show: true } })
    await flush()
    expect(lastData(wrapper).total).toBe(6)
    wrapper.unmount()
  })

  it('starts hidden without touching the data', async () => {
    const uischema = control({}, { rules: { visible: 'truthy(show)' } })
    const wrapper = mountForm({ schema, uischema, modelValue: { a: 1, b: 2, show: false } })
    await flush()
    expect(wrapper.find('.q-computed-renderer').exists()).toBe(false)
    const emitted = wrapper.emitted('update:modelValue') || []
    emitted.forEach((event) => expect((event[0] as any).total).toBeUndefined())
    wrapper.unmount()
  })
})

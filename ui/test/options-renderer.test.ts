import { describe, it, expect, vi } from 'vitest'
import { mountForm, flush } from './utils'

const schema = {
  type: 'object',
  properties: {
    tags: {
      type: 'array',
      minItems: 2,
      uniqueItems: true,
      items: { type: 'string', enum: ['a', 'b', 'c'] },
    },
    color: { type: 'string', enum: ['red', 'blue'] },
  },
  required: ['color'],
}
const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/tags', options: { format: 'checkbox' } },
    { type: 'Control', scope: '#/properties/color', options: { format: 'radio' } },
  ],
}

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

describe('options renderer', () => {
  it('renders a checkbox group with an array model from the first render and sets it in the data', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mountForm({ schema, uischema, modelValue: {} })
    await flush()
    expect(wrapper.findAll('.q-checkbox').length).toBe(3)
    expect(wrapper.findAll('.q-radio').length).toBe(2)
    expect(error.mock.calls.filter((c) => String(c[0]).includes('q-option-group'))).toEqual([])
    expect(lastData(wrapper).tags).toEqual([])
    error.mockRestore()
    wrapper.unmount()
  })

  it('displays the validation errors under the options', async () => {
    const wrapper = mountForm({ schema, uischema, modelValue: { tags: ['a'] } })
    await flush()
    const messages = wrapper.findAll('.q-options-renderer .text-negative').map((e) => e.text())
    expect(messages.length).toBe(2)
    expect(messages[0]).toContain('2')
    expect(messages[1]!.length).toBeGreaterThan(0)
    await wrapper.setProps({ modelValue: { tags: ['a', 'b'], color: 'red' } })
    await flush()
    expect(wrapper.findAll('.q-options-renderer .text-negative').length).toBe(0)
    wrapper.unmount()
  })
})

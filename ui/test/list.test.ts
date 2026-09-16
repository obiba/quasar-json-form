import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'

describe('QListRenderer', () => {
  it('renders arrays of primitives with one control per item and the add label option', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { tags: { type: 'array', title: 'Tags', items: { type: 'string' } } } },
      uischema: { type: 'Control', scope: '#/properties/tags', options: { addLabel: 'New tag' } },
      modelValue: { tags: ['a', 'b'] },
    })
    await flush()
    const list = wrapper.find('.q-list-renderer')
    expect(list.exists()).toBe(true)
    const inputs = list.findAll('input')
    expect(inputs.length).toBe(2)
    expect((inputs[0]!.element as HTMLInputElement).value).toBe('a')
    expect(list.text()).toContain('New tag')
    await inputs[1]!.setValue('c')
    await flush()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1]![0]).toEqual({ tags: ['a', 'c'] })
    wrapper.unmount()
  })

  it('renders arrays of localized strings through the item uischema', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { names: { type: 'array', items: { type: 'object', format: 'localizedString' } } } },
      uischema: { type: 'Control', scope: '#/properties/names', options: { items: { type: 'Control', scope: '#', label: false } } },
      modelValue: { names: [{ en: 'One' }] },
      languages: ['en'],
    })
    await flush()
    const input = wrapper.find('.q-list-renderer input')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('One')
    wrapper.unmount()
  })
})

describe('QListRenderer bounds', () => {
  it('reads maxItems and minItems from the schema', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { tags: { type: 'array', minItems: 1, maxItems: 2, items: { type: 'string' } } } },
      uischema: { type: 'Control', scope: '#/properties/tags' },
      modelValue: { tags: ['a', 'b'] },
    })
    await flush()
    const buttons = wrapper.findAll('.q-list-renderer button')
    const add = buttons[buttons.length - 1]!
    expect(add.attributes('disabled')).toBeDefined()
    await wrapper.setProps({ modelValue: { tags: ['a'] } })
    await flush()
    const after = wrapper.findAll('.q-list-renderer button')
    expect(after[after.length - 1]!.attributes('disabled')).toBeUndefined()
    // one item left: it cannot be removed
    expect(after[0]!.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})

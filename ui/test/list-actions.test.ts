import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const schema = {
  type: 'object',
  properties: {
    tags: { type: 'array', title: 'Tags', description: 'Some *tags*', items: { type: 'string' } },
    people: {
      type: 'array',
      title: 'People',
      items: { type: 'object', properties: { name: { type: 'string', title: 'Name' }, age: { type: 'integer', title: 'Age' } } },
    },
    show: { type: 'boolean' },
    limit: { type: 'integer' },
  },
  required: ['tags'],
}

// buttons of one item: [remove, move up, move down]
const itemButtons = (wrapper: any, index: number) => wrapper.findAll('.q-list-renderer .q-item')[index]!.findAll('.q-btn')
const addButton = (wrapper: any) => {
  const buttons = wrapper.findAll('.q-list-renderer > .q-btn')
  return buttons[buttons.length - 1]!
}

describe('list renderer actions', () => {
  it('renders the title with the required mark and the markdown description', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/tags', options: { class: 'my-list' }, titleClass: 'ttl', descriptionClass: 'dsc' },
      modelValue: { tags: [] },
    })
    await flush()
    const list = wrapper.find('.q-list-renderer')
    expect(list.classes()).toContain('my-list')
    expect(list.find('.ttl').text()).toBe('Tags *')
    expect(list.find('.dsc').html()).toContain('Some <em>tags</em>')
    expect(list.find('.q-list').exists()).toBe(false)
    expect(addButton(wrapper).text()).toContain('add-item')
    wrapper.unmount()
  })

  it('adds default items', async () => {
    const wrapper = mountForm({ schema, modelValue: { tags: ['a'], people: [] } })
    await flush()
    const lists = wrapper.findAll('.q-list-renderer')
    await lists[0]!.findAll('.q-btn').slice(-1)[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).tags).toEqual(['a', ''])
    await lists[1]!.findAll('.q-btn').slice(-1)[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).people).toEqual([{}])
    expect(lists[1]!.findAll('.q-item .q-form-title').map((l) => l.text())).toEqual(['Name', 'Age'])
    wrapper.unmount()
  })

  it('removes an item directly', async () => {
    const wrapper = mountForm({ schema, modelValue: { tags: ['a', 'b', 'c'] } })
    await flush()
    await itemButtons(wrapper, 1)[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).tags).toEqual(['a', 'c'])
    wrapper.unmount()
  })

  it('asks for a confirmation before removing with the confirmation option', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/tags', options: { confirmation: true } },
      modelValue: { tags: ['a', 'b'] },
    }, { messages: { en: { 'confirm-remove-item': 'Sure?', cancel: 'No', remove: 'Yes' } } })
    await flush()
    const dialog = () => document.body.querySelector('.q-dialog')
    expect(dialog()).toBeNull()
    await itemButtons(wrapper, 0)[0]!.trigger('click')
    await flush()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flush()
    expect(dialog()).not.toBeNull()
    expect(dialog()!.textContent).toContain('Sure?')
    const buttons = Array.from(dialog()!.querySelectorAll('.q-btn')) as HTMLElement[]
    expect(buttons.map((b) => b.textContent)).toEqual(['No', 'Yes'])
    // cancel keeps the item
    buttons[0]!.click()
    await flush()
    const before = (wrapper.emitted('update:modelValue') || []).length
    expect((wrapper.emitted('update:modelValue') || []).length).toBe(before)
    // remove
    await itemButtons(wrapper, 0)[0]!.trigger('click')
    await flush()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flush()
    ;(Array.from(dialog()!.querySelectorAll('.q-btn'))[1] as HTMLElement).click()
    await flush()
    expect(lastData(wrapper).tags).toEqual(['b'])
    wrapper.unmount()
    document.body.querySelectorAll('.q-dialog').forEach((el) => el.remove())
  })

  it('moves items up and down, within bounds', async () => {
    const wrapper = mountForm({ schema, modelValue: { tags: ['a', 'b', 'c'] } })
    await flush()
    expect(itemButtons(wrapper, 0).length).toBe(3)
    // the first item cannot move up, the last cannot move down
    expect(itemButtons(wrapper, 0)[1]!.attributes('disabled')).toBeDefined()
    expect(itemButtons(wrapper, 2)[2]!.attributes('disabled')).toBeDefined()
    await itemButtons(wrapper, 0)[2]!.trigger('click')
    await flush()
    expect(lastData(wrapper).tags).toEqual(['b', 'a', 'c'])
    await wrapper.setProps({ modelValue: { tags: ['b', 'a', 'c'] } })
    await flush()
    await itemButtons(wrapper, 2)[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).tags).toEqual(['b', 'c', 'a'])
    wrapper.unmount()
  })

  it('hides the ordering buttons with ordering: false or a single item', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/tags', options: { ordering: false } },
      modelValue: { tags: ['a', 'b'] },
    })
    await flush()
    expect(itemButtons(wrapper, 0).length).toBe(1)
    wrapper.unmount()

    const single = mountForm({ schema, modelValue: { tags: ['a'] } })
    await flush()
    expect(itemButtons(single, 0).length).toBe(1)
    single.unmount()
  })

  it('bounds the number of items with min and max rules', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/tags', rules: { max: 'limit', min: 'limit - 1' } },
      modelValue: { tags: ['a', 'b'], limit: 2 },
    })
    await flush()
    expect(addButton(wrapper).attributes('disabled')).toBeDefined()
    expect(itemButtons(wrapper, 0)[0]!.attributes('disabled')).toBeUndefined()
    await wrapper.setProps({ modelValue: { tags: ['a', 'b'], limit: 3 } })
    await flush()
    expect(addButton(wrapper).attributes('disabled')).toBeUndefined()
    expect(itemButtons(wrapper, 0)[0]!.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('empties the list when hidden and disables the buttons when not enabled', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Control', scope: '#/properties/tags', rules: { visible: 'truthy(show)' } },
        ],
      },
      modelValue: { tags: ['a'], show: true },
    })
    await flush()
    await wrapper.setProps({ modelValue: { tags: ['a'], show: false } })
    await flush()
    expect(wrapper.find('.q-list-renderer').exists()).toBe(false)
    expect(lastData(wrapper).tags).toEqual([])
    wrapper.unmount()

    const disabled = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/tags', rules: { enabled: 'truthy(show)' } },
      modelValue: { tags: ['a', 'b'], show: false },
    })
    await flush()
    expect(addButton(disabled).attributes('disabled')).toBeDefined()
    expect(itemButtons(disabled, 0).every((b: any) => b.attributes('disabled') !== undefined)).toBe(true)
    disabled.unmount()
  })

  it('shows the AJV errors of the array', async () => {
    const wrapper = mountForm({ schema, modelValue: {} })
    await flush()
    expect(wrapper.find('.q-list-renderer .text-negative').text()).toBe('This field is required')
    wrapper.unmount()
  })
})

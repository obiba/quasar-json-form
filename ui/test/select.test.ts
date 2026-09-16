import { describe, it, expect } from 'vitest'
import { QSelect, QToggle } from 'quasar'
import { mountForm, flush } from './utils'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

describe('select renderer', () => {
  const schema = {
    type: 'object',
    properties: {
      color: { type: 'string', title: 'Color', description: 'Pick one', enum: ['red', 'blue'] },
      size: {
        type: 'string',
        title: 'Size',
        oneOf: [
          { const: 's', title: 'Small' },
          { const: 'l', title: 'Large', rules: { visible: 'truthy(big)' } },
        ],
      },
      tags: { type: 'array', title: 'Tags', uniqueItems: true, items: { type: 'string', enum: ['x', 'y', 'z'] } },
      kinds: {
        type: 'array',
        title: 'Kinds',
        uniqueItems: true,
        items: { oneOf: [{ const: 'a', title: 'A' }, { const: 'b', title: 'B', rules: { visible: 'truthy(big)' } }] },
      },
      big: { type: 'boolean' },
    },
    required: ['color'],
  }

  const selectOf = (wrapper: any, index: number) => wrapper.findAllComponents(QSelect)[index]!

  it('renders enum and oneOf options with translated labels', async () => {
    const wrapper = mountForm({ schema, modelValue: { color: 'red', size: 's', big: true } }, { messages: { en: { red: 'Red' } } })
    await flush()
    const color = selectOf(wrapper, 0)
    expect(color.props('options')).toEqual([{ label: 'Red', value: 'red' }, { label: 'blue', value: 'blue' }])
    expect(color.props('clearable')).toBe(false)
    expect(color.props('multiple')).toBe(false)
    expect(color.find('.q-field__label').exists()).toBe(false)
    expect(color.find('.q-field__native').text()).toBe('Red')
    const renderer = color.element.parentElement!
    expect(renderer.querySelector('.q-form-title')!.textContent).toBe('Color *')
    expect(renderer.querySelector('.q-form-description')!.textContent).toBe('Pick one')
    const size = selectOf(wrapper, 1)
    expect(size.props('options')).toEqual([{ label: 'Small', value: 's' }, { label: 'Large', value: 'l' }])
    expect(size.props('clearable')).toBe(true)
    wrapper.unmount()
  })

  it('renders multiple selects for unique arrays of enum or oneOf items', async () => {
    const wrapper = mountForm({ schema, modelValue: { tags: ['x', 'z'], kinds: ['a'], big: false } })
    await flush()
    const tags = selectOf(wrapper, 2)
    expect(tags.props('multiple')).toBe(true)
    expect(tags.props('options')).toEqual([{ label: 'x', value: 'x' }, { label: 'y', value: 'y' }, { label: 'z', value: 'z' }])
    expect(tags.find('.q-field__native').text()).toBe('x, z')
    const kinds = selectOf(wrapper, 3)
    expect(kinds.props('options')).toEqual([{ label: 'A', value: 'a' }])
    wrapper.unmount()
  })

  it('stores the selection and drops a cleared one', async () => {
    const wrapper = mountForm({ schema, modelValue: { color: 'red' } })
    await flush()
    selectOf(wrapper, 0).vm.$emit('update:modelValue', 'blue')
    await flush()
    expect(lastData(wrapper).color).toBe('blue')
    selectOf(wrapper, 1).vm.$emit('update:modelValue', 's')
    await flush()
    expect(lastData(wrapper).size).toBe('s')
    selectOf(wrapper, 1).vm.$emit('update:modelValue', null)
    await flush()
    expect(lastData(wrapper).size).toBeUndefined()
    wrapper.unmount()
  })

  it('clears a selection that is no longer among the visible options', async () => {
    const wrapper = mountForm({ schema, modelValue: { color: 'red', size: 'l', kinds: ['a', 'b'], big: true } })
    await flush()
    expect(lastData(wrapper).size).toBe('l')
    await wrapper.setProps({ modelValue: { color: 'red', size: 'l', kinds: ['a', 'b'], big: false } })
    await flush()
    const data = lastData(wrapper)
    expect(data.size).toBeUndefined()
    expect(data.kinds).toEqual([])
    wrapper.unmount()
  })

  it('does not clear an invalid selection read-only', async () => {
    const wrapper = mountForm({ schema, readonly: true, modelValue: { color: 'red', size: 'l', big: true } })
    await flush()
    await wrapper.setProps({ modelValue: { color: 'red', size: 'l', big: false } })
    await flush()
    const emitted = wrapper.emitted('update:modelValue') || []
    emitted.forEach((event) => expect((event[0] as any).size).toBe('l'))
    expect(selectOf(wrapper, 0).props('readonly')).toBe(true)
    wrapper.unmount()
  })

  it('is disabled by an enabled rule and clears its value when hidden', async () => {
    const uischema = (rules: Record<string, string>) => ({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/big' },
        { type: 'Control', scope: '#/properties/color', rules },
      ],
    })
    const disabled = mountForm({ schema, uischema: uischema({ enabled: 'truthy(big)' }), modelValue: { color: 'red', big: false } })
    await flush()
    expect(disabled.findComponent(QSelect).props('disable')).toBe(true)
    disabled.unmount()

    const wrapper = mountForm({ schema, uischema: uischema({ visible: 'truthy(big)' }), modelValue: { color: 'red', big: true } })
    await flush()
    await wrapper.setProps({ modelValue: { color: 'red', big: false } })
    await flush()
    expect(wrapper.findComponent(QSelect).exists()).toBe(false)
    expect(lastData(wrapper).color).toBeUndefined()
    wrapper.unmount()
  })
})

describe('options renderer (radio / checkbox)', () => {
  const schema = {
    type: 'object',
    properties: {
      color: { type: 'string', title: 'Color', description: 'Pick one', enum: ['red', 'blue'] },
      tags: { type: 'array', title: 'Tags', uniqueItems: true, items: { type: 'string', enum: ['x', 'y'] } },
      show: { type: 'boolean' },
    },
  }

  it('renders radios for a single enum with the title and description', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/color', options: { format: 'radio', class: 'my-options' } },
      modelValue: { color: 'red' },
    })
    await flush()
    const renderer = wrapper.find('.q-options-renderer')
    expect(renderer.classes()).toContain('my-options')
    expect(renderer.find('.q-form-title').text()).toBe('Color')
    expect(renderer.find('.q-form-description').text()).toBe('Pick one')
    const radios = renderer.findAll('.q-radio')
    expect(radios.length).toBe(2)
    await radios[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).color).toBe('blue')
    wrapper.unmount()
  })

  it('renders checkboxes or toggles for a unique array and keeps the value an array', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/tags', options: { format: 'checkbox' } },
      modelValue: {},
    })
    await flush()
    // a missing value is initialized to an empty array
    expect(lastData(wrapper).tags).toEqual([])
    const boxes = wrapper.findAll('.q-checkbox')
    expect(boxes.length).toBe(2)
    await boxes[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).tags).toEqual(['x'])
    // a non-array value set from outside is reset
    await wrapper.setProps({ modelValue: { tags: 'x' } })
    await flush()
    expect(lastData(wrapper).tags).toEqual([])
    wrapper.unmount()

    const toggles = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/tags', options: { format: 'toggle' } },
      modelValue: { tags: ['y'] },
    })
    await flush()
    expect(toggles.findAll('.q-toggle').length).toBe(2)
    toggles.unmount()
  })

  it('clears the value when hidden', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Control', scope: '#/properties/color', options: { format: 'radio' }, rules: { visible: 'truthy(show)' } },
        ],
      },
      modelValue: { color: 'red', show: true },
    })
    await flush()
    await wrapper.setProps({ modelValue: { color: 'red', show: false } })
    await flush()
    expect(wrapper.find('.q-options-renderer').exists()).toBe(false)
    expect(lastData(wrapper).color).toBeUndefined()
    wrapper.unmount()
  })
})

describe('toggle renderer', () => {
  const schema = {
    type: 'object',
    properties: {
      agree: { type: 'boolean', title: 'Agree', description: 'Terms' },
      show: { type: 'boolean' },
    },
    required: ['agree'],
  }

  it('renders the title with the required mark, the description, the label on the toggle and the hint', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/agree', label: 'Yes', hint: 'toggle.hint', options: { class: 'my-toggle' } },
      modelValue: { agree: false },
    }, { messages: { en: { toggle: { hint: 'Please agree' } } } })
    await flush()
    const toggle = wrapper.find('.q-toggle')
    expect(toggle.find('.q-toggle__label').text()).toBe('Yes')
    const root = toggle.element.parentElement!
    expect(root.classList.contains('my-toggle')).toBe(true)
    expect(Array.from(root.children).map((e) => e.className.split(' ')[0])).toEqual(['q-form-title', 'q-form-description', 'q-toggle', 'q-form-hint'])
    expect(root.querySelector('.q-form-title')!.textContent).toBe('Agree *')
    expect(root.querySelector('.q-form-description')!.textContent).toBe('Terms')
    expect(root.querySelector('.q-form-hint')!.textContent).toBe('Please agree')
    await toggle.trigger('click')
    await flush()
    expect(lastData(wrapper).agree).toBe(true)
    wrapper.unmount()
  })

  it('is disabled by an enabled rule and clears its value when hidden', async () => {
    const disabled = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/agree', rules: { enabled: 'truthy(show)' } },
      modelValue: { agree: true, show: false },
    })
    await flush()
    expect(disabled.findComponent(QToggle).props('disable')).toBe(true)
    disabled.unmount()

    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Control', scope: '#/properties/agree', rules: { visible: 'truthy(show)' } },
        ],
      },
      modelValue: { agree: true, show: true },
    })
    await flush()
    await wrapper.setProps({ modelValue: { agree: true, show: false } })
    await flush()
    expect(wrapper.findAll('.q-toggle').length).toBe(1)
    expect(lastData(wrapper).agree).toBeUndefined()
    wrapper.unmount()
  })
})

describe('number renderer', () => {
  const schema = {
    type: 'object',
    properties: {
      age: { type: 'integer', title: 'Age', description: 'Years' },
      ratio: { type: 'number', title: 'Ratio' },
      show: { type: 'boolean' },
    },
  }

  it('renders number inputs and stores numbers', async () => {
    const wrapper = mountForm({ schema, modelValue: { age: 20 } })
    await flush()
    const fields = wrapper.findAll('.q-field')
    expect(fields[0]!.find('input').attributes('type')).toBe('number')
    expect(fields[0]!.element.parentElement!.querySelector('.q-form-description')!.textContent).toBe('Years')
    await fields[1]!.find('input').setValue('1.5')
    await flush()
    expect(lastData(wrapper).ratio).toBe(1.5)
    wrapper.unmount()
  })

  it('is disabled by an enabled rule and clears its value when hidden', async () => {
    const disabled = mountForm({
      schema,
      uischema: { type: 'Control', scope: '#/properties/age', rules: { enabled: 'truthy(show)' } },
      modelValue: { age: 1, show: false },
    })
    await flush()
    expect(disabled.find('.q-field').classes()).toContain('q-field--disabled')
    disabled.unmount()

    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Control', scope: '#/properties/age', rules: { visible: 'truthy(show)' } },
        ],
      },
      modelValue: { age: 1, show: true },
    })
    await flush()
    await wrapper.setProps({ modelValue: { age: 1, show: false } })
    await flush()
    expect(wrapper.find('.q-field').exists()).toBe(false)
    expect(lastData(wrapper).age).toBeUndefined()
    wrapper.unmount()
  })
})

describe('typeahead renderer', () => {
  const schema = {
    type: 'object',
    properties: {
      role: { type: 'string', format: 'typeahead', title: 'Role', description: 'Your role', examples: ['analyst', 'investigator'] },
      kind: { type: 'string', format: 'typeahead', title: 'Kind', enum: ['one', 'two'] },
      show: { type: 'boolean' },
    },
    required: ['role'],
  }

  const filter = async (select: any, needle: string) => {
    select.vm.$emit('filter', needle, (fn: () => void) => fn(), () => {})
    await flush()
  }

  it('filters the suggestions on the typed text', async () => {
    const wrapper = mountForm({ schema, modelValue: { role: 'analyst' } })
    await flush()
    const select = wrapper.findComponent(QSelect)
    expect(select.props('options')).toEqual([{ label: 'analyst', value: 'analyst' }, { label: 'investigator', value: 'investigator' }])
    expect(select.props('clearable')).toBe(false)
    expect(select.props('newValueMode')).toBeUndefined()
    expect(select.element.parentElement!.querySelector('.q-form-description')!.textContent).toBe('Your role')
    await filter(select, 'INV')
    expect(select.props('options')).toEqual([{ label: 'investigator', value: 'investigator' }])
    await filter(select, '')
    expect(select.props('options').length).toBe(2)
    wrapper.unmount()
  })

  it('accepts enum values, option objects with key or name, and free text when editable', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/kind', options: { editable: true, class: 'my-typeahead' } },
          { type: 'Control', scope: '#/properties/role', options: { values: [{ key: 'k', name: 'Key name' }, { const: 'c', title: 'Const title' }, null, 'plain'] } },
        ],
      },
      modelValue: {},
    })
    await flush()
    const kind = wrapper.findAllComponents(QSelect)[0]!
    expect(kind.props('options')).toEqual([{ label: 'one', value: 'one' }, { label: 'two', value: 'two' }])
    expect(kind.props('newValueMode')).toBe('add-unique')
    expect(kind.props('clearable')).toBe(true)
    expect(kind.classes()).toContain('q-typeahead')
    expect(kind.element.parentElement!.classList.contains('my-typeahead')).toBe(true)
    const role = wrapper.findAllComponents(QSelect)[1]!
    expect(role.props('options')).toEqual([
      { label: 'Key name', value: 'k' },
      { label: 'Const title', value: 'c' },
      { label: 'plain', value: 'plain' },
    ])
    role.vm.$emit('update:modelValue', 'c')
    await flush()
    expect(lastData(wrapper).role).toBe('c')
    role.vm.$emit('update:modelValue', '')
    await flush()
    expect(lastData(wrapper).role).toBeUndefined()
    wrapper.unmount()
  })

  it('has no suggestions without a source and clears its value when hidden', async () => {
    const none = mountForm({
      schema: { type: 'object', properties: { free: { type: 'string', format: 'typeahead' } } },
      modelValue: {},
    })
    await flush()
    expect(none.findComponent(QSelect).props('options')).toEqual([])
    none.unmount()

    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Control', scope: '#/properties/role', rules: { visible: 'truthy(show)' } },
        ],
      },
      modelValue: { role: 'analyst', show: true },
    })
    await flush()
    await wrapper.setProps({ modelValue: { role: 'analyst', show: false } })
    await flush()
    expect(wrapper.findComponent(QSelect).exists()).toBe(false)
    expect(lastData(wrapper).role).toBeUndefined()
    wrapper.unmount()
  })

  it('renders read-only without clear button', async () => {
    const wrapper = mountForm({ schema, readonly: true, modelValue: { kind: 'one' } })
    await flush()
    const kind = wrapper.findAllComponents(QSelect)[1]!
    expect(kind.props('readonly')).toBe(true)
    expect(kind.props('clearable')).toBe(false)
    wrapper.unmount()
  })
})

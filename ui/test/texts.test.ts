import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'

// title and description above the control, label inside the input, hint under it
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name', description: 'Your *full* name', minLength: 2 },
    color: { type: 'string', title: 'Color', label: 'Pick', enum: ['red', 'blue'] },
    show: { type: 'boolean' },
  },
  required: ['name'],
}

const control = (scope: string, extra: Record<string, unknown> = {}) => ({ type: 'Control', scope: `#/properties/${scope}`, ...extra })

describe('control texts', () => {
  it('renders the title with the required mark and the description above, the label inside and the hint under the input', async () => {
    const wrapper = mountForm({
      schema,
      uischema: control('name', { label: 'Full name', hint: 'First **and** last', titleClass: 'ttl', descriptionClass: 'dsc', hintClass: 'hnt' }),
      modelValue: { name: 'Ada' },
    })
    await flush()
    const renderer = wrapper.find('.q-string-renderer')
    expect(Array.from(renderer.element.children).map((e) => e.className.split(' ')[0])).toEqual(['q-form-title', 'q-form-description', 'q-field'])
    expect(renderer.find('.q-form-title.ttl').text()).toBe('Name *')
    expect(renderer.find('.q-form-description.dsc').html()).toContain('Your <em>full</em> name')
    expect(renderer.find('.q-field__label').text()).toBe('Full name')
    expect(renderer.find('.q-field__messages .q-form-hint.hnt').html()).toContain('First <strong>and</strong> last')
    wrapper.unmount()
  })

  it('reads the texts from the element before the schema and marks the label when there is no title', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'VerticalLayout', elements: [control('name', { title: 'Who?', description: 'Really' }), control('color', { label: false })] },
      modelValue: { name: 'Ada' },
    })
    await flush()
    const name = wrapper.find('.q-string-renderer')
    expect(name.find('.q-form-title').text()).toBe('Who? *')
    expect(name.find('.q-form-description').text()).toBe('Really')
    // no label on the element or the schema: no floating label
    expect(name.find('.q-field__label').exists()).toBe(false)
    // label: false hides the title; the schema label is the input label
    const color = wrapper.find('.q-select-renderer')
    expect(color.find('.q-form-title').exists()).toBe(false)
    expect(color.find('.q-field__label').text()).toBe('Pick')
    wrapper.unmount()

    const required = mountForm({
      schema: { ...schema, required: ['color'] },
      uischema: control('color', { label: false }),
      modelValue: { color: 'red' },
    })
    await flush()
    expect(required.find('.q-field__label').text()).toBe('Pick *')
    required.unmount()
  })

  it('replaces the hint with the error messages', async () => {
    const wrapper = mountForm({ schema, uischema: control('name', { hint: 'Two letters at least' }), modelValue: { name: 'A' } })
    await flush()
    const messages = wrapper.find('.q-field__messages')
    expect(messages.text()).toBe('Must be at least 2 characters long')
    expect(messages.find('.q-form-hint').exists()).toBe(false)
    await wrapper.setProps({ modelValue: { name: 'Ada' } })
    await flush()
    expect(wrapper.find('.q-field__messages .q-form-hint').text()).toBe('Two letters at least')
    wrapper.unmount()
  })

  it('translates the texts', async () => {
    const wrapper = mountForm(
      { schema, uischema: control('name', { label: 'name.label', hint: 'name.hint' }), modelValue: { name: 'Ada' } },
      { messages: { en: { Name: 'Full name', name: { label: 'Type it', hint: 'As on your ID' } } } },
    )
    await flush()
    expect(wrapper.find('.q-form-title').text()).toBe('Full name *')
    expect(wrapper.find('.q-field__label').text()).toBe('Type it')
    expect(wrapper.find('.q-form-hint').text()).toBe('As on your ID')
    wrapper.unmount()
  })
})

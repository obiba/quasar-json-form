import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name' },
    birth: { type: 'string', format: 'date', title: 'Birth' },
    color: { type: 'string', enum: ['red', 'blue'], title: 'Color' },
    gated: { type: 'string', title: 'Gated', rules: { enabled: 'name == "open"' } },
    flag: { type: 'boolean', title: 'Flag' },
    choice: { type: 'string', title: 'Choice', enum: ['a', 'b'] },
    items: {
      type: 'array',
      title: 'Items',
      items: { type: 'object', properties: { label: { type: 'string' } } },
    },
  },
}

describe('readonly', () => {
  it('renders inputs read-only, not disabled', async () => {
    const wrapper = mountForm({ schema, modelValue: { name: 'x', birth: '2020-01-01', color: 'red', items: [{ label: 'a' }] }, readonly: true })
    await flush()
    const fields = wrapper.findAll('.q-field')
    expect(fields.length).toBeGreaterThan(0)
    for (const field of fields) {
      expect(field.classes()).toContain('q-field--readonly')
      expect(field.classes()).not.toContain('q-field--disabled')
    }
    expect(wrapper.find('input').attributes('readonly')).toBeDefined()
    wrapper.unmount()
  })

  it('hides the date picker and the list buttons', async () => {
    const wrapper = mountForm({ schema, modelValue: { birth: '2020-01-01', items: [{ label: 'a' }, { label: 'b' }] }, readonly: true })
    await flush()
    expect(wrapper.find('.q-field__append .q-icon.cursor-pointer').exists()).toBe(false)
    expect(wrapper.find('.q-list-renderer .q-btn').exists()).toBe(false)
    expect(wrapper.findAll('.q-list-renderer .q-item').length).toBe(2)
    wrapper.unmount()
  })

  it('shows the date picker and the list buttons when editable', async () => {
    const wrapper = mountForm({ schema, modelValue: { birth: '2020-01-01', items: [{ label: 'a' }] } })
    await flush()
    expect(wrapper.find('.q-field__append .q-icon.cursor-pointer').exists()).toBe(true)
    expect(wrapper.find('.q-list-renderer .q-btn').exists()).toBe(true)
    wrapper.unmount()
  })

  it('supports control-level readonly options', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/name', options: { readonly: true } },
          { type: 'Control', scope: '#/properties/color' },
        ],
      },
      modelValue: { name: 'x' },
    })
    await flush()
    const fields = wrapper.findAll('.q-field')
    expect(fields[0]!.classes()).toContain('q-field--readonly')
    expect(fields[1]!.classes()).not.toContain('q-field--readonly')
    wrapper.unmount()
  })

  it('cannot be undone by control options when the form is read-only', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/name', options: { readonly: false, disable: false } },
          { type: 'Control', scope: '#/properties/color', options: { readonly: false } },
          { type: 'Control', scope: '#/properties/birth', options: { readonly: false } },
        ],
      },
      modelValue: { name: 'x', color: 'red', birth: '2020-01-01' },
      readonly: true,
    })
    await flush()
    for (const field of wrapper.findAll('.q-field')) {
      expect(field.classes()).toContain('q-field--readonly')
    }
    wrapper.unmount()
  })

  it('keeps toggles and option groups non-interactive read-only', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/flag' },
          { type: 'Control', scope: '#/properties/choice', options: { format: 'radio' } },
        ],
      },
      modelValue: { flag: true, choice: 'a' },
      readonly: true,
    })
    await flush()
    const toggle = wrapper.find('.q-toggle')
    expect(toggle.classes()).toContain('q-form-readonly')
    expect(toggle.classes()).not.toContain('disabled')
    await toggle.trigger('click')
    await flush()
    const radios = wrapper.findAll('.q-radio')
    expect(wrapper.find('.q-option-group').classes()).toContain('q-form-readonly')
    await radios[1]!.trigger('click')
    await flush()
    const emitted = wrapper.emitted('update:modelValue')!
    const data = emitted[emitted.length - 1]![0] as any
    expect(data.flag).toBe(true)
    expect(data.choice).toBe('a')
    wrapper.unmount()
  })

  it('disables (not read-only) a control whose enabled rule is false', async () => {
    const wrapper = mountForm({ schema, modelValue: { name: 'closed' } })
    await flush()
    const gated = wrapper.findAll('.q-field')[3]!
    expect(gated.classes()).toContain('q-field--disabled')
    expect(gated.classes()).not.toContain('q-field--readonly')
    wrapper.unmount()
  })
})

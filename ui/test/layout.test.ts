import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'

const schema = {
  type: 'object',
  properties: {
    a: { type: 'string', title: 'A' },
    b: { type: 'string', title: 'B' },
    c: { type: 'string', title: 'C' },
    show: { type: 'boolean' },
  },
}

describe('layouts', () => {
  it('renders vertical and horizontal layouts with default classes', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'HorizontalLayout', elements: [{ type: 'Control', scope: '#/properties/a' }, { type: 'Control', scope: '#/properties/b' }] },
          { type: 'Control', scope: '#/properties/c' },
        ],
      },
    })
    await flush()
    const root = wrapper.find('.json-form-wrapper > .q-vertical-layout')
    expect(root.exists()).toBe(true)
    const horizontal = root.find(':scope > .q-horizontal-layout')
    expect(horizontal.exists()).toBe(true)
    // elements are direct children of the layout root (no item wrapper)
    expect(horizontal.findAll(':scope > .q-string-renderer').length).toBe(2)
    expect(root.findAll(':scope > .q-string-renderer').length).toBe(1)
    wrapper.unmount()
  })

  it('applies options.class to layouts, groups and controls (grid use case)', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        options: { class: 'row q-col-gutter-md' },
        elements: [
          { type: 'VerticalLayout', options: { class: 'col-md-6' }, elements: [{ type: 'Control', scope: '#/properties/a' }] },
          { type: 'Group', label: 'G', options: { class: 'col-md-6' }, elements: [{ type: 'Control', scope: '#/properties/b' }] },
          { type: 'Control', scope: '#/properties/c', options: { class: 'col-12' } },
        ],
      },
    })
    await flush()
    const root = wrapper.find('.json-form-wrapper > .q-vertical-layout')
    expect(root.classes()).toEqual(expect.arrayContaining(['q-vertical-layout', 'row', 'q-col-gutter-md']))
    expect(root.find(':scope > .q-vertical-layout.col-md-6').exists()).toBe(true)
    expect(root.find(':scope > .q-group-renderer.col-md-6').exists()).toBe(true)
    expect(root.find(':scope > .q-string-renderer.col-12').exists()).toBe(true)
    wrapper.unmount()
  })

  it('applies options.class to labels and sections', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Label', text: 'Hello', options: { class: 'text-h6' } },
          { type: 'Section', label: 'S', options: { class: 'q-mt-md' } },
        ],
      },
    })
    await flush()
    expect(wrapper.find('.q-label-renderer.text-h6').exists()).toBe(true)
    expect(wrapper.find('.q-section-renderer.q-mt-md').exists()).toBe(true)
    wrapper.unmount()
  })

  it('evaluates visibility rules on layouts', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'HorizontalLayout', rules: { visible: 'show' }, elements: [{ type: 'Control', scope: '#/properties/a' }] },
        ],
      },
      modelValue: { show: false },
    })
    await flush()
    expect(wrapper.find('.q-horizontal-layout').exists()).toBe(false)
    await wrapper.setProps({ modelValue: { show: true } })
    await flush()
    expect(wrapper.find('.q-horizontal-layout').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('Group label and hidden control titles', () => {
  it('renders the JSON Forms label of a Group', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { a: { type: 'string' } } },
      uischema: { type: 'Group', label: 'Address', elements: [{ type: 'Control', scope: '#/properties/a' }] },
    })
    await flush()
    expect(wrapper.find('.q-group-renderer .q-form-title').text()).toBe('Address')
    wrapper.unmount()
  })

  it('hides the title of an option group with label: false', async () => {
    const schema = { type: 'object', properties: { g: { type: 'string', title: 'Gender', enum: ['m', 'f'] } } }
    const wrapper = mountForm({ schema, uischema: { type: 'Control', scope: '#/properties/g', label: false, options: { format: 'radio' } } })
    await flush()
    expect(wrapper.find('.q-options-renderer').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Gender')
    wrapper.unmount()
  })
})

describe('conditional layouts and labels', () => {
  it('do not clear the form data when hidden', async () => {
    const schema = { type: 'object', properties: { show: { type: 'boolean' }, a: { type: 'string' }, b: { type: 'string' } } }
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Label', text: 'Hidden label', rules: { visible: 'truthy(show)' } },
          { type: 'Section', label: 'Hidden section', rules: { visible: 'truthy(show)' } },
          { type: 'Group', label: 'Hidden group', rules: { visible: 'truthy(show)' }, elements: [{ type: 'Control', scope: '#/properties/a' }] },
          { type: 'Control', scope: '#/properties/b' },
        ],
      },
      modelValue: { show: true, a: 'A', b: 'B' },
    })
    await flush()
    expect(wrapper.find('.q-group-renderer').exists()).toBe(true)
    await wrapper.setProps({ modelValue: { show: false, a: 'A', b: 'B' } })
    await flush()
    expect(wrapper.find('.q-group-renderer').exists()).toBe(false)
    expect(wrapper.find('.q-section-renderer').exists()).toBe(false)
    const emitted = wrapper.emitted('update:modelValue') || []
    emitted.forEach((event) => expect(event[0]).toMatchObject({ b: 'B' }))
    wrapper.unmount()
  })
})

describe('label: false on input-like controls', () => {
  it('hides the title of a toggle', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { b: { type: 'boolean', title: 'Agree' } } },
      uischema: { type: 'Control', scope: '#/properties/b', label: false },
    })
    await flush()
    expect(wrapper.find('.q-toggle').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Agree')
    wrapper.unmount()
  })
})

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
    expect(horizontal.findAll(':scope > .q-field').length).toBe(2)
    expect(root.findAll(':scope > .q-field').length).toBe(1)
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
    expect(root.find(':scope > .q-field.col-12').exists()).toBe(true)
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

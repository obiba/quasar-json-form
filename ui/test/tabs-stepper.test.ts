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

const elements = [
  { type: 'Control', scope: '#/properties/a' },
  { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/b' }] },
  { type: 'Control', scope: '#/properties/c' },
]

const labelOf = (wrapper: any) => wrapper.find('.q-field__label').text()

describe('tabs layout', () => {
  it('renders one tab per element with the given labels and shows the first panel', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'TabsLayout', labels: ['tab.first', 'Second', 'Third'], labelClass: 'my-tab', elements },
      modelValue: { a: 'x' },
    }, { messages: { en: { tab: { first: 'First' } } } })
    await flush()
    const tabs = wrapper.findAll('.q-tab')
    expect(tabs.map((t) => t.text())).toEqual(['First', 'Second', 'Third'])
    expect(tabs[0]!.classes()).toContain('my-tab')
    expect(tabs[0]!.classes()).toContain('q-tab--active')
    expect(wrapper.findAll('.q-tab-panel').length).toBe(1)
    expect(labelOf(wrapper)).toBe('A')
    wrapper.unmount()
  })

  it('switches panels on click', async () => {
    const wrapper = mountForm({ schema, uischema: { type: 'TabsLayout', elements }, modelValue: {} })
    await flush()
    // default labels are the element numbers
    expect(wrapper.findAll('.q-tab').map((t) => t.text())).toEqual(['1', '2', '3'])
    await wrapper.findAll('.q-tab')[1]!.trigger('click')
    await flush()
    expect(labelOf(wrapper)).toBe('B')
    await wrapper.findAll('.q-tab')[2]!.trigger('click')
    await flush()
    expect(labelOf(wrapper)).toBe('C')
    wrapper.unmount()
  })

  it('renders a JSON Forms Categorization with the category labels', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'Categorization',
        elements: [
          { type: 'Category', label: 'Personal', elements: [{ type: 'Control', scope: '#/properties/a' }] },
          { type: 'Category', elements: [{ type: 'Control', scope: '#/properties/b' }] },
        ],
      },
      modelValue: {},
    })
    await flush()
    expect(wrapper.findAll('.q-tab').map((t) => t.text())).toEqual(['Personal', 'Category'])
    expect(labelOf(wrapper)).toBe('A')
    await wrapper.findAll('.q-tab')[1]!.trigger('click')
    await flush()
    expect(labelOf(wrapper)).toBe('B')
    wrapper.unmount()
  })

  it('renders nothing without elements and follows a visibility rule', async () => {
    const empty = mountForm({ schema, uischema: { type: 'TabsLayout' }, modelValue: {} })
    await flush()
    expect(empty.findAll('.q-tab').length).toBe(0)
    empty.unmount()

    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'TabsLayout', rules: { visible: 'truthy(show)' }, elements },
        ],
      },
      modelValue: { show: false },
    })
    await flush()
    expect(wrapper.find('.q-tabs').exists()).toBe(false)
    await wrapper.setProps({ modelValue: { show: true } })
    await flush()
    expect(wrapper.find('.q-tabs').exists()).toBe(true)
    wrapper.unmount()
  })

  it('propagates the enabled state to the controls of the panels', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'TabsLayout', rules: { enabled: 'truthy(show)' }, elements },
      modelValue: { show: false },
    })
    await flush()
    expect(wrapper.find('.q-field').classes()).toContain('q-field--disabled')
    wrapper.unmount()
  })
})

describe('stepper layout', () => {
  it('renders the steps with labels and icons and navigates with the buttons', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'StepperLayout', labels: ['One', 'Two', 'Three'], icons: ['a', 'b', 'c'], labelClass: 'my-stepper', elements },
      modelValue: {},
    }, { messages: { en: { continue: 'Next', back: 'Previous' } } })
    await flush()
    const stepper = wrapper.find('.q-stepper')
    expect(stepper.classes()).toContain('my-stepper')
    expect(wrapper.findAll('.q-stepper__tab').map((t) => t.find('.q-stepper__title').text())).toEqual(['One', 'Two', 'Three'])
    expect(wrapper.findAll('.q-stepper__tab')[0]!.classes()).toContain('q-stepper__tab--active')
    expect(labelOf(wrapper)).toBe('A')
    const buttons = () => wrapper.findAll('.q-stepper__nav .q-btn')
    // first step: continue only
    expect(buttons().map((b) => b.text())).toEqual(['Next'])
    await buttons()[0]!.trigger('click')
    await flush()
    expect(labelOf(wrapper)).toBe('B')
    expect(buttons().map((b) => b.text())).toEqual(['Next', 'Previous'])
    await buttons()[0]!.trigger('click')
    await flush()
    expect(labelOf(wrapper)).toBe('C')
    // last step: back only
    expect(buttons().map((b) => b.text())).toEqual(['Previous'])
    await buttons()[0]!.trigger('click')
    await flush()
    expect(labelOf(wrapper)).toBe('B')
    wrapper.unmount()
  })

  it('numbers the steps by default and ignores a mismatched icon list', async () => {
    const wrapper = mountForm({ schema, uischema: { type: 'StepperLayout', icons: ['a'], elements }, modelValue: {} })
    await flush()
    expect(wrapper.findAll('.q-stepper__tab').map((t) => t.find('.q-stepper__title').text())).toEqual(['1', '2', '3'])
    expect(wrapper.findAll('.q-stepper__tab .q-icon').every((i) => i.text() !== 'a')).toBe(true)
    // the default navigation labels are the i18n keys
    expect(wrapper.findAll('.q-stepper__nav .q-btn').map((b) => b.text())).toEqual(['continue'])
    wrapper.unmount()
  })

  it('propagates the enabled state to the controls of the steps', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'StepperLayout', rules: { enabled: 'truthy(show)' }, elements },
      modelValue: { show: false },
    })
    await flush()
    expect(wrapper.find('.q-field').classes()).toContain('q-field--disabled')
    wrapper.unmount()
  })
})

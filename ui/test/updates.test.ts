/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import QJsonForm from '../src/components/QJsonForm'
import { createTestI18n, flush } from './utils'

const schema = {
  type: 'object',
  description: 'Root description',
  properties: {
    a: { type: 'string', title: 'A' },
    b: { type: 'string', title: 'B' },
    c: { type: 'string', title: 'C' },
  },
}
const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/a' },
    {
      type: 'Group',
      label: 'Group',
      elements: [
        { type: 'Label', text: 'Some **label**' },
        { type: 'VerticalLayout', options: { class: 'q-mb-md' }, elements: [{ type: 'Control', scope: '#/properties/b' }] },
      ],
    },
    {
      type: 'VerticalLayout',
      rule: { effect: 'DISABLE', condition: { scope: '#/properties/a', schema: { const: 'off' } } },
      elements: [{ type: 'Control', scope: '#/properties/c' }],
    },
  ],
}

describe('updates on a data change', () => {
  it('render again only the elements that changed', async () => {
    const updates: Record<string, number> = {}
    let wrapper: any = null
    wrapper = mount(QJsonForm as any, {
      props: {
        schema,
        uischema,
        modelValue: {},
        'onUpdate:modelValue': (value: any) => wrapper?.setProps({ modelValue: value }),
      },
      global: {
        plugins: [Quasar, createTestI18n()],
        mixins: [{ beforeUpdate(this: any) { updates[this.$options.name] = (updates[this.$options.name] || 0) + 1 } }],
      },
      attachTo: document.body,
    })
    await flush()
    // a group or a section does not display the description of the schema it is given
    expect(wrapper.text()).not.toContain('Root description')
    Object.keys(updates).forEach((name) => delete updates[name])

    await wrapper.findAll('input')[0].setValue('x')
    await flush()
    expect(updates.QStringRenderer).toBe(1)
    expect(updates.QGroupRenderer).toBeUndefined()
    expect(updates.QLabelRenderer).toBeUndefined()
    // the root layout only, rendered again by the JSON Forms dispatcher
    expect(updates.QLayoutRenderer).toBe(1)

    // a JSON Forms rule of a layout still follows the data
    expect(wrapper.findAll('input')[2].attributes('disabled')).toBeUndefined()
    await wrapper.findAll('input')[0].setValue('off')
    await flush()
    expect(wrapper.findAll('input')[2].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})

import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'

const schema = {
  type: 'object',
  properties: {
    access: {
      type: 'object',
      format: 'radioGroupCollection',
      title: 'Access',
      values: [{ key: 'yes', caption: 'Yes' }, { key: 'no', caption: 'No' }],
      items: [{ key: 'data', name: 'Data' }, { key: 'bio', name: 'Bio *samples*' }],
    },
  },
  required: ['access'],
}

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

describe('radio matrix', () => {
  it('renders items as rows and values as radio columns', async () => {
    const wrapper = mountForm({ schema, modelValue: {} })
    await flush()
    const table = wrapper.find('.q-radio-matrix')
    expect(table.findAll('thead th').map((th) => th.text())).toEqual(['', 'Yes', 'No'])
    const rows = table.findAll('tbody tr')
    expect(rows.length).toBe(2)
    expect(rows[1]!.find('td').html()).toContain('Bio <em>samples</em>')
    expect(table.findAll('.q-radio').length).toBe(4)
    expect(wrapper.find('.text-label').text()).toBe('Access *')
    wrapper.unmount()
  })

  it('stores the selected value per item and requires every item', async () => {
    const wrapper = mountForm({ schema, modelValue: {} })
    await flush()
    expect(wrapper.text()).not.toContain('All options must be selected')
    await wrapper.findAll('.q-radio')[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).access).toEqual({ data: 'yes' })
    expect(wrapper.find('.q-radio-matrix-renderer .text-negative').text()).toBe('All options must be selected')
    await wrapper.findAll('.q-radio')[3]!.trigger('click')
    await flush()
    expect(lastData(wrapper).access).toEqual({ data: 'yes', bio: 'no' })
    expect(wrapper.find('.q-radio-matrix-renderer .text-negative').exists()).toBe(false)
    wrapper.unmount()
  })

  it('flags an existing empty object of a required matrix', async () => {
    const wrapper = mountForm({ schema, modelValue: { access: {} } })
    await flush()
    expect(wrapper.find('.q-radio-matrix-renderer .text-negative').text()).toBe('All options must be selected')
    wrapper.unmount()
  })

  it('reads values and items from the control options', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { m: { type: 'object', format: 'radio-matrix' } } },
      uischema: {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/m', options: { values: { a: 'A', b: 'B' }, items: [{ key: 'x', name: 'X' }] } }],
      },
      modelValue: {},
    })
    await flush()
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['', 'A', 'B'])
    expect(wrapper.findAll('.q-radio').length).toBe(2)
    wrapper.unmount()
  })

  it('shows the selection read-only', async () => {
    const wrapper = mountForm({ schema, readonly: true, modelValue: { access: { data: 'no' } } })
    await flush()
    expect(wrapper.findAll('.q-radio').length).toBe(0)
    const cells = wrapper.findAll('tbody tr')[0]!.findAll('td')
    expect(cells[1]!.find('.q-icon').exists()).toBe(false)
    expect(cells[2]!.find('.q-icon').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders checkboxes in checkbox mode', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/access', options: { checkboxMode: true } }] },
      modelValue: { access: { data: false } },
    })
    await flush()
    expect(wrapper.find('thead').exists()).toBe(false)
    expect(wrapper.findAll('.q-checkbox').length).toBe(2)
    expect(wrapper.find('.q-radio-matrix-renderer .text-negative').text()).toBe('All options must be selected')
    await wrapper.findAll('.q-checkbox')[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).access).toEqual({ data: true })
    expect(wrapper.find('.q-radio-matrix-renderer .text-negative').exists()).toBe(false)
    wrapper.unmount()
  })
})

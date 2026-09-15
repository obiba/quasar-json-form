import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import QJsonForm from '../src/components/QJsonForm'
import { flush } from './utils'

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 'Name', description: 'Your name' },
    color: { type: 'string', title: 'Color', enum: ['red', 'blue'] },
  },
  required: ['name'],
}

// vue-i18n is not registered: only Quasar
function mountWithoutI18n(props: Record<string, unknown>) {
  return mount(QJsonForm as any, { props, global: { plugins: [Quasar] }, attachTo: document.body })
}

describe('without vue-i18n', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders labels and options as-is and the default validation messages', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mountWithoutI18n({ schema, modelValue: {} })
    await flush()
    const fields = wrapper.findAll('.q-field')
    expect(fields[0]!.find('.q-field__label').text()).toBe('Name *')
    expect(fields[0]!.find('.q-field__messages').text()).toBe('This field is required')
    expect(fields[1]!.find('.q-field__label').text()).toBe('Color')
    expect(warn).toHaveBeenCalled()
    wrapper.unmount()

    // the warning is emitted once, not per renderer
    const calls = warn.mock.calls.length
    const again = mountWithoutI18n({ schema, modelValue: { name: 'x' } })
    await flush()
    expect(warn.mock.calls.length).toBe(calls)
    again.unmount()
  })
})

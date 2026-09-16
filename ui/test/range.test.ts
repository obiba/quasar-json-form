import { describe, it, expect } from 'vitest'
import { QRange } from 'quasar'
import { mountForm, flush } from './utils'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const schema = {
  type: 'object',
  properties: {
    ages: {
      type: 'object',
      title: 'Ages',
      description: 'Youngest and oldest',
      properties: {
        min: { type: 'integer', minimum: 0 },
        max: { type: 'integer', maximum: 100 },
      },
    },
    show: { type: 'boolean' },
  },
  required: ['ages'],
}

const uischema = (extra: Record<string, unknown> = {}) => ({
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/show' },
    { type: 'Control', scope: '#/properties/ages', options: { format: 'range', min: 0, max: 100, step: 5, class: 'my-range' }, hint: 'drag both', ...extra },
  ],
})

describe('range renderer', () => {
  it('renders the title with the required mark, the description and the hint', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(), modelValue: { ages: { min: 20, max: 60 } } })
    await flush()
    const range = wrapper.find('.q-range')
    expect(range.exists()).toBe(true)
    const root = range.element.parentElement!
    expect(root.classList.contains('my-range')).toBe(true)
    expect(root.querySelector('.q-form-title')!.textContent).toBe('Ages *')
    expect(root.querySelector('.q-form-description')!.textContent).toBe('Youngest and oldest')
    expect(root.querySelector('.q-form-hint')!.textContent).toBe('drag both')
    const props = wrapper.findComponent(QRange).props()
    expect(props.max).toBe(100)
    expect(props.step).toBe(5)
    expect(props.modelValue).toEqual({ min: 20, max: 60 })
    wrapper.unmount()
  })

  it('stores both ends as numbers', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(), modelValue: { ages: { min: 20, max: 60 } } })
    await flush()
    wrapper.findComponent(QRange).vm.$emit('update:modelValue', { min: '25', max: 70 })
    await flush()
    expect(lastData(wrapper).ages).toEqual({ min: 25, max: 70 })
    wrapper.findComponent(QRange).vm.$emit('update:modelValue', { min: null, max: null })
    await flush()
    expect(lastData(wrapper).ages).toBeUndefined()
    wrapper.unmount()
  })

  it('accepts a missing value and shows the errors instead of the hint', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(), modelValue: {} })
    await flush()
    expect(wrapper.findComponent(QRange).props('modelValue')).toEqual({ min: null, max: null })
    const root = wrapper.find('.q-range').element.parentElement!
    expect(root.querySelector('.q-form-error')!.textContent).toBe('This field is required')
    expect(root.querySelector('.q-form-hint')).toBeNull()
    wrapper.unmount()
  })

  it('is read-only or disabled and clears its value when hidden', async () => {
    const readonly = mountForm({ schema, uischema: uischema(), modelValue: { ages: { min: 20, max: 60 } }, readonly: true })
    await flush()
    expect(readonly.findComponent(QRange).props('readonly')).toBe(true)
    expect(readonly.findComponent(QRange).props('disable')).toBe(false)
    readonly.unmount()

    const disabled = mountForm({ schema, uischema: uischema({ rules: { enabled: 'truthy(show)' } }), modelValue: { ages: { min: 20, max: 60 }, show: false } })
    await flush()
    expect(disabled.findComponent(QRange).props('disable')).toBe(true)
    disabled.unmount()

    const wrapper = mountForm({ schema, uischema: uischema({ rules: { visible: 'truthy(show)' } }), modelValue: { ages: { min: 20, max: 60 }, show: true } })
    await flush()
    await wrapper.setProps({ modelValue: { ages: { min: 20, max: 60 }, show: false } })
    await flush()
    expect(wrapper.find('.q-range').exists()).toBe(false)
    expect(lastData(wrapper).ages).toBeUndefined()
    wrapper.unmount()
  })
})

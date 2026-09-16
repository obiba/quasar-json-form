import { describe, it, expect } from 'vitest'
import { QRating, QSlider } from 'quasar'
import { mountForm, flush } from './utils'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const schema = {
  type: 'object',
  properties: {
    stars: { type: 'integer', title: 'Stars', description: 'How many', minimum: 2 },
    level: { type: 'integer', title: 'Level', description: 'How much', maximum: 5 },
    show: { type: 'boolean' },
  },
  required: ['stars'],
}

const uischema = (starsExtra: Record<string, unknown> = {}, levelExtra: Record<string, unknown> = {}) => ({
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/show' },
    { type: 'Control', scope: '#/properties/stars', options: { format: 'rating', max: 4, class: 'my-rating' }, hint: 'rate it', ...starsExtra },
    { type: 'Control', scope: '#/properties/level', options: { format: 'slider', min: 0, max: 10, class: 'my-slider' }, hint: 'slide it', ...levelExtra },
  ],
})

describe('rating renderer', () => {
  it('renders the title with the required mark, the description and the hint', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(), modelValue: { stars: 3 } })
    await flush()
    const rating = wrapper.find('.q-rating')
    expect(rating.exists()).toBe(true)
    const root = rating.element.parentElement!
    expect(root.classList.contains('my-rating')).toBe(true)
    expect(root.querySelector('.q-form-title')!.textContent).toBe('Stars *')
    expect(root.querySelector('.q-form-description')!.textContent).toBe('How many')
    expect(root.querySelector('.q-form-hint')!.textContent).toBe('rate it')
    expect(rating.findAll('.q-rating__icon-container').length).toBe(4)
    expect(rating.classes()).toContain('q-rating--editable')
    wrapper.unmount()
  })

  it('stores the clicked value as a number', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(), modelValue: { stars: 3 } })
    await flush()
    await wrapper.findAll('.q-rating__icon-container')[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).stars).toBe(2)
    wrapper.findComponent(QRating).vm.$emit('update:modelValue', '4')
    await flush()
    expect(lastData(wrapper).stars).toBe(4)
    wrapper.unmount()
  })

  it('is read-only or disabled and clears its value when hidden', async () => {
    const readonly = mountForm({ schema, uischema: uischema(), modelValue: { stars: 3 }, readonly: true })
    await flush()
    expect(readonly.findComponent(QRating).props('readonly')).toBe(true)
    expect(readonly.find('.q-rating').classes()).not.toContain('q-rating--editable')
    expect(readonly.find('.q-rating').classes()).not.toContain('disabled')
    readonly.unmount()

    const disabled = mountForm({ schema, uischema: uischema({ rules: { enabled: 'truthy(show)' } }), modelValue: { stars: 3, show: false } })
    await flush()
    expect(disabled.find('.q-rating').classes()).toContain('disabled')
    disabled.unmount()

    const wrapper = mountForm({ schema, uischema: uischema({ rules: { visible: 'truthy(show)' } }), modelValue: { stars: 3, show: true } })
    await flush()
    await wrapper.setProps({ modelValue: { stars: 3, show: false } })
    await flush()
    expect(wrapper.find('.q-rating').exists()).toBe(false)
    expect(lastData(wrapper).stars).toBeUndefined()
    wrapper.unmount()
  })
})

describe('slider renderer', () => {
  it('renders the title, description and hint', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(), modelValue: { level: 3 } })
    await flush()
    const slider = wrapper.find('.q-slider')
    expect(slider.exists()).toBe(true)
    const root = slider.element.parentElement!
    expect(root.classList.contains('my-slider')).toBe(true)
    expect(root.querySelector('.q-form-title')!.textContent).toBe('Level')
    expect(root.querySelector('.q-form-description')!.textContent).toBe('How much')
    expect(root.querySelector('.q-form-hint')!.textContent).toBe('slide it')
    expect(wrapper.findComponent(QSlider).props('max')).toBe(10)
    wrapper.unmount()
  })

  it('stores the value as a number and shows the errors instead of the hint', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(), modelValue: { level: 3 } })
    await flush()
    wrapper.findComponent(QSlider).vm.$emit('update:modelValue', 7)
    await flush()
    expect(lastData(wrapper).level).toBe(7)
    expect(wrapper.find('.q-slider').element.parentElement!.querySelector('.q-form-error')!.textContent).toBe('Must be less than or equal to 5')
    expect(wrapper.find('.q-slider').element.parentElement!.querySelector('.q-form-hint')).toBeNull()
    wrapper.unmount()
  })

  it('is read-only or disabled and clears its value when hidden', async () => {
    const readonly = mountForm({ schema, uischema: uischema(), modelValue: { level: 3 }, readonly: true })
    await flush()
    expect(readonly.findComponent(QSlider).props('readonly')).toBe(true)
    expect(readonly.findComponent(QSlider).props('disable')).toBe(false)
    readonly.unmount()

    const disabled = mountForm({ schema, uischema: uischema({}, { rules: { enabled: 'truthy(show)' } }), modelValue: { level: 3, show: false } })
    await flush()
    expect(disabled.findComponent(QSlider).props('disable')).toBe(true)
    disabled.unmount()

    const wrapper = mountForm({ schema, uischema: uischema({}, { rules: { visible: 'truthy(show)' } }), modelValue: { level: 3, show: true } })
    await flush()
    await wrapper.setProps({ modelValue: { level: 3, show: false } })
    await flush()
    expect(wrapper.find('.q-slider').exists()).toBe(false)
    expect(lastData(wrapper).level).toBeUndefined()
    wrapper.unmount()
  })
})

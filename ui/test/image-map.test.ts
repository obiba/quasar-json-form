import { describe, it, expect } from 'vitest'
import { QSelect } from 'quasar'
import { mountForm, flush } from './utils'
import { parseArea } from '../src/components/QImageMapRenderer'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const IMAGE = { src: 'img/plan.png', width: 600, height: 400 }

const entries = [
  { const: 'kitchen', title: 'Kitchen', area: { shape: 'rect', coords: [20, 20, 220, 180] } },
  { const: 'patio', title: 'Patio', area: { shape: 'poly', coords: '380,200 580,200 380,380' } },
  { const: 'pool', title: 'Pool', area: { shape: 'circle', coords: [520, 330, 40] }, rules: { visible: 'truthy(show)' } },
  { const: 'garage', title: 'Garage' },
]

const schema = {
  type: 'object',
  properties: {
    room: {
      type: 'string',
      title: 'Room',
      description: 'Pick one',
      oneOf: entries,
    },
    side: { type: 'string', title: 'Side', enum: ['left', 'right', 'other'] },
    rooms: {
      type: 'array',
      title: 'Rooms',
      uniqueItems: true,
      items: { type: 'string', oneOf: entries.slice(0, 3) },
      maxItems: 2,
    },
    show: { type: 'boolean' },
  },
  required: ['room'],
}

const sides = { left: { shape: 'rect', coords: '0, 0, 300, 400' }, right: { shape: 'rectangle', coords: [300, 0, 600, 400] }, other: { shape: 'star', coords: [1] } }

const control = (scope: string, options: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
  type: 'Control',
  scope: `#/properties/${scope}`,
  options: { format: 'image-map', image: IMAGE, ...options },
  ...extra,
})

const uischema = (...elements: Record<string, unknown>[]) => ({ type: 'VerticalLayout', elements })

const areas = (wrapper: any) => wrapper.findAll('.q-image-map__area')

describe('parseArea', () => {
  it('parses the shapes in the HTML area convention, from an array or a string', () => {
    expect(parseArea({ shape: 'rect', coords: [20, 20, 220, 180] })).toEqual({ shape: 'rect', x: 20, y: 20, width: 200, height: 160 })
    // a rect given by any two corners
    expect(parseArea({ shape: 'Rectangle', coords: '220, 180, 20, 20' })).toEqual({ shape: 'rect', x: 20, y: 20, width: 200, height: 160 })
    expect(parseArea({ shape: 'circle', coords: ['520', '330', '40'] })).toEqual({ shape: 'circle', cx: 520, cy: 330, r: 40 })
    expect(parseArea({ shape: 'circ', coords: '520 330 40' })).toEqual({ shape: 'circle', cx: 520, cy: 330, r: 40 })
    expect(parseArea({ shape: 'poly', coords: [380, 200, 580, 200, 380, 380] })).toEqual({ shape: 'poly', points: [380, 200, 580, 200, 380, 380] })
    expect(parseArea({ shape: 'polygon', coords: '380,200, 580,200, 380,380' })).toEqual({ shape: 'poly', points: [380, 200, 580, 200, 380, 380] })
  })

  it('refuses malformed definitions', () => {
    expect(parseArea(undefined)).toBeUndefined()
    expect(parseArea('rect')).toBeUndefined()
    expect(parseArea({ coords: [1, 2, 3, 4] })).toBeUndefined()
    expect(parseArea({ shape: 'star', coords: [1, 2, 3, 4] })).toBeUndefined()
    expect(parseArea({ shape: 'rect' })).toBeUndefined()
    expect(parseArea({ shape: 'rect', coords: [1, 2, 3] })).toBeUndefined()
    expect(parseArea({ shape: 'rect', coords: '1, 2, 3, x' })).toBeUndefined()
    expect(parseArea({ shape: 'circle', coords: [1, 2] })).toBeUndefined()
    expect(parseArea({ shape: 'circle', coords: [1, 2, -3] })).toBeUndefined()
    expect(parseArea({ shape: 'poly', coords: [1, 2, 3, 4] })).toBeUndefined()
    expect(parseArea({ shape: 'poly', coords: [1, 2, 3, 4, 5, 6, 7] })).toBeUndefined()
  })
})

describe('image map renderer', () => {
  it('is selected by the image-map format on enum, oneOf and multi enum controls', async () => {
    const wrapper = mountForm({
      schema,
      uischema: uischema(control('room'), control('side'), control('rooms'), { type: 'Control', scope: '#/properties/side' }),
      modelValue: {},
    })
    await flush()
    const renderers = wrapper.findAll('.q-image-map-renderer')
    expect(renderers.length).toBe(3)
    expect(renderers[0]!.find('.q-image-map__overlay').attributes('role')).toBe('radiogroup')
    expect(renderers[2]!.find('.q-image-map__overlay').attributes('role')).toBe('group')
    // the synced selects, plus the plain select renderer
    expect(wrapper.findAll('.q-select').length).toBe(4)
    wrapper.unmount()

    const bySchema = mountForm({
      schema: { type: 'object', properties: { side: { ...schema.properties.side, format: 'image-map' } } },
      uischema: uischema({ type: 'Control', scope: '#/properties/side', options: { image: IMAGE } }),
      modelValue: {},
    })
    await flush()
    expect(bySchema.find('.q-image-map-renderer').exists()).toBe(true)
    bySchema.unmount()
  })

  it('renders the header, the image and one shape per visible entry with an area', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('room', { class: 'my-map', maxWidth: 480 })), modelValue: { room: 'kitchen', show: false } })
    await flush()
    const root = wrapper.find('.q-image-map-renderer')
    expect(root.classes()).toContain('my-map')
    expect(root.find('.q-form-title').text()).toBe('Room *')
    expect(root.find('.q-form-description').text()).toBe('Pick one')
    expect(root.find('.q-image-map').attributes('style')).toContain('max-width: 480px')
    const image = root.find('img.q-image-map__image')
    expect(image.attributes('src')).toBe('img/plan.png')
    expect(image.attributes('alt')).toBe('Room')
    const overlay = root.find('svg.q-image-map__overlay')
    expect(overlay.attributes('viewBox')).toBe('0 0 600 400')
    expect(overlay.attributes('aria-label')).toBe('Room')
    expect(overlay.attributes('preserveAspectRatio')).toBe('none')
    expect(overlay.classes()).toContain('text-primary')
    // the pool is hidden by its rule, the garage has no area
    const shapes = areas(wrapper)
    expect(shapes.length).toBe(2)
    expect(shapes[0]!.element.tagName).toBe('rect')
    expect(shapes[0]!.attributes()).toMatchObject({ x: '20', y: '20', width: '200', height: '160', role: 'radio', 'aria-label': 'Kitchen', tabindex: '0' })
    expect(shapes[0]!.find('title').text()).toBe('Kitchen')
    expect(shapes[1]!.element.tagName).toBe('polygon')
    expect(shapes[1]!.attributes('points')).toBe('380 200 580 200 380 380')
    // the garage is still in the list
    expect(wrapper.findComponent(QSelect).props('options').map((option: any) => option.value)).toEqual(['kitchen', 'patio', 'garage'])
    await wrapper.setProps({ modelValue: { room: 'kitchen', show: true } })
    await flush()
    expect(areas(wrapper).length).toBe(3)
    expect(areas(wrapper)[2]!.element.tagName).toBe('circle')
    expect(areas(wrapper)[2]!.attributes()).toMatchObject({ cx: '520', cy: '330', r: '40' })
    wrapper.unmount()
  })

  it('takes the areas from the options map, overriding the entries, and ignores the invalid ones', async () => {
    const wrapper = mountForm({
      schema,
      uischema: uischema(
        control('side', { areas: sides, outline: true }),
        control('room', { areas: { kitchen: { shape: 'circle', coords: [1, 2, 3] } } }),
      ),
      modelValue: {},
    })
    await flush()
    const shapes = areas(wrapper)
    expect(shapes.map((shape: any) => shape.attributes('aria-label'))).toEqual(['left', 'right', 'Kitchen', 'Patio'])
    expect(shapes[0]!.attributes()).toMatchObject({ x: '0', y: '0', width: '300', height: '400' })
    expect(shapes[0]!.classes()).toContain('q-image-map__area--outlined')
    expect(shapes[2]!.element.tagName).toBe('circle')
    expect(shapes[2]!.classes()).not.toContain('q-image-map__area--outlined')
    wrapper.unmount()
  })

  it('sizes the overlay from the loaded image when the option has no size', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('side', { image: 'img/plan.png', areas: sides })), modelValue: {} })
    await flush()
    expect(wrapper.find('.q-image-map__overlay').exists()).toBe(false)
    const image = wrapper.find('img.q-image-map__image')
    Object.defineProperty(image.element, 'naturalWidth', { value: 300 })
    Object.defineProperty(image.element, 'naturalHeight', { value: 150 })
    await image.trigger('load')
    await flush()
    expect(wrapper.find('.q-image-map__overlay').attributes('viewBox')).toBe('0 0 300 150')
    expect(areas(wrapper).length).toBe(2)
    wrapper.unmount()
  })

  it('shows a placeholder for a missing image or a load error', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('side', { image: 'data:image/gif;base64,R0lGOD', areas: sides }), control('side', { areas: sides })), modelValue: {} })
    await flush()
    const maps = wrapper.findAll('.q-image-map')
    expect(maps[0]!.find('.q-image-map__placeholder').exists()).toBe(true)
    expect(maps[0]!.find('img').exists()).toBe(false)
    expect(maps[1]!.find('.q-image-map__placeholder').exists()).toBe(false)
    await maps[1]!.find('img').trigger('error')
    await flush()
    expect(wrapper.findAll('.q-image-map')[1]!.find('.q-image-map__placeholder').exists()).toBe(true)
    expect(wrapper.findAll('.q-image-map')[1]!.find('.q-image-map__overlay').exists()).toBe(false)
    // the list is still there
    expect(wrapper.findAllComponents(QSelect).length).toBe(2)
    wrapper.unmount()
  })

  it('selects one value, replaces it and clears an optional one on a second click', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('room', { color: 'teal' }), control('side', { areas: sides })), modelValue: { room: 'kitchen' } })
    await flush()
    const room = areas(wrapper).slice(0, 2)
    expect(wrapper.find('.q-image-map__overlay').classes()).toContain('text-teal')
    expect(room[0]!.attributes('aria-checked')).toBe('true')
    expect(room[0]!.classes()).toContain('q-image-map__area--selected')
    expect(room[1]!.attributes('aria-checked')).toBe('false')
    expect(room[1]!.classes()).not.toContain('q-image-map__area--selected')
    await room[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).room).toBe('patio')
    expect(areas(wrapper)[1]!.classes()).toContain('q-image-map__area--selected')
    // required: a second click keeps the value
    await areas(wrapper)[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).room).toBe('patio')
    // optional: a second click clears it
    const side = areas(wrapper).slice(2)
    await side[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).side).toBe('right')
    await areas(wrapper)[3]!.trigger('click')
    await flush()
    expect(lastData(wrapper).side).toBeUndefined()
    wrapper.unmount()
  })

  it('toggles the values of a multiple choice in the option order, up to maxItems', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('rooms')), modelValue: { show: true } })
    await flush()
    // the value is always an array
    expect(lastData(wrapper).rooms).toEqual([])
    expect(areas(wrapper)[0]!.attributes('role')).toBe('checkbox')
    await areas(wrapper)[2]!.trigger('click')
    await flush()
    expect(lastData(wrapper).rooms).toEqual(['pool'])
    await areas(wrapper)[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).rooms).toEqual(['kitchen', 'pool'])
    // maxItems reached: the other areas are disabled and ignore clicks
    const patio = areas(wrapper)[1]!
    expect(patio.classes()).toContain('disabled')
    expect(patio.attributes('aria-disabled')).toBe('true')
    expect(patio.attributes('tabindex')).toBe('-1')
    expect(areas(wrapper)[0]!.classes()).not.toContain('disabled')
    await patio.trigger('click')
    await flush()
    expect(lastData(wrapper).rooms).toEqual(['kitchen', 'pool'])
    await areas(wrapper)[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).rooms).toEqual(['pool'])
    expect(areas(wrapper)[1]!.classes()).not.toContain('disabled')
    // the list shows the same values as chips
    const select = wrapper.findComponent(QSelect)
    expect(select.props('multiple')).toBe(true)
    expect(select.props('useChips')).toBe(true)
    expect(select.props('modelValue')).toEqual(['pool'])
    wrapper.unmount()
  })

  it('keeps the select and the areas in sync, both ways', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('room', { dense: true }), control('rooms')), modelValue: { show: true } })
    await flush()
    const selects = wrapper.findAllComponents(QSelect)
    expect(selects.length).toBe(2)
    expect(selects[0]!.classes()).toContain('q-image-map__select')
    // the title is the header, as for the select renderer
    expect(selects[0]!.props('label')).toBeUndefined()
    expect(selects[0]!.props('clearable')).toBe(false)
    expect(selects[0]!.props('emitValue')).toBe(true)
    expect(selects[0]!.props('mapOptions')).toBe(true)
    expect(selects[0]!.props('dense')).toBe(true)
    expect(selects[0]!.props('modelValue')).toBeUndefined()
    // the renderer options are not forwarded to the select
    expect(selects[0]!.attributes('image')).toBeUndefined()
    expect(selects[0]!.attributes('format')).toBeUndefined()
    // an area click updates the select
    await areas(wrapper)[0]!.trigger('click')
    await flush()
    expect(wrapper.findAllComponents(QSelect)[0]!.props('modelValue')).toBe('kitchen')
    // a select change highlights the area
    wrapper.findAllComponents(QSelect)[0]!.vm.$emit('update:modelValue', 'patio')
    await flush()
    expect(lastData(wrapper).room).toBe('patio')
    expect(areas(wrapper)[0]!.classes()).not.toContain('q-image-map__area--selected')
    expect(areas(wrapper)[1]!.classes()).toContain('q-image-map__area--selected')
    // a value without area is only in the list
    wrapper.findAllComponents(QSelect)[0]!.vm.$emit('update:modelValue', 'garage')
    await flush()
    expect(lastData(wrapper).room).toBe('garage')
    expect(areas(wrapper).slice(0, 3).some((shape: any) => shape.classes().includes('q-image-map__area--selected'))).toBe(false)
    // a cleared optional select is no value; a multiple select keeps the array
    expect(selects[1]!.props('clearable')).toBe(true)
    wrapper.findAllComponents(QSelect)[1]!.vm.$emit('update:modelValue', ['pool', 'kitchen'])
    await flush()
    expect(lastData(wrapper).rooms).toEqual(['pool', 'kitchen'])
    expect(areas(wrapper)[3]!.classes()).toContain('q-image-map__area--selected')
    expect(areas(wrapper)[5]!.classes()).toContain('q-image-map__area--selected')
    wrapper.findAllComponents(QSelect)[1]!.vm.$emit('update:modelValue', null)
    await flush()
    expect(lastData(wrapper).rooms).toEqual([])
    wrapper.unmount()
  })

  it('shows the error under the select, or under the image without select', async () => {
    const wrapper = mountForm({
      schema,
      uischema: uischema(control('room'), control('room', { select: false }, { hint: 'The room' })),
      modelValue: {},
      validationMode: 'ValidateAndShow',
    })
    await flush()
    const renderers = wrapper.findAll('.q-image-map-renderer')
    expect(renderers[0]!.findComponent(QSelect).props('error')).toBe(true)
    expect(renderers[0]!.findComponent(QSelect).props('errorMessage')).toBeTruthy()
    expect(renderers[0]!.find('.q-form-error').exists()).toBe(false)
    expect(renderers[1]!.findComponent(QSelect).exists()).toBe(false)
    expect(renderers[1]!.find('.q-form-error').exists()).toBe(true)
    expect(renderers[1]!.find('.q-form-hint').exists()).toBe(false)
    await areas(wrapper)[2]!.trigger('click')
    await flush()
    expect(wrapper.findAll('.q-image-map-renderer')[1]!.find('.q-form-error').exists()).toBe(false)
    expect(wrapper.findAll('.q-image-map-renderer')[1]!.find('.q-form-hint').text()).toBe('The room')
    wrapper.unmount()
  })

  it('toggles with the keyboard', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('side', { areas: sides })), modelValue: {} })
    await flush()
    await areas(wrapper)[0]!.trigger('keydown', { key: ' ' })
    await flush()
    expect(lastData(wrapper).side).toBe('left')
    await areas(wrapper)[1]!.trigger('keydown', { key: 'Enter' })
    await flush()
    expect(lastData(wrapper).side).toBe('right')
    await areas(wrapper)[0]!.trigger('keydown', { key: 'a' })
    await flush()
    expect(lastData(wrapper).side).toBe('right')
    wrapper.unmount()
  })

  it('bounds a multiple choice with the max rule before the schema maxItems', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('rooms', {}, { rules: { max: '1' } })), modelValue: { rooms: ['kitchen'] } })
    await flush()
    expect(areas(wrapper)[1]!.classes()).toContain('disabled')
    await areas(wrapper)[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).rooms).toEqual(['kitchen'])
    wrapper.unmount()
  })

  it('is read-only or disabled, clears its value when hidden or invalid', async () => {
    const readonly = mountForm({ schema, uischema: uischema(control('room')), modelValue: { room: 'kitchen' }, readonly: true })
    await flush()
    expect(readonly.find('.q-image-map').classes()).toContain('q-form-readonly')
    expect(areas(readonly)[0]!.classes()).toContain('q-image-map__area--selected')
    expect(areas(readonly)[0]!.classes()).toContain('q-image-map__area--readonly')
    expect(areas(readonly)[0]!.attributes('tabindex')).toBe('-1')
    expect(readonly.findComponent(QSelect).props('readonly')).toBe(true)
    const emitted = (wrapper: any) => (wrapper.emitted('update:modelValue') || []).length
    const readonlyEmitted = emitted(readonly)
    await areas(readonly)[1]!.trigger('click')
    await areas(readonly)[1]!.trigger('keydown', { key: 'Enter' })
    await flush()
    expect(emitted(readonly)).toBe(readonlyEmitted)
    expect(areas(readonly)[0]!.classes()).toContain('q-image-map__area--selected')
    readonly.unmount()

    const disabled = mountForm({ schema, uischema: uischema(control('room', {}, { rules: { enabled: 'truthy(show)' } })), modelValue: { room: 'kitchen', show: false } })
    await flush()
    expect(disabled.find('.q-image-map').classes()).toContain('disabled')
    expect(areas(disabled)[0]!.classes()).toContain('disabled')
    expect(disabled.findComponent(QSelect).props('disable')).toBe(true)
    const disabledEmitted = emitted(disabled)
    await areas(disabled)[1]!.trigger('click')
    await flush()
    expect(emitted(disabled)).toBe(disabledEmitted)
    expect(areas(disabled)[0]!.classes()).toContain('q-image-map__area--selected')
    disabled.unmount()

    const hidden = mountForm({ schema, uischema: uischema(control('room', {}, { rules: { visible: 'truthy(show)' } })), modelValue: { room: 'kitchen', show: true } })
    await flush()
    expect(hidden.find('.q-image-map-renderer').exists()).toBe(true)
    await hidden.setProps({ modelValue: { room: 'kitchen', show: false } })
    await flush()
    expect(hidden.find('.q-image-map-renderer').exists()).toBe(false)
    expect(lastData(hidden).room).toBeUndefined()
    hidden.unmount()

    // the pool entry disappears with its rule: the value is cleared
    const invalid = mountForm({ schema, uischema: uischema(control('room')), modelValue: { room: 'pool', show: true } })
    await flush()
    expect(areas(invalid)[2]!.classes()).toContain('q-image-map__area--selected')
    await invalid.setProps({ modelValue: { room: 'pool', show: false } })
    await flush()
    expect(lastData(invalid).room).toBeUndefined()
    invalid.unmount()
  })
})

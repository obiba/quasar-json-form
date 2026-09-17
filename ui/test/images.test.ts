import { describe, it, expect } from 'vitest'
import { QImg } from 'quasar'
import { mountForm, flush } from './utils'
import { isSupportedImage, ratioPadding, IMAGE_MIME_TYPES } from '../src/components/QImagesRenderer'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const PNG = 'data:image/png;base64,iVBORw0KGgo='

const schema = {
  type: 'object',
  properties: {
    pet: {
      type: 'string',
      title: 'Pet',
      description: 'Pick one',
      oneOf: [
        { const: 'cat', title: 'Cat', image: 'img/cat.webp' },
        { const: 'dog', title: 'Dog', image: 'img/dog.png', grid: { colSpan: 2 } },
        { const: 'fish', title: 'Fish', rules: { visible: 'truthy(show)' } },
      ],
    },
    size: { type: 'string', title: 'Size', enum: ['S', 'M', 'L'] },
    toppings: {
      type: 'array',
      title: 'Toppings',
      uniqueItems: true,
      items: { type: 'string', enum: ['cheese', 'olives', 'mushrooms'] },
      maxItems: 2,
    },
    show: { type: 'boolean' },
  },
  required: ['pet'],
}

const control = (scope: string, options: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
  type: 'Control',
  scope: `#/properties/${scope}`,
  options: { format: 'images', ...options },
  ...extra,
})

const uischema = (...elements: Record<string, unknown>[]) => ({ type: 'VerticalLayout', elements })

const tiles = (wrapper: any) => wrapper.findAll('.q-images__tile')

describe('isSupportedImage', () => {
  it('accepts URLs and data URIs of the supported types', () => {
    expect(IMAGE_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp'])
    expect(isSupportedImage('img/cat.webp')).toBe(true)
    expect(isSupportedImage('https://example.org/files/123')).toBe(true)
    expect(isSupportedImage(PNG)).toBe(true)
    expect(isSupportedImage('data:image/JPEG;base64,/9j/')).toBe(true)
    expect(isSupportedImage('data:image/webp,abc')).toBe(true)
  })

  it('refuses empty sources and data URIs of other types', () => {
    expect(isSupportedImage(undefined)).toBe(false)
    expect(isSupportedImage('')).toBe(false)
    expect(isSupportedImage('  ')).toBe(false)
    expect(isSupportedImage(12)).toBe(false)
    expect(isSupportedImage('data:image/gif;base64,R0lGOD')).toBe(false)
    expect(isSupportedImage('data:image/svg+xml,<svg/>')).toBe(false)
    expect(isSupportedImage('data:text/plain,hello')).toBe(false)
    // malformed or padded data URIs are data URIs too
    expect(isSupportedImage('data:,x')).toBe(false)
    expect(isSupportedImage('data:image/gif')).toBe(false)
    expect(isSupportedImage('DATA:image/gif;base64,R0lGOD')).toBe(false)
    expect(isSupportedImage(' data:image/gif;base64,R0lGOD')).toBe(false)
    expect(isSupportedImage(' data:image/png;base64,iVBOR')).toBe(true)
  })
})

describe('ratioPadding', () => {
  it('turns a ratio into the padding of a box of that ratio', () => {
    expect(ratioPadding(1)).toBe('100%')
    expect(ratioPadding(2)).toBe('50%')
    expect(ratioPadding('16/9')).toBe('56.25%')
    expect(ratioPadding('4 / 3')).toBe('75%')
    expect(ratioPadding('1.5')).toBe(`${100 / 1.5}%`)
    expect(ratioPadding(0)).toBe('100%')
    expect(ratioPadding('abc')).toBe('100%')
    expect(ratioPadding(undefined)).toBe('100%')
  })
})

describe('images renderer', () => {
  it('is selected by the images format on enum, oneOf and multi enum controls', async () => {
    const wrapper = mountForm({
      schema,
      uischema: uischema(control('pet'), control('size'), control('toppings'), { type: 'Control', scope: '#/properties/size' }),
      modelValue: {},
    })
    await flush()
    const renderers = wrapper.findAll('.q-images-renderer')
    expect(renderers.length).toBe(3)
    expect(renderers[0]!.find('.q-images').attributes('role')).toBe('radiogroup')
    expect(renderers[2]!.find('.q-images').attributes('role')).toBe('group')
    expect(wrapper.findAll('.q-select').length).toBe(1)
    wrapper.unmount()

    const bySchema = mountForm({
      schema: { type: 'object', properties: { size: { ...schema.properties.size, format: 'images' } } },
      uischema: uischema({ type: 'Control', scope: '#/properties/size' }),
      modelValue: {},
    })
    await flush()
    expect(bySchema.find('.q-images-renderer').exists()).toBe(true)
    bySchema.unmount()
  })

  it('renders the header, one tile per visible entry with its image, caption and placement', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('pet', { class: 'my-images' })), modelValue: { pet: 'dog', show: false } })
    await flush()
    const root = wrapper.find('.q-images-renderer')
    expect(root.classes()).toContain('my-images')
    expect(root.find('.q-form-title').text()).toBe('Pet *')
    expect(root.find('.q-form-description').text()).toBe('Pick one')
    expect(tiles(wrapper).length).toBe(2)
    const images = wrapper.findAllComponents(QImg)
    expect(images.length).toBe(2)
    expect(images[0]!.props('src')).toBe('img/cat.webp')
    expect(images[0]!.props('alt')).toBe('Cat')
    expect(images[0]!.props('ratio')).toBe(1)
    expect(images[0]!.props('fit')).toBe('cover')
    expect(images[1]!.props('src')).toBe('img/dog.png')
    expect(wrapper.findAll('.q-images__label').map((label) => label.text())).toEqual(['Cat', 'Dog'])
    const cells = wrapper.findAll('.q-images__cell')
    expect(cells[0]!.attributes('style')).toBeUndefined()
    expect(cells[1]!.attributes('style')).toContain('grid-column: span 2')
    // an entry hidden by its rule appears when the rule is met
    await wrapper.setProps({ modelValue: { pet: 'dog', show: true } })
    await flush()
    expect(tiles(wrapper).length).toBe(3)
    // the entry without image renders the placeholder
    expect(tiles(wrapper)[2]!.find('.q-images__image--missing .q-images__placeholder').exists()).toBe(true)
    expect(wrapper.findAllComponents(QImg).length).toBe(2)
    wrapper.unmount()
  })

  it('takes the images from the options map, overriding the entries', async () => {
    const wrapper = mountForm({
      schema,
      uischema: uischema(
        control('size', { images: { S: PNG, M: { src: 'img/m.jpg', grid: { column: 1 }, title: 'Medium' }, L: 'data:image/gif;base64,R0lGOD' } }),
        control('pet', { images: { cat: 'img/kitten.jpeg' } }),
      ),
      modelValue: {},
    })
    await flush()
    const images = wrapper.findAllComponents(QImg)
    expect(images.map((image) => image.props('src'))).toEqual([PNG, 'img/m.jpg', 'img/kitten.jpeg', 'img/dog.png'])
    expect(wrapper.findAll('.q-images__label').map((label) => label.text())).toEqual(['S', 'Medium', 'L', 'Cat', 'Dog'])
    const cells = wrapper.findAll('.q-images__cell')
    expect(cells[1]!.attributes('style')).toContain('grid-column: 1')
    // a data URI of an unsupported type is a placeholder
    expect(cells[2]!.find('.q-images__placeholder').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows the placeholder when the image fails to load', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('size', { images: { S: 'img/s.png' } })), modelValue: {} })
    await flush()
    expect(wrapper.find('.q-img .q-images__placeholder').exists()).toBe(false)
    await wrapper.find('.q-img img').trigger('error')
    await flush()
    expect(wrapper.find('.q-img .q-images__placeholder').exists()).toBe(true)
    wrapper.unmount()
  })

  it('lays the tiles out on an auto-fill grid by default, or on the columns option', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('size'), control('size', { columns: 3, gap: 4, minWidth: 80 }), control('size', { minWidth: 80 })), modelValue: {} })
    await flush()
    const grids = wrapper.findAll('.q-images')
    expect(grids[0]!.attributes('style')).toContain('grid-template-columns: repeat(auto-fill, minmax(120px, 1fr))')
    expect(grids[0]!.attributes('style')).toContain('row-gap: 10px')
    expect(grids[0]!.attributes('style')).toContain('column-gap: 10px')
    expect(grids[1]!.attributes('style')).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
    expect(grids[1]!.attributes('style')).toContain('row-gap: 4px')
    expect(grids[2]!.attributes('style')).toContain('grid-template-columns: repeat(auto-fill, minmax(80px, 1fr))')
    // the layout options are not forwarded to the tiles
    expect(wrapper.find('[columns]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('selects one value, replaces it and clears an optional one on a second click', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('pet', { color: 'teal' }), control('size')), modelValue: { pet: 'cat' } })
    await flush()
    const pet = tiles(wrapper).slice(0, 2)
    expect(pet[0]!.attributes('role')).toBe('radio')
    expect(pet[0]!.attributes('aria-checked')).toBe('true')
    expect(pet[0]!.classes()).toContain('q-images__tile--selected')
    expect(pet[0]!.classes()).toContain('text-teal')
    expect(pet[0]!.find('.q-images__badge .q-icon').text()).toBe('check')
    expect(pet[1]!.attributes('aria-checked')).toBe('false')
    expect(pet[1]!.find('.q-images__badge').exists()).toBe(false)
    await pet[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).pet).toBe('dog')
    // required: a second click keeps the value
    await tiles(wrapper)[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).pet).toBe('dog')
    // optional: a second click clears it
    const size = tiles(wrapper).slice(2)
    expect(size[0]!.classes()).toContain('text-primary')
    await size[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).size).toBe('M')
    await tiles(wrapper)[3]!.trigger('click')
    await flush()
    expect(lastData(wrapper).size).toBeUndefined()
    wrapper.unmount()
  })

  it('toggles the values of a multiple choice in the option order, up to maxItems', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('toppings')), modelValue: {} })
    await flush()
    // the value is always an array
    expect(lastData(wrapper).toppings).toEqual([])
    expect(tiles(wrapper)[0]!.attributes('role')).toBe('checkbox')
    await tiles(wrapper)[2]!.trigger('click')
    await flush()
    expect(lastData(wrapper).toppings).toEqual(['mushrooms'])
    await tiles(wrapper)[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).toppings).toEqual(['cheese', 'mushrooms'])
    // maxItems reached: the other tiles are disabled and ignore clicks
    const olives = tiles(wrapper)[1]!
    expect(olives.classes()).toContain('disabled')
    expect(olives.attributes('aria-disabled')).toBe('true')
    expect(olives.attributes('tabindex')).toBe('-1')
    expect(tiles(wrapper)[0]!.classes()).not.toContain('disabled')
    await olives.trigger('click')
    await flush()
    expect(lastData(wrapper).toppings).toEqual(['cheese', 'mushrooms'])
    await tiles(wrapper)[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).toppings).toEqual(['mushrooms'])
    expect(tiles(wrapper)[1]!.classes()).not.toContain('disabled')
    wrapper.unmount()
  })

  it('keeps the click order and moves the values with ordering', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('toppings', { ordering: true })), modelValue: { toppings: ['mushrooms', 'cheese'] } })
    await flush()
    const badges = () => tiles(wrapper).map((tile: any) => tile.find('.q-images__badge').exists() ? tile.find('.q-images__badge').text() : '')
    expect(badges()).toEqual(['2', '', '1'])
    // move buttons on the selected tiles only
    const captions = wrapper.findAll('.q-images__caption')
    expect(captions[0]!.findAll('.q-btn').length).toBe(2)
    expect(captions[1]!.findAll('.q-btn').length).toBe(0)
    expect(captions[2]!.findAll('.q-btn').length).toBe(2)
    // cheese is last: only "move before" is enabled
    expect(captions[0]!.findAll('.q-btn')[0]!.attributes('aria-label')).toBe('cheese: Move before')
    expect(captions[0]!.findAll('.q-btn')[0]!.attributes('disabled')).toBeUndefined()
    expect(captions[0]!.findAll('.q-btn')[1]!.attributes('aria-label')).toBe('cheese: Move after')
    expect(captions[0]!.findAll('.q-btn')[1]!.classes()).toContain('disabled')
    await captions[0]!.findAll('.q-btn')[0]!.trigger('click')
    await flush()
    expect(lastData(wrapper).toppings).toEqual(['cheese', 'mushrooms'])
    // the move does not toggle the tile
    expect(tiles(wrapper)[0]!.attributes('aria-checked')).toBe('true')
    expect(badges()).toEqual(['1', '', '2'])
    // a new value goes last
    await tiles(wrapper)[0]!.trigger('click')
    await flush()
    await tiles(wrapper)[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).toppings).toEqual(['mushrooms', 'olives'])
    wrapper.unmount()
  })

  it('toggles with the keyboard', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('size')), modelValue: {} })
    await flush()
    expect(tiles(wrapper)[0]!.attributes('tabindex')).toBe('0')
    expect(tiles(wrapper)[0]!.attributes('aria-label')).toBe('S')
    await tiles(wrapper)[0]!.trigger('keydown', { key: ' ' })
    await flush()
    expect(lastData(wrapper).size).toBe('S')
    await tiles(wrapper)[1]!.trigger('keydown', { key: 'Enter' })
    await flush()
    expect(lastData(wrapper).size).toBe('M')
    await tiles(wrapper)[2]!.trigger('keydown', { key: 'a' })
    await flush()
    expect(lastData(wrapper).size).toBe('M')
    wrapper.unmount()
  })

  it('hides the captions and forwards the image options', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('size', { captions: false, ratio: 1.5, fit: 'contain' })), modelValue: {} })
    await flush()
    expect(wrapper.find('.q-images__caption').exists()).toBe(false)
    expect(wrapper.findAll('.q-images__tile').length).toBe(3)
    wrapper.unmount()

    const withImages = mountForm({ schema, uischema: uischema(control('size', { images: { S: 'img/s.png' }, ratio: 1.5, fit: 'contain' })), modelValue: {} })
    await flush()
    expect(withImages.findComponent(QImg).props('ratio')).toBe(1.5)
    expect(withImages.findComponent(QImg).props('fit')).toBe('contain')
    // the placeholder of a missing image has the same ratio
    expect(withImages.find('.q-images__image--missing').attributes('style')).toContain(`padding-bottom: ${100 / 1.5}%`)
    withImages.unmount()
  })

  it('bounds a multiple choice with the max rule before the schema maxItems', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('toppings', {}, { rules: { max: '1' } })), modelValue: { toppings: ['cheese'] } })
    await flush()
    expect(tiles(wrapper)[1]!.classes()).toContain('disabled')
    expect(tiles(wrapper)[2]!.classes()).toContain('disabled')
    await tiles(wrapper)[1]!.trigger('click')
    await flush()
    expect(lastData(wrapper).toppings).toEqual(['cheese'])
    wrapper.unmount()
  })

  it('is read-only or disabled, clears its value when hidden or invalid', async () => {
    const readonly = mountForm({ schema, uischema: uischema(control('pet')), modelValue: { pet: 'cat' }, readonly: true })
    await flush()
    expect(readonly.find('.q-images').classes()).toContain('q-form-readonly')
    expect(tiles(readonly)[0]!.classes()).toContain('q-images__tile--selected')
    expect(tiles(readonly)[0]!.attributes('tabindex')).toBe('-1')
    const emitted = (wrapper: any) => (wrapper.emitted('update:modelValue') || []).length
    const readonlyEmitted = emitted(readonly)
    await tiles(readonly)[1]!.trigger('click')
    await tiles(readonly)[1]!.trigger('keydown', { key: 'Enter' })
    await flush()
    expect(emitted(readonly)).toBe(readonlyEmitted)
    expect(tiles(readonly)[0]!.classes()).toContain('q-images__tile--selected')
    readonly.unmount()

    const disabled = mountForm({ schema, uischema: uischema(control('pet', {}, { rules: { enabled: 'truthy(show)' } })), modelValue: { pet: 'cat', show: false } })
    await flush()
    expect(tiles(disabled)[0]!.classes()).toContain('disabled')
    const disabledEmitted = emitted(disabled)
    await tiles(disabled)[1]!.trigger('click')
    await flush()
    expect(emitted(disabled)).toBe(disabledEmitted)
    expect(tiles(disabled)[0]!.classes()).toContain('q-images__tile--selected')
    disabled.unmount()

    const hidden = mountForm({ schema, uischema: uischema(control('pet', {}, { rules: { visible: 'truthy(show)' } })), modelValue: { pet: 'cat', show: true } })
    await flush()
    await hidden.setProps({ modelValue: { pet: 'cat', show: false } })
    await flush()
    expect(hidden.find('.q-images-renderer').exists()).toBe(false)
    expect(lastData(hidden).pet).toBeUndefined()
    hidden.unmount()

    // fish is no longer an option when show is false
    const invalid = mountForm({ schema, uischema: uischema(control('pet')), modelValue: { pet: 'fish', show: true } })
    await flush()
    await invalid.setProps({ modelValue: { pet: 'fish', show: false } })
    await flush()
    expect(lastData(invalid).pet).toBeUndefined()
    invalid.unmount()
  })

  it('shows the errors instead of the hint', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('toppings', {}, { hint: 'pick some' })), modelValue: { toppings: ['cheese', 'olives', 'mushrooms'] } })
    await flush()
    const root = wrapper.find('.q-images-renderer')
    expect(root.find('.q-form-error').text()).toBe('Must have at most 2 items')
    expect(root.find('.q-form-hint').exists()).toBe(false)
    await tiles(wrapper)[0]!.trigger('click')
    await flush()
    expect(wrapper.find('.q-form-error').exists()).toBe(false)
    expect(wrapper.find('.q-form-hint').text()).toBe('pick some')
    wrapper.unmount()
  })
})

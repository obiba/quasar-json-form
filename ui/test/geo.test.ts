/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { QBtnToggle, QInput } from 'quasar'
import { mountForm, flush } from './utils'
import {
  parseGeometry, parsePosition, parseGeoKinds, parseGeoTiles, countPositions, OSM_TILES,
} from '../src/components/QGeoRenderer'
import type { GeoGeometry, GeoMap, GeoMapOptions } from '../src/components/QGeoRenderer'

// the OpenLayers adapter is mocked: jsdom has no canvas, and the renderer
// only relies on the `GeoMap` interface
interface MockMap extends GeoMap {
  target: HTMLElement
  options: GeoMapOptions
}
const maps: MockMap[] = []
vi.mock('../src/utils/geo-map', () => ({
  createGeoMap: vi.fn((target: HTMLElement, options: GeoMapOptions) => {
    const map: MockMap = {
      target,
      options,
      setGeometry: vi.fn(),
      setMode: vi.fn(),
      setCenter: vi.fn(),
      fit: vi.fn(() => true),
      updateSize: vi.fn(),
      destroy: vi.fn(),
    }
    maps.push(map)
    return map
  }),
}))

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const lastMap = () => maps[maps.length - 1]!

const POINT: GeoGeometry = { type: 'Point', coordinates: [-73.5673, 45.5017] }
const LINE: GeoGeometry = { type: 'LineString', coordinates: [[-73.5, 45.5], [-73.6, 45.6]] }
const POLYGON: GeoGeometry = { type: 'Polygon', coordinates: [[[-73.5, 45.5], [-73.6, 45.5], [-73.6, 45.6], [-73.5, 45.5]]] }

const schema = {
  type: 'object',
  properties: {
    where: { type: 'object', title: 'Where', format: 'geo' },
    plain: { type: 'object', title: 'Plain' },
    typed: { type: 'object', title: 'Typed', properties: { type: { type: 'string', enum: ['Point', 'Polygon'] }, coordinates: { type: 'array' } } },
    show: { type: 'boolean' },
  },
  required: ['where'],
}

const control = (scope: string, options: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
  type: 'Control',
  scope: `#/properties/${scope}`,
  options: { format: 'geo', ...options },
  ...extra,
})

const uischema = (...elements: Record<string, unknown>[]) => ({ type: 'VerticalLayout', elements })

const mountGeo = async (options: Record<string, unknown> = {}, data: Record<string, unknown> = {}, extra: Record<string, unknown> = {}, config?: Record<string, unknown>) => {
  const expected = maps.length + 1
  const wrapper = mountForm({ schema, uischema: uischema(control('where', options, extra)), modelValue: data, config })
  await waitForMaps(expected)
  await flush()
  return wrapper
}

const modeButtons = (wrapper: any) => wrapper.findComponent(QBtnToggle).findAll('button')

const modeLabels = (wrapper: any) => modeButtons(wrapper).map((button: any) => button.find('.block').text())

/** the map module is loaded on demand: wait for the maps to be created */
const waitForMaps = (count: number) => vi.waitFor(() => { expect(maps.length).toBe(count) })

beforeEach(() => {
  maps.length = 0
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('geo helpers', () => {
  it('parses positions and rounds them', () => {
    expect(parsePosition([-73.56730001, 45.5017, 12])).toEqual([-73.5673, 45.5017])
    expect(parsePosition(['-73.4', '45.5'], 0)).toEqual([-73, 46])
    expect(parsePosition([181, 0])).toBeUndefined()
    expect(parsePosition([0, -91])).toBeUndefined()
    expect(parsePosition([0])).toBeUndefined()
    expect(parsePosition(['', 1])).toBeUndefined()
    expect(parsePosition('0,0')).toBeUndefined()
  })

  it('parses the three geometries and closes the rings', () => {
    expect(parseGeometry(POINT)).toEqual(POINT)
    expect(parseGeometry(LINE)).toEqual(LINE)
    expect(parseGeometry({ type: 'Polygon', coordinates: [[[-73.5, 45.5], [-73.6, 45.5], [-73.6, 45.6]]] })).toEqual(POLYGON)
    expect(parseGeometry(POLYGON)).toEqual(POLYGON)
    // a feature is unwrapped
    expect(parseGeometry({ type: 'Feature', geometry: POINT, properties: {} })).toEqual(POINT)
  })

  it('refuses malformed geometries', () => {
    expect(parseGeometry(undefined)).toBeUndefined()
    expect(parseGeometry('point')).toBeUndefined()
    expect(parseGeometry({ type: 'Point' })).toBeUndefined()
    expect(parseGeometry({ type: 'Point', coordinates: [200, 0] })).toBeUndefined()
    expect(parseGeometry({ type: 'LineString', coordinates: [[0, 0]] })).toBeUndefined()
    expect(parseGeometry({ type: 'Polygon', coordinates: [] })).toBeUndefined()
    expect(parseGeometry({ type: 'Polygon', coordinates: [[[0, 0], [1, 1]]] })).toBeUndefined()
    expect(parseGeometry({ type: 'MultiPoint', coordinates: [[0, 0]] })).toBeUndefined()
  })

  it('parses the kinds, in the toolbar order', () => {
    expect(parseGeoKinds(['polygon', 'Point', 'line', 'point'])).toEqual(['point', 'linestring', 'polygon'])
    expect(parseGeoKinds('polygon, LineString')).toEqual(['linestring', 'polygon'])
    expect(parseGeoKinds(['circle'])).toEqual([])
    expect(parseGeoKinds(undefined)).toEqual([])
  })

  it('parses the tiles', () => {
    expect(parseGeoTiles('https://a.b/{z}/{x}/{y}.png')).toEqual({ url: 'https://a.b/{z}/{x}/{y}.png' })
    expect(parseGeoTiles({ url: 'https://a.b/{z}/{x}/{y}.png', attributions: 'me' })).toEqual({ url: 'https://a.b/{z}/{x}/{y}.png', attributions: 'me' })
    expect(parseGeoTiles({ attributions: 'me' })).toBeUndefined()
    expect(parseGeoTiles('')).toBeUndefined()
  })

  it('counts the positions', () => {
    expect(countPositions(POINT)).toBe(1)
    expect(countPositions(LINE)).toBe(2)
    expect(countPositions(POLYGON)).toBe(3)
  })
})

describe('QGeoRenderer', () => {
  it('renders an object with the geo format, the schema format too', async () => {
    const wrapper = mountForm({
      schema: { ...schema, properties: { ...schema.properties, where: { type: 'object', title: 'Where', format: 'geo' } } },
      uischema: uischema({ type: 'Control', scope: '#/properties/where' }, control('plain'), { type: 'Control', scope: '#/properties/plain' }),
      modelValue: {},
    })
    await waitForMaps(2)
    expect(wrapper.findAll('.q-geo-renderer').length).toBe(2)
    expect(wrapper.find('.q-form-title').text()).toBe('Where *')
    expect(wrapper.find('.q-geo__map').attributes('role')).toBe('application')
    expect(wrapper.find('.q-geo__map').attributes('aria-label')).toBe('Where')
    expect(maps.length).toBe(2)
  })

  it('creates the map with the OSM tiles by default, the attribution under it', async () => {
    const wrapper = await mountGeo()
    const map = lastMap()
    expect(map.target).toBe(wrapper.find('.q-geo__map').element)
    expect(map.options.tiles).toEqual(OSM_TILES)
    expect(map.options.precision).toBe(6)
    expect(wrapper.find('.q-geo__attribution a').attributes('href')).toBe('https://www.openstreetmap.org/copyright')
    expect(wrapper.find('.q-geo__map').attributes('style')).toContain('height: 320px')
    expect(wrapper.find('.q-geo').classes()).toContain('q-geo--grayscale')
  })

  it('keeps the colors of the tiles with grayscale: false, in the options or the config', async () => {
    let wrapper = await mountGeo({ grayscale: false })
    expect(wrapper.find('.q-geo').classes()).not.toContain('q-geo--grayscale')
    wrapper = await mountGeo({}, {}, {}, { geo: { grayscale: false } })
    expect(wrapper.find('.q-geo').classes()).not.toContain('q-geo--grayscale')
    wrapper = await mountGeo({ grayscale: true }, {}, {}, { geo: { grayscale: false } })
    expect(wrapper.find('.q-geo').classes()).toContain('q-geo--grayscale')
  })

  it('takes the tiles, the view and the height from the options, then the config', async () => {
    const wrapper = await mountGeo({ tiles: 'https://a.b/{z}/{x}/{y}.png', center: [2.35, 48.85], zoom: 10, height: 200, precision: 4 })
    let map = lastMap()
    expect(map.options.tiles).toEqual({ url: 'https://a.b/{z}/{x}/{y}.png' })
    expect(map.options.precision).toBe(4)
    expect(map.setCenter).toHaveBeenCalledWith([2.35, 48.85], 10)
    expect(wrapper.find('.q-geo__attribution').exists()).toBe(false)
    expect(wrapper.find('.q-geo__map').attributes('style')).toContain('height: 200px')

    await mountGeo({}, {}, {}, { geo: { tiles: { url: 'https://c.d/{z}/{x}/{y}.png', attributions: 'C' }, center: [0, 45], height: '10em' } })
    map = lastMap()
    expect(map.options.tiles).toEqual({ url: 'https://c.d/{z}/{x}/{y}.png', attributions: 'C' })
    expect(map.setCenter).toHaveBeenCalledWith([0, 45], 12)
  })

  it('shows the value on the map, fitted, and follows the data', async () => {
    const wrapper = await mountGeo({}, { where: POLYGON })
    const map = lastMap()
    expect(map.setGeometry).toHaveBeenCalledWith(POLYGON, true)
    expect(map.setCenter).not.toHaveBeenCalled()
    // the mode follows the kind of the value
    expect(map.setMode).toHaveBeenLastCalledWith('polygon', { minPoints: undefined, maxPoints: undefined })
    expect(wrapper.find('.q-geo__summary').text()).toBe('Polygon: 3 points')

    await wrapper.setProps({ modelValue: { where: LINE } })
    await flush()
    expect(map.setGeometry).toHaveBeenLastCalledWith(LINE, true)
    expect(map.setMode).toHaveBeenLastCalledWith('linestring', { minPoints: undefined, maxPoints: undefined })
    expect(wrapper.find('.q-geo__summary').text()).toBe('Line: 2 points')

    // an invalid value is displayed as nothing
    await wrapper.setProps({ modelValue: { where: { type: 'Point' } } })
    await flush()
    expect(map.setGeometry).toHaveBeenLastCalledWith(undefined, true)
    expect(wrapper.find('.q-geo__summary').exists()).toBe(false)
  })

  it('writes what is drawn on the map, without sending it back', async () => {
    const wrapper = await mountGeo()
    const map = lastMap()
    const calls = (map.setGeometry as any).mock.calls.length
    map.options.onChange(POINT)
    await flush()
    expect(lastData(wrapper)).toEqual({ where: POINT })
    expect((map.setGeometry as any).mock.calls.length).toBe(calls)
    // the point inputs follow
    const inputs = wrapper.findAllComponents(QInput)
    expect((inputs[0]!.props('modelValue'))).toBe('45.5017')
    expect((inputs[1]!.props('modelValue'))).toBe('-73.5673')
  })

  it('offers one draw mode per allowed kind', async () => {
    let wrapper = await mountGeo()
    expect(modeButtons(wrapper).length).toBe(3)
    expect(modeLabels(wrapper)).toEqual(['Point', 'Line', 'Polygon'])
    let map = lastMap()
    expect(map.setMode).toHaveBeenLastCalledWith('point', { minPoints: undefined, maxPoints: undefined })
    await modeButtons(wrapper)[2]!.trigger('click')
    await flush()
    expect(map.setMode).toHaveBeenLastCalledWith('polygon', { minPoints: undefined, maxPoints: undefined })
    // no point inputs while drawing a polygon
    expect(wrapper.find('.q-geo__inputs').exists()).toBe(false)

    wrapper = await mountGeo({ geometries: ['polygon', 'line'], minPoints: 3, maxPoints: 8 })
    expect(modeLabels(wrapper)).toEqual(['Line', 'Polygon'])
    map = lastMap()
    expect(map.setMode).toHaveBeenLastCalledWith('linestring', { minPoints: 3, maxPoints: 8 })
    expect(wrapper.find('.q-geo__inputs').exists()).toBe(false)

    // a single kind: no toggle
    wrapper = await mountGeo({ geometries: 'point' })
    expect(wrapper.findComponent(QBtnToggle).exists()).toBe(false)
    expect(wrapper.find('.q-geo__inputs').exists()).toBe(true)
  })

  it('restricts the kinds to the type enum of the schema', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('typed')), modelValue: {} })
    await waitForMaps(1)
    expect(modeLabels(wrapper)).toEqual(['Point', 'Polygon'])
  })

  it('writes a point typed as latitude and longitude', async () => {
    const wrapper = await mountGeo({ geometries: ['point'] })
    const [lat, lon] = wrapper.findAllComponents(QInput)
    await lat!.find('input').setValue('45.50170001')
    await flush()
    // half a position: nothing yet
    expect(lastData(wrapper)).toEqual({})
    await lon!.find('input').setValue('-73.5673')
    await flush()
    expect(lastData(wrapper)).toEqual({ where: POINT })
    expect(lastMap().setGeometry).toHaveBeenLastCalledWith(POINT, true)

    // out of range: kept as is
    await lat!.find('input').setValue('95')
    await flush()
    expect(lastData(wrapper)).toEqual({ where: POINT })

    // both cleared: no value
    await lat!.find('input').setValue('')
    await flush()
    // one side cleared: the value stays until both are
    expect(lastData(wrapper)).toEqual({ where: POINT })
    await lon!.find('input').setValue('')
    await flush()
    expect(lastData(wrapper)).toEqual({})
  })

  it('hides the inputs with inputs: false', async () => {
    const wrapper = await mountGeo({ inputs: false }, { where: POINT })
    expect(wrapper.find('.q-geo__inputs').exists()).toBe(false)
  })

  it('clears the value', async () => {
    const wrapper = await mountGeo({}, { where: POINT })
    expect(wrapper.find('.q-geo__clear').attributes('disabled')).toBeUndefined()
    await wrapper.find('.q-geo__clear').trigger('click')
    await flush()
    expect(lastData(wrapper)).toEqual({})
    expect(lastMap().setGeometry).toHaveBeenLastCalledWith(undefined, true)
    expect(wrapper.find('.q-geo__clear').attributes('disabled')).toBeDefined()
  })

  describe('locate', () => {
    const getCurrentPosition = vi.fn()

    beforeEach(() => {
      getCurrentPosition.mockReset()
      Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
    })

    afterEach(() => {
      delete (navigator as any).geolocation
    })

    it('has no locate button without the Geolocation API, or with locate: false', async () => {
      delete (navigator as any).geolocation
      let wrapper = await mountGeo()
      expect(wrapper.find('.q-geo__locate').exists()).toBe(false)
      Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true })
      wrapper = await mountGeo({ locate: false })
      expect(wrapper.find('.q-geo__locate').exists()).toBe(false)
      wrapper = await mountGeo()
      expect(wrapper.find('.q-geo__locate').exists()).toBe(true)
    })

    it('writes the current position as the point', async () => {
      getCurrentPosition.mockImplementation((success: any) => success({ coords: { latitude: 45.50170004, longitude: -73.5673 } }))
      const wrapper = await mountGeo()
      await wrapper.find('.q-geo__locate').trigger('click')
      await flush()
      expect(getCurrentPosition).toHaveBeenCalledTimes(1)
      expect(lastData(wrapper)).toEqual({ where: POINT })
      expect(lastMap().setGeometry).toHaveBeenLastCalledWith(POINT, true)
    })

    it('centers the map on the current position when drawing a shape', async () => {
      getCurrentPosition.mockImplementation((success: any) => success({ coords: { latitude: 45.5017, longitude: -73.5673 } }))
      const wrapper = await mountGeo({ geometries: ['polygon'] })
      await wrapper.find('.q-geo__locate').trigger('click')
      await flush()
      expect(lastData(wrapper)).toEqual({})
      expect(lastMap().setCenter).toHaveBeenLastCalledWith([-73.5673, 45.5017], 15)
    })

    it('reports a failure', async () => {
      getCurrentPosition.mockImplementation((_success: any, failure: any) => failure({ code: 1 }))
      const wrapper = await mountGeo()
      await wrapper.find('.q-geo__locate').trigger('click')
      await flush()
      expect(wrapper.find('.q-geo__locate-error').text()).toBe('The current position could not be obtained')
      // gone once a value is drawn
      lastMap().options.onChange(POINT)
      await flush()
      expect(wrapper.find('.q-geo__locate-error').exists()).toBe(false)
    })
  })

  it('is read-only without a toolbar or interactions, the map still displayed', async () => {
    const wrapper = await mountGeo({ readonly: true }, { where: POINT })
    expect(wrapper.find('.q-geo').classes()).toContain('q-form-readonly')
    expect(wrapper.find('.q-geo__toolbar').exists()).toBe(false)
    expect(lastMap().setGeometry).toHaveBeenCalledWith(POINT, true)
    expect(lastMap().setMode).toHaveBeenLastCalledWith(undefined, { minPoints: undefined, maxPoints: undefined })
    const [lat] = wrapper.findAllComponents(QInput)
    expect(lat!.props('readonly')).toBe(true)
    // no inputs to display without a value
    const empty = await mountGeo({ readonly: true })
    expect(empty.find('.q-geo__inputs').exists()).toBe(false)
  })

  it('is disabled by an enabled rule', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('where', {}, { rules: { enabled: 'truthy(show)' } }), { type: 'Control', scope: '#/properties/show' }), modelValue: {} })
    await waitForMaps(1)
    await flush()
    const map = lastMap()
    expect(wrapper.find('.q-geo').classes()).toContain('disabled')
    expect(map.setMode).toHaveBeenLastCalledWith(undefined, { minPoints: undefined, maxPoints: undefined })
    expect(wrapper.find('.q-geo__clear').attributes('disabled')).toBeDefined()
    await wrapper.setProps({ modelValue: { show: true } })
    await flush()
    expect(wrapper.find('.q-geo').classes()).not.toContain('disabled')
    expect(map.setMode).toHaveBeenLastCalledWith('point', { minPoints: undefined, maxPoints: undefined })
  })

  it('loses its value and its map when hidden, gets a new map when shown again', async () => {
    const wrapper = mountForm({ schema, uischema: uischema(control('where', {}, { rules: { visible: 'truthy(show)' } }), { type: 'Control', scope: '#/properties/show' }), modelValue: { where: POINT, show: true } })
    await waitForMaps(1)
    await flush()
    await wrapper.setProps({ modelValue: { where: POINT, show: false } })
    await flush()
    expect(wrapper.find('.q-geo-renderer').exists()).toBe(false)
    expect(lastData(wrapper)).toEqual({ show: false })
    expect(maps[0]!.destroy).toHaveBeenCalled()
    await wrapper.setProps({ modelValue: { show: true } })
    await waitForMaps(2)
  })

  it('destroys the map when unmounted', async () => {
    const wrapper = await mountGeo()
    wrapper.unmount()
    expect(lastMap().destroy).toHaveBeenCalled()
  })

  it('shows the error of a required value under the map, else the hint', async () => {
    const wrapper = mountForm({
      schema,
      uischema: uischema(control('where', {}, { hint: 'Click the map' })),
      modelValue: {},
      validationMode: 'ValidateAndShow',
    })
    await waitForMaps(1)
    await flush()
    expect(wrapper.find('.q-form-error').text()).toBe('This field is required')
    expect(wrapper.find('.q-form-hint').exists()).toBe(false)
    expect(wrapper.find('.q-geo__latitude').classes()).toContain('q-field--error')
    lastMap().options.onChange(POINT)
    await flush()
    expect(wrapper.find('.q-form-error').exists()).toBe(false)
    expect(wrapper.find('.q-form-hint').text()).toBe('Click the map')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { mountForm, flush } from './utils'

// the map module cannot be loaded (OpenLayers missing, network...): the
// control stays usable through its inputs
vi.mock('../src/utils/geo-map', () => {
  throw new Error('cannot load ol')
})

describe('QGeoRenderer without its map module', () => {
  it('shows a placeholder and keeps the inputs', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mountForm({
      schema: { type: 'object', properties: { where: { type: 'object', format: 'geo' } } },
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/where' }] },
      modelValue: {},
    })
    await flush()
    await vi.waitFor(() => { expect(wrapper.find('.q-geo__placeholder .text-caption').text()).toBe('The map could not be loaded') })
    expect(wrapper.find('.q-geo__inputs').exists()).toBe(true)
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})

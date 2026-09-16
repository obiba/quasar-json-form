import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'
import { countryCodes } from '../src/data/countries'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

describe('countries', () => {
  const schema = {
    type: 'object',
    properties: {
      country: { type: 'string', format: 'countries', title: 'Country' },
      countries: { type: 'array', format: 'obibaCountriesUiSelect', title: 'Countries', items: { type: 'string' } },
    },
  }

  it('displays the country names of the current locale for ISO codes', async () => {
    let wrapper = mountForm({ schema, config: { countries: countryCodes }, modelValue: { country: 'CAN', countries: ['CAN', 'DEU'] } })
    await flush()
    const selects = wrapper.findAll('.q-countries-select')
    expect(selects.length).toBe(2)
    expect(selects[0]!.find('.q-field__native').text()).toBe('Canada')
    expect(selects[1]!.findAll('.q-chip__content').map((c) => c.text())).toEqual(['Canada', 'Germany'])
    wrapper.unmount()

    wrapper = mountForm({ schema, config: { countries: countryCodes }, modelValue: { country: 'DEU' } }, { locale: 'fr' })
    await flush()
    expect(wrapper.find('.q-countries-select .q-field__native').text()).toBe('Allemagne')
    wrapper.unmount()
  })

  it('accepts a plain list from the control options', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/country', options: { countries: [{ code: 'XX', name: 'Nowhere' }] } }],
      },
      modelValue: { country: 'XX' },
    })
    await flush()
    expect(wrapper.find('.q-countries-select .q-field__native').text()).toBe('Nowhere')
    wrapper.unmount()
  })

  it('drops an emptied selection', async () => {
    const wrapper = mountForm({ schema, config: { countries: countryCodes }, modelValue: { countries: ['CAN'] } })
    await flush()
    await wrapper.findAll('.q-countries-select')[1]!.find('.q-chip__icon--remove').trigger('click')
    await flush()
    expect(lastData(wrapper).countries).toBeUndefined()
    wrapper.unmount()
  })

  it('renders read-only', async () => {
    const wrapper = mountForm({ schema, readonly: true, config: { countries: countryCodes }, modelValue: { country: 'CAN' } })
    await flush()
    expect(wrapper.find('.q-countries-select').classes()).toContain('q-field--readonly')
    wrapper.unmount()
  })
})

describe('typeahead', () => {
  const schema = {
    type: 'object',
    properties: {
      role: { type: 'string', format: 'typeahead', title: 'Role', examples: ['analyst', 'investigator'] },
    },
  }

  it('renders a select with the suggestions', async () => {
    const wrapper = mountForm({ schema, modelValue: { role: 'analyst' } })
    await flush()
    const select = wrapper.find('.q-typeahead')
    expect(select.exists()).toBe(true)
    expect((select.find('input').element as HTMLInputElement).value).toBe('analyst')
    wrapper.unmount()
  })

  it('takes the suggestions from the control options', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/role', options: { values: [{ label: 'Chief', value: 'pi' }] } }] },
      modelValue: { role: 'pi' },
    })
    await flush()
    expect((wrapper.find('.q-typeahead input').element as HTMLInputElement).value).toBe('Chief')
    wrapper.unmount()
  })
})

import { describe, it, expect } from 'vitest'
import { createAjv } from '@jsonforms/core'
import { mountForm, flush } from './utils'
import { createDefaultAjv, CUSTOM_FORMATS } from '../src/components/QJsonForm'

const lastData = (wrapper: any) => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0] as any
}

const lastErrors = (wrapper: any) => {
  const emitted = wrapper.emitted('update:errors')!
  return emitted[emitted.length - 1]![0] as any[]
}

describe('QJsonForm', () => {
  it('generates a default layout from the schema properties', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { a: { type: 'string', title: 'A' }, b: { type: 'boolean', title: 'B' } } },
      modelValue: {},
    })
    await flush()
    const root = wrapper.find('.json-form-wrapper > .q-vertical-layout')
    expect(root.exists()).toBe(true)
    expect(root.findAll(':scope > .q-field').length).toBe(1)
    expect(root.findAll('.q-toggle').length).toBe(1)
    wrapper.unmount()
  })

  it('renders an empty layout for a schema without properties', async () => {
    const wrapper = mountForm({ schema: { type: 'object' }, modelValue: {} })
    await flush()
    const root = wrapper.find('.json-form-wrapper > .q-vertical-layout')
    expect(root.exists()).toBe(true)
    expect(root.element.children.length).toBe(0)
    wrapper.unmount()
  })

  it('registers the custom formats on the default AJV instance', () => {
    const ajv = createDefaultAjv()
    for (const format of CUSTOM_FORMATS) {
      expect(ajv.formats[format], format).toBeDefined()
    }
    // still validates the standard formats
    const validate = ajv.compile({ type: 'string', format: 'date' })
    expect(validate('2020-01-01')).toBe(true)
    expect(validate('nope')).toBe(false)
  })

  it('accepts a custom AJV instance', async () => {
    const ajv = createAjv()
    ajv.addFormat('even', (value: string) => Number(value) % 2 === 0)
    const wrapper = mountForm({
      schema: { type: 'object', properties: { n: { type: 'string', title: 'N', format: 'even' } } },
      modelValue: { n: '3' },
      ajv,
    })
    await flush()
    expect(lastErrors(wrapper).map((e) => e.keyword)).toEqual(['format'])
    expect(wrapper.find('.q-field__messages').text()).toBe('Must be a valid even')
    wrapper.unmount()
  })

  it('emits the data on change', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { a: { type: 'string', title: 'A' } } },
      modelValue: { a: 'x' },
    })
    await flush()
    await wrapper.find('input').setValue('y')
    await flush()
    expect(lastData(wrapper)).toEqual({ a: 'y' })
    wrapper.unmount()
  })
})

describe('group and section', () => {
  const schema = { type: 'object', properties: { a: { type: 'string', title: 'A' }, show: { type: 'boolean' } } }

  it('renders the group description and hint as markdown with custom classes', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'Group',
        title: 'Address',
        description: 'Where you *live*',
        hint: 'Be **precise**',
        titleClass: 'ttl',
        descriptionClass: 'dsc',
        hintClass: 'hnt',
        elements: [{ type: 'Control', scope: '#/properties/a' }],
      },
      modelValue: {},
    })
    await flush()
    const group = wrapper.find('.q-group-renderer')
    expect(group.find('.q-form-title.ttl').text()).toBe('Address')
    expect(group.find('.q-form-description.dsc').html()).toContain('<em>live</em>')
    expect(group.find('.q-form-hint.hnt').html()).toContain('<strong>precise</strong>')
    expect(group.findAll('.q-field').length).toBe(1)
    wrapper.unmount()
  })

  it('renders a group without title, description or elements', async () => {
    const wrapper = mountForm({ schema, uischema: { type: 'Group' }, modelValue: {} })
    await flush()
    const group = wrapper.find('.q-group-renderer')
    expect(group.exists()).toBe(true)
    expect(group.element.children.length).toBe(0)
    wrapper.unmount()
  })

  it('disables the controls of a group whose enabled rule is false', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'Group', rules: { enabled: 'truthy(show)' }, elements: [{ type: 'Control', scope: '#/properties/a' }] },
      modelValue: { show: false },
    })
    await flush()
    expect(wrapper.find('.q-field').classes()).toContain('q-field--disabled')
    wrapper.unmount()
  })

  it('follows the enabled rule of a group when the data changes', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Group', rules: { enabled: 'truthy(show)' }, elements: [{ type: 'Control', scope: '#/properties/a' }] },
        ],
      },
      modelValue: { show: true },
    })
    await flush()
    const field = () => wrapper.find('.q-group-renderer .q-field')
    expect(field().classes()).not.toContain('q-field--disabled')
    await wrapper.setProps({ modelValue: { show: false } })
    await flush()
    expect(field().classes()).toContain('q-field--disabled')
    await wrapper.setProps({ modelValue: { show: true } })
    await flush()
    expect(field().classes()).not.toContain('q-field--disabled')
    wrapper.unmount()
  })

  it('renders the section label and description with custom classes', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [{ type: 'Section', label: 'section.title', description: 'A *note*', labelClass: 'lbl', descriptionClass: 'dsc' }],
      },
      modelValue: {},
    }, { messages: { en: { section: { title: 'Details' } } } })
    await flush()
    const section = wrapper.find('.q-section-renderer')
    expect(section.find('.q-form-label.lbl').text()).toBe('Details')
    expect(section.find('.dsc').html()).toContain('<em>note</em>')
    wrapper.unmount()
  })

  it('disables the controls of a layout whose enabled rule is false', async () => {
    const wrapper = mountForm({
      schema,
      uischema: { type: 'HorizontalLayout', rules: { enabled: 'truthy(show)' }, elements: [{ type: 'Control', scope: '#/properties/a' }] },
      modelValue: { show: false },
    })
    await flush()
    expect(wrapper.find('.q-horizontal-layout .q-field').classes()).toContain('q-field--disabled')
    wrapper.unmount()
  })
})

describe('string renderer visibility', () => {
  it('clears the value of a string control when hidden', async () => {
    const wrapper = mountForm({
      schema: { type: 'object', properties: { a: { type: 'string', title: 'A' }, show: { type: 'boolean' } } },
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Control', scope: '#/properties/a', rules: { visible: 'truthy(show)' } },
        ],
      },
      modelValue: { a: 'x', show: true },
    })
    await flush()
    await wrapper.setProps({ modelValue: { a: 'x', show: false } })
    await flush()
    expect(lastData(wrapper).a).toBeUndefined()
    wrapper.unmount()
  })

  it('moves the reported errors of a control whose path changes', async () => {
    const schema = { type: 'object', properties: { a: { type: 'string', title: 'A' }, b: { type: 'string', title: 'B' } } }
    const control = (name: string) => ({
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: `#/properties/${name}`, options: { wordMax: 1 } }],
    })
    const wrapper = mountForm({ schema, uischema: control('a'), modelValue: { a: 'x y', b: 'p q r' } })
    await flush()
    expect(lastErrors(wrapper).map((e) => [e.keyword, e.instancePath])).toEqual([['wordLimit', '/a']])
    await wrapper.setProps({ uischema: control('b') })
    await flush()
    expect(lastErrors(wrapper).map((e) => [e.keyword, e.instancePath])).toEqual([['wordLimit', '/b']])
    wrapper.unmount()
  })
})

describe('countries renderer extras', () => {
  const schema = {
    type: 'object',
    properties: {
      country: { type: 'string', format: 'countries', title: 'Country' },
      show: { type: 'boolean' },
    },
  }
  const byLocale = { en: [{ code: 'FRA', name: 'France' }], fr: [{ code: 'FRA', name: 'La France' }] }

  it('selects the list of the current locale from a locale map', async () => {
    let wrapper = mountForm({ schema, config: { countries: byLocale }, modelValue: { country: 'FRA' } })
    await flush()
    expect(wrapper.find('.q-countries-select .q-field__native').text()).toBe('France')
    wrapper.unmount()

    wrapper = mountForm({ schema, config: { countries: byLocale }, modelValue: { country: 'FRA' } }, { locale: 'fr-CA' })
    await flush()
    expect(wrapper.find('.q-countries-select .q-field__native').text()).toBe('La France')
    wrapper.unmount()

    // unknown locale: the first list
    wrapper = mountForm({ schema, config: { countries: byLocale }, modelValue: { country: 'FRA' } }, { locale: 'de' })
    await flush()
    expect(wrapper.find('.q-countries-select .q-field__native').text()).toBe('France')
    wrapper.unmount()
  })

  it('accepts an application-level countries provide and has no options otherwise', async () => {
    let wrapper = mountForm({ schema, modelValue: { country: 'FRA' } }, { provide: { 'jsonforms-countries': byLocale.en } })
    await flush()
    expect(wrapper.find('.q-countries-select .q-field__native').text()).toBe('France')
    wrapper.unmount()

    wrapper = mountForm({ schema, modelValue: {} })
    await flush()
    expect(wrapper.findComponent({ name: 'QSelect' }).props('options')).toEqual([])
    wrapper.unmount()
  })

  it('filters on the name or the code', async () => {
    const wrapper = mountForm({
      schema,
      config: { countries: [{ code: 'FRA', name: 'France' }, { code: 'DEU', name: 'Germany' }, { code: 'X' }] },
      modelValue: {},
    })
    await flush()
    const select = wrapper.findComponent({ name: 'QSelect' })
    expect(select.props('options')).toEqual([
      { label: 'France', value: 'FRA' },
      { label: 'Germany', value: 'DEU' },
      { label: 'X', value: 'X' },
    ])
    const filter = async (needle: string) => {
      select.vm.$emit('filter', needle, (fn: () => void) => fn(), () => {})
      await flush()
    }
    await filter('germ')
    expect(select.props('options')).toEqual([{ label: 'Germany', value: 'DEU' }])
    await filter('fr')
    expect(select.props('options')).toEqual([{ label: 'France', value: 'FRA' }])
    await filter('')
    expect(select.props('options').length).toBe(3)
    wrapper.unmount()
  })

  it('clears the value when hidden', async () => {
    const wrapper = mountForm({
      schema,
      config: { countries: byLocale.en },
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/show' },
          { type: 'Control', scope: '#/properties/country', rules: { visible: 'truthy(show)' } },
        ],
      },
      modelValue: { country: 'FRA', show: true },
    })
    await flush()
    await wrapper.setProps({ modelValue: { country: 'FRA', show: false } })
    await flush()
    expect(wrapper.find('.q-countries-select').exists()).toBe(false)
    expect(lastData(wrapper).country).toBeUndefined()
    wrapper.unmount()
  })
})

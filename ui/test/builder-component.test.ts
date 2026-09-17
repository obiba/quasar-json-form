/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import QJsonFormBuilder from '../src/builder/QJsonFormBuilder'
import { recognize } from '../src/builder'
import type { FormDefinition } from '../src/builder'
import { createTestI18n, flush } from './utils'

const form: FormDefinition = {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'name.title', minLength: 2 },
      role: { type: 'string', oneOf: [{ const: 'a', title: 'role.options.a' }, { const: 'b', title: 'B' }] },
    },
    required: ['name'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/name', hint: 'name.hint' },
      { type: 'Group', label: 'group.1.label', elements: [{ type: 'Control', scope: '#/properties/role', options: { format: 'radio' } }] },
    ],
  },
  translations: { en: { 'name.title': 'Name', 'name.hint': 'Hint', 'role.options.a': 'A', 'group.1.label': 'Group' }, fr: { 'name.title': 'Nom' } },
}

function mountBuilder(props: Record<string, any> = {}) {
  return mount(QJsonFormBuilder as any, {
    props: { modelValue: structuredClone(form), languages: ['en', 'fr'], ...props },
    global: { plugins: [Quasar, createTestI18n()] },
    attachTo: document.body,
  })
}

const rows = (wrapper: any) => wrapper.findAll('.q-builder-row')
const rowLabels = (wrapper: any) => rows(wrapper).map((r: any) => r.find('.q-builder-label').text())
const lastEmitted = (wrapper: any): FormDefinition => {
  const emitted = wrapper.emitted('update:modelValue')!
  return emitted[emitted.length - 1]![0]
}
const setInput = async (wrapper: any, label: string, value: string) => {
  const input = wrapper.findAll('label.q-field').find((f: any) => f.find('.q-field__label').exists() && f.find('.q-field__label').text() === label)
  expect(input, label).toBeDefined()
  const native = input!.find('input, textarea')
  await native.setValue(value)
  await flush()
}

describe('QJsonFormBuilder', () => {
  it('outlines the form in the builder language', async () => {
    const wrapper = mountBuilder()
    await flush()
    expect(rowLabels(wrapper)).toEqual(['Form', 'Name', 'Group', 'role'])
    // the root is selected: no key input, the palette is on the layouts
    expect(rows(wrapper)[0]!.classes()).toContain('q-builder-selected')
    expect(wrapper.findAll('.q-builder-row .q-btn').length).toBe(2 + 3)
    wrapper.unmount()
  })

  it('edits the texts of the selected control and emits the form', async () => {
    const wrapper = mountBuilder()
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await flush()
    // key and required of the `name` control
    const key = wrapper.find('.q-builder-properties input')
    expect((key.element as HTMLInputElement).value).toBe('name')
    expect(wrapper.find('.q-builder-properties .q-toggle[aria-checked="true"]').exists()).toBe(true)
    await setInput(wrapper, 'title', 'Full name')
    let emitted = lastEmitted(wrapper)
    expect(emitted.translations!.en!['name.title']).toBe('Full name')
    expect(emitted.schema.properties.name.title).toBe('name.title')
    expect(rowLabels(wrapper)[1]).toBe('Full name')
    // a literal becomes a key on first edit
    await setInput(wrapper, 'description', 'Described')
    emitted = lastEmitted(wrapper)
    expect(emitted.schema.properties.name.description).toBe('name.description')
    expect(emitted.translations!.en!['name.description']).toBe('Described')
    wrapper.unmount()
  })

  it('renames a property and warns about the rules mentioning it', async () => {
    const wrapper = mountBuilder({ modelValue: { ...structuredClone(form), uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/name' }, { type: 'Control', scope: '#/properties/role', rules: { visible: 'isNotEmpty(name)' } }] } } })
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await flush()
    const key = wrapper.find('.q-builder-properties input')
    await key.setValue('fullName')
    await key.trigger('keyup', { key: 'Enter' })
    await flush()
    const emitted = lastEmitted(wrapper)
    expect(Object.keys(emitted.schema.properties)).toEqual(['fullName', 'role'])
    expect(emitted.uischema!.elements[0].scope).toBe('#/properties/fullName')
    expect(emitted.translations!.fr!['fullName.title']).toBe('Nom')
    expect(wrapper.find('.q-banner').text()).toContain('isNotEmpty(name)')
    // an invalid key is refused
    await key.setValue('a.b')
    await key.trigger('keyup', { key: 'Enter' })
    await flush()
    expect(wrapper.find('.q-builder-properties .q-field--error').exists()).toBe(true)
    expect(Object.keys(lastEmitted(wrapper).schema.properties)).toEqual(['fullName', 'role'])
    wrapper.unmount()
  })

  it('removes a node with its property and selects its parent', async () => {
    const wrapper = mountBuilder()
    await flush()
    await rows(wrapper)[3]!.trigger('click')
    await flush()
    const remove = rows(wrapper)[3]!.findAll('.q-btn')[0]!
    await remove.trigger('click')
    await flush()
    expect(rowLabels(wrapper)).toEqual(['Form', 'Name', 'Group'])
    expect(rows(wrapper)[2]!.classes()).toContain('q-builder-selected')
    const emitted = lastEmitted(wrapper)
    expect(emitted.schema.properties.role).toBeUndefined()
    expect(emitted.uischema!.elements[1].elements).toEqual([])
    wrapper.unmount()
  })

  it('edits the choices of a control', async () => {
    const wrapper = mountBuilder()
    await flush()
    await rows(wrapper)[3]!.trigger('click')
    await flush()
    const fields = (label: string) => wrapper.findAll('label.q-field').filter((f: any) => f.find('.q-field__label').exists() && f.find('.q-field__label').text() === label)
    const values = fields('Value')
    expect(values.length).toBe(2)
    await values[1]!.find('input').setValue('c')
    await flush()
    let emitted = lastEmitted(wrapper)
    expect(emitted.schema.properties.role.oneOf[1]).toEqual({ const: 'c', title: 'B' })
    const labels = fields('Label')
    await labels[1]!.find('input').setValue('See')
    await flush()
    emitted = lastEmitted(wrapper)
    expect(emitted.schema.properties.role.oneOf[1]).toEqual({ const: 'c', title: 'role.options.c' })
    expect(emitted.translations!.en!['role.options.c']).toBe('See')
    wrapper.unmount()
  })

  it('previews the form in the selected language and lists the translations', async () => {
    const wrapper = mountBuilder({ locale: 'fr' })
    await flush()
    expect(rowLabels(wrapper)[1]).toBe('Nom')
    const tabs = wrapper.findAll('.q-tab')
    await tabs.find((t: any) => t.text() === 'Aperçu' || t.text() === 'Preview')!.trigger('click')
    await flush(5)
    expect(wrapper.find('.q-builder-preview .q-form-title').text()).toBe('Nom *')
    await tabs.find((t: any) => t.text() === 'Translations')!.trigger('click')
    await flush(5)
    const table = wrapper.find('.q-builder-translations')
    expect(table.findAll('tbody tr').length).toBe(4)
    expect(table.findAll('td.q-builder-missing').length).toBe(3)
    wrapper.unmount()
  })

  it('reloads when the form changes outside, but not on its own echo', async () => {
    const wrapper = mountBuilder()
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await setInput(wrapper, 'title', 'Changed')
    const echo = lastEmitted(wrapper)
    await wrapper.setProps({ modelValue: echo })
    await flush()
    expect(rows(wrapper)[1]!.classes()).toContain('q-builder-selected')
    await wrapper.setProps({ modelValue: { schema: { type: 'object', properties: { other: { type: 'string', title: 'Other' } } } } })
    await flush()
    expect(rowLabels(wrapper)).toEqual(['Form', 'Other'])
    expect(rows(wrapper)[0]!.classes()).toContain('q-builder-selected')
    wrapper.unmount()
  })

  it('replaces a part of the form from the source tab', async () => {
    const wrapper = mountBuilder()
    await flush()
    await wrapper.findAll('.q-tab').find((t: any) => t.text() === 'Source')!.trigger('click')
    await flush(5)
    const source = wrapper.find('.q-builder-source')
    await source.find('textarea').setValue(JSON.stringify({ type: 'object', properties: { x: { type: 'number' } } }))
    await source.find('.q-btn').trigger('click')
    await flush(5)
    expect(lastEmitted(wrapper).schema.properties).toEqual({ x: { type: 'number' } })
    await source.find('textarea').setValue('{ nope')
    await source.find('.q-btn').trigger('click')
    await flush()
    expect(source.find('.q-field--error').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('recognize', () => {
  it('tells a form, a schema and an angular-schema-form pair apart', () => {
    expect(recognize(form)).toEqual({ kind: 'form', definition: form })
    expect(recognize({ schema: form.schema })).toEqual({ kind: 'form', definition: { schema: form.schema, uischema: undefined, translations: undefined } })
    expect(recognize(form.schema)).toEqual({ kind: 'form', definition: { schema: form.schema } })
    expect(recognize({ schema: form.schema, definition: ['name'] })).toEqual({ kind: 'asf', schema: form.schema, definition: ['name'] })
    expect(recognize({ properties: {} })!.kind).toBe('form')
    expect(recognize([])).toBeUndefined()
    expect(recognize({ foo: 1 })).toBeUndefined()
    expect(recognize('x')).toBeUndefined()
  })
})

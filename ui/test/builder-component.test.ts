/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { Quasar } from 'quasar'
import QJsonFormBuilder from '../src/builder/QJsonFormBuilder'
import { recognize, builderApi, optionsSchema, rawOptions } from '../src/builder'
import { catalog } from '../src/catalog'
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

  it('filters the outline by key or label, keeping the ancestors', async () => {
    const wrapper = mountBuilder()
    await flush()
    const shown = () => rows(wrapper).filter((r: any) => r.element.closest('li[style*="none"]') === null).map((r: any) => r.find('.q-builder-label').text())
    const filter = wrapper.find('.q-builder-tree input')
    await filter.setValue('ROLE')
    await flush()
    expect(shown()).toEqual(['Form', 'Group', 'role'])
    await filter.setValue('name')
    await flush()
    expect(shown()).toEqual(['Form', 'Name'])
    await filter.setValue('')
    await flush()
    expect(shown()).toEqual(['Form', 'Name', 'Group', 'role'])
    wrapper.unmount()
  })

  it('navigates up and down the outline, through the children', async () => {
    const wrapper = mountBuilder()
    await flush()
    const selectedLabel = () => wrapper.find('.q-builder-selected .q-builder-label').text()
    const navButton = (index: 0 | 1) => wrapper.findAll('.q-builder-properties .q-btn')[index]!
    const nav = async (index: 0 | 1) => {
      await navButton(index).trigger('click')
      await flush()
    }
    // the root has nothing before it
    expect(navButton(0).attributes('disabled')).toBeDefined()
    for (const label of ['Name', 'Group', 'role']) {
      await nav(1)
      expect(selectedLabel()).toBe(label)
    }
    // the last node of the outline has nothing after it
    expect(navButton(1).attributes('disabled')).toBeDefined()
    for (const label of ['Group', 'Name', 'Form']) {
      await nav(0)
      expect(selectedLabel()).toBe(label)
    }
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

  it('rejects a raw element whose type would change the kind of the node', async () => {
    const wrapper = mountBuilder()
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await flush()
    const raw = wrapper.findAll('label.q-field').find((f: any) => f.find('.q-field__label').exists() && f.find('.q-field__label').text() === 'UI schema element')!
    const apply = raw.element.parentElement!.querySelector('button')!
    await raw.find('textarea').setValue('{ "type": "Group", "label": "x" }')
    await flush()
    apply.click()
    await flush()
    expect(raw.classes()).toContain('q-field--error')
    expect(rowLabels(wrapper)[1]).toBe('Name')
    await raw.find('textarea').setValue('{ "type": "Control", "hint": "name.hint", "options": { "readonly": true } }')
    await flush()
    apply.click()
    await flush()
    expect(raw.classes()).not.toContain('q-field--error')
    const emitted = lastEmitted(wrapper)
    expect(emitted.uischema!.elements[0]).toEqual({ type: 'Control', scope: '#/properties/name', hint: 'name.hint', options: { readonly: true } })
    wrapper.unmount()
  })

  it('keeps the scope of a control that is not bound to a property when its raw element is applied', async () => {
    const wrapper = mountBuilder({
      modelValue: {
        schema: { type: 'object', definitions: { name: { type: 'string' } }, properties: { name: { $ref: '#/definitions/name' } } },
        uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/definitions/name' }] },
      },
    })
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await flush()
    const raw = wrapper.findAll('label.q-field').find((f: any) => f.find('.q-field__label').exists() && f.find('.q-field__label').text() === 'UI schema element')!
    expect(JSON.parse(raw.find('textarea').element.value)).toEqual({ type: 'Control', scope: '#/definitions/name' })
    await raw.find('textarea').setValue('{ "type": "Control", "scope": "#/definitions/name", "hint": "A hint" }')
    await flush()
    raw.element.parentElement!.querySelector('button')!.click()
    await flush()
    expect(raw.classes()).not.toContain('q-field--error')
    expect(lastEmitted(wrapper).uischema!.elements[0]).toEqual({ type: 'Control', scope: '#/definitions/name', hint: 'A hint' })
    wrapper.unmount()
  })

  it('edits the labels of an enum, converting it to oneOf, and keeps the other options', async () => {
    const wrapper = mountBuilder({ modelValue: {
      schema: { type: 'object', properties: { size: { type: 'integer', enum: [1, 2] } } },
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/size', options: { format: 'radio', inline: true } }] },
      translations: { en: { '1': 'One' } },
    } })
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await flush()
    const fields = (label: string) => wrapper.findAll('label.q-field').filter((f: any) => f.find('.q-field__label').exists() && f.find('.q-field__label').text() === label)
    expect((fields('Label')[0]!.find('input').element as HTMLInputElement).value).toBe('One')
    // retyping a value as it is leaves the enum alone
    await fields('Value')[0]!.find('input').setValue('1')
    await flush()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await fields('Label')[1]!.find('input').setValue('Two')
    await flush()
    let emitted = lastEmitted(wrapper)
    expect(emitted.schema.properties.size.enum).toBeUndefined()
    expect(emitted.schema.properties.size.oneOf).toEqual([{ const: 1, title: '1' }, { const: 2, title: 'size.options.2' }])
    expect(emitted.translations!.en!['size.options.2']).toBe('Two')
    // a number stays a number
    await fields('Value')[1]!.find('input').setValue('3')
    await flush()
    emitted = lastEmitted(wrapper)
    expect(emitted.schema.properties.size.oneOf[1]).toEqual({ const: 3, title: 'size.options.3' })
    expect(emitted.translations!.en!['size.options.3']).toBe('Two')
    // the settings form (here the common `readonly` option) keeps the other options
    const readonly = wrapper.findAll('.q-builder-properties .q-toggle').find((t: any) => t.element.closest('[class*="renderer"]')?.textContent?.includes('readonly'))!
    await readonly.trigger('click')
    await flush()
    emitted = lastEmitted(wrapper)
    expect(emitted.uischema!.elements[0].options).toEqual({ format: 'radio', inline: true, readonly: true })
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

  it('follows the locale prop when it is one of the languages', async () => {
    const wrapper = mountBuilder({ locale: 'fr' })
    await flush()
    expect(rowLabels(wrapper)[1]).toBe('Nom')
    await wrapper.setProps({ locale: 'en' })
    await flush()
    expect(rowLabels(wrapper)[1]).toBe('Name')
    await wrapper.setProps({ locale: 'de' })
    await flush()
    expect(rowLabels(wrapper)[1]).toBe('Name')
    // the language of the prop arrives with a form, while the selected one goes
    await wrapper.setProps({ languages: [], modelValue: { schema: { type: 'object', properties: { name: { type: 'string', title: 'name.title' } } }, translations: { es: { 'name.title': 'Nombre' }, de: { 'name.title': 'Vorname' } } } })
    await flush()
    expect(rowLabels(wrapper)[1]).toBe('Vorname')
    wrapper.unmount()
  })

  it('clears a text from the preview too', async () => {
    const wrapper = mountBuilder({ modelValue: { schema: { type: 'object', properties: { name: { type: 'string', title: 'name.title' } } }, translations: { en: { 'name.title': 'Name' } } }, languages: ['en'] })
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await setInput(wrapper, 'title', '')
    expect(lastEmitted(wrapper).schema.properties.name.title).toBeUndefined()
    await wrapper.findAll('.q-tab').find((t: any) => t.text() === 'Preview')!.trigger('click')
    await flush(5)
    expect(wrapper.find('.q-builder-preview .q-form-title').exists()).toBe(false)
    expect(rowLabels(wrapper)[1]).toBe('name')
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

describe('import dialog', () => {
  it('opens from the toolbar whichever tab is shown, and imports a pasted form', async () => {
    const wrapper = mountBuilder()
    await flush()
    const importButton = wrapper.findAll('.q-json-form-builder > .row .q-btn').find((b: any) => b.text().includes('Import'))!
    await importButton.trigger('click')
    await flush(5)
    const dialog = document.body.querySelector('.q-builder-import')
    expect(dialog).not.toBeNull()
    const textarea = dialog!.querySelector('textarea')!
    textarea.value = JSON.stringify({ schema: { type: 'object', properties: { imported: { type: 'string' } } } })
    textarea.dispatchEvent(new Event('input'))
    await flush()
    const buttons = Array.from(dialog!.querySelectorAll('.q-card__actions .q-btn'))
    ;(buttons[buttons.length - 1] as HTMLElement).click()
    await flush(5)
    expect(lastEmitted(wrapper).schema.properties).toEqual({ imported: { type: 'string' } })
    expect(rowLabels(wrapper)).toEqual(['Form', 'imported'])
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

describe('settings', () => {
  it('selects the known values of an option, several when it takes an array', () => {
    expect(optionsSchema(catalog.QGeoRenderer)!.properties.geometries).toMatchObject({ type: 'array', uniqueItems: true, items: { enum: ['point', 'linestring', 'polygon'] } })
    expect(rawOptions(catalog.QGeoRenderer).geometries).toBeUndefined()
  })

  it('shows a comma separated list of values in the select, without rewriting it', async () => {
    const wrapper = mountBuilder({
      modelValue: {
        schema: { type: 'object', properties: { loc: { type: 'object', format: 'geo' } } },
        uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/loc', options: { geometries: 'point, polygon' } }] },
      },
    })
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await flush()
    const settings = wrapper.findAll('.q-builder-section').find((c: any) => c.text().startsWith('Settings'))!
    const select = settings.findAll('.q-select-renderer').find((f: any) => f.text().includes('geometries'))!
    expect(select.text()).toContain('point')
    expect(select.text()).toContain('polygon')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  const gridForm = (areas: unknown): FormDefinition => ({
    schema: { type: 'object', properties: { a: { type: 'string' } } },
    uischema: { type: 'VerticalLayout', elements: [{ type: 'GridLayout', options: { areas }, elements: [{ type: 'Control', scope: '#/properties/a' }] }] },
  })
  const settingsOf = async (wrapper: any) => {
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await flush()
    return wrapper.findAll('.q-builder-section').find((c: any) => c.text().startsWith('Settings'))!
  }

  it('shows an array of a string option joined with commas', async () => {
    const wrapper = mountBuilder({ modelValue: gridForm(['a a', 'b c']) })
    const settings = await settingsOf(wrapper)
    const field = settings.findAll('.q-string-renderer').find((r: any) => r.find('.q-form-title').text() === 'areas')!
    expect((field.find('input').element as HTMLInputElement).value).toBe('a a, b c')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    await field.find('input').setValue('a a, b d')
    await flush()
    expect(lastEmitted(wrapper).uischema!.elements[0].options.areas).toBe('a a, b d')
    wrapper.unmount()
  })

  it('leaves an object of a string option to the JSON', async () => {
    const wrapper = mountBuilder({ modelValue: gridForm({ xs: ['a', 'b'], md: ['a b'] }) })
    const settings = await settingsOf(wrapper)
    expect(settings.findAll('.q-form-title').map((l: any) => l.text())).not.toContain('areas')
    expect(settings.findAll('.q-chip').map((c: any) => c.text())).toContain('areas')
    wrapper.unmount()
  })
})

describe('images', () => {
  const imageForm = (format: string, options: Record<string, any> = {}): FormDefinition => ({
    schema: { type: 'object', properties: { pic: { type: 'string', oneOf: [{ const: 'a', title: 'A' }, { const: 'b', title: 'B' }] } } },
    uischema: { type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/pic', options: { format, ...options } }] },
  })
  /** clicks the file button of an image input, the file picker giving a PNG of these bytes */
  const pickFile = async (bytes: Uint8Array<ArrayBuffer>, click: () => Promise<void>) => {
    const createElement = document.createElement.bind(document)
    const spy = vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
      const element = createElement(tag, options)
      if (tag === 'input') {
        Object.defineProperty(element, 'files', { value: [new File([bytes], 'b.png', { type: 'image/png' })] })
        element.click = () => (element as HTMLInputElement).onchange!(new Event('change'))
      }
      return element
    })
    await click()
    spy.mockRestore()
  }
  const imageField = (wrapper: any, title: string) => wrapper.findAll('.q-builder-section').find((c: any) => c.text().startsWith(title))!
    .findAll('label.q-field').find((f: any) => f.find('.q-field__label').exists() && f.find('.q-field__label').text() === (title === 'Choices' ? 'Image' : 'image'))

  it('sets the image of each choice of the images control', async () => {
    const wrapper = mountBuilder({ modelValue: imageForm('images') })
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await flush()
    await imageField(wrapper, 'Choices')!.find('input').setValue('https://example.org/a.png')
    await flush()
    expect(lastEmitted(wrapper).schema.properties.pic.oneOf[0]).toEqual({ const: 'a', title: 'A', image: 'https://example.org/a.png' })
    // a local file, read as a data URI
    const choices = () => wrapper.findAll('.q-builder-section').find((c: any) => c.text().startsWith('Choices'))!
    await pickFile(new Uint8Array([1, 2, 3]), () => choices().findAll('.q-field__append .q-btn')[1]!.trigger('click'))
    await vi.waitFor(() => expect(lastEmitted(wrapper).schema.properties.pic.oneOf[1].image).toBe('data:image/png;base64,AQID'))
    // a file too large to be embedded is refused
    const emitted = wrapper.emitted('update:modelValue')!.length
    await pickFile(new Uint8Array(600_000), () => choices().findAll('.q-field__append .q-btn')[0]!.trigger('click'))
    await flush()
    expect(wrapper.emitted('update:modelValue')!.length).toBe(emitted)
    expect(choices().find('.q-field--error').text()).toContain('File too large')
    wrapper.unmount()
  })

  it('sets the area of each choice of the image map', async () => {
    const wrapper = mountBuilder({ modelValue: imageForm('image-map') })
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await flush()
    const coords = () => wrapper.findAll('.q-builder-section').find((c: any) => c.text().startsWith('Choices'))!
      .findAll('label.q-field').filter((f: any) => f.find('.q-field__label').exists() && f.find('.q-field__label').text().startsWith('Coordinates'))
    await coords()[0]!.find('input').setValue('0, 0, 10, 20')
    await flush()
    expect(lastEmitted(wrapper).schema.properties.pic.oneOf[0].area).toEqual({ shape: 'rect', coords: [0, 0, 10, 20] })
    // a list being typed is kept as text
    await coords()[1]!.find('input').setValue('5,')
    await flush()
    expect(lastEmitted(wrapper).schema.properties.pic.oneOf[1].area).toEqual({ shape: 'rect', coords: '5,' })
    // numbers without spaces too, the coordinates removed when emptied
    await coords()[1]!.find('input').setValue('5,6,7')
    await flush()
    expect(lastEmitted(wrapper).schema.properties.pic.oneOf[1].area).toEqual({ shape: 'rect', coords: [5, 6, 7] })
    await coords()[1]!.find('input').setValue('')
    await flush()
    expect(lastEmitted(wrapper).schema.properties.pic.oneOf[1].area).toEqual({ shape: 'rect' })
    wrapper.unmount()
  })

  it('sets the image of the image map, keeping its size', async () => {
    const wrapper = mountBuilder({ modelValue: imageForm('image-map', { image: { src: 'old.png', width: 100, height: 50 } }) })
    await flush()
    await rows(wrapper)[1]!.trigger('click')
    await flush()
    const field = imageField(wrapper, 'Settings')!
    expect((field.find('input').element as HTMLInputElement).value).toBe('old.png')
    await field.find('input').setValue('new.png')
    await flush()
    expect(lastEmitted(wrapper).uischema!.elements[0].options.image).toEqual({ src: 'new.png', width: 100, height: 50 })
    // cleared: no image left
    await field.find('input').setValue('')
    await flush()
    expect(lastEmitted(wrapper).uischema!.elements[0].options.image).toBeUndefined()
    wrapper.unmount()
  })
})

describe('api description', () => {
  it('documents every prop and event of the component', () => {
    const component = QJsonFormBuilder as any
    expect(builderApi.name).toBe(component.name)
    expect(builderApi.kind).toBe('form')
    expect(Object.keys(builderApi.props ?? {}).sort()).toEqual(Object.keys(component.props).sort())
    expect(Object.keys(builderApi.events ?? {}).sort()).toEqual([...component.emits].sort())
    for (const section of ['props', 'events'] as const) {
      for (const [key, entry] of Object.entries(builderApi[section] ?? {})) {
        expect(entry.desc.length, `${section}.${key}`).toBeGreaterThan(0)
      }
    }
    expect(() => JSON.parse(builderApi.data!.example!)).not.toThrow()
  })
})

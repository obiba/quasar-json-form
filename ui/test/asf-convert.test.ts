/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { convert, toJsonForms, isAsfDefinition } from '../src/asf'

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string', title: 't(person.name)' },
    email: { type: 'string', title: 'Email', pattern: '^\\S+@\\S+$' },
    notes: { type: 'string' },
    gender: { type: 'string', enum: ['m', 'f'] },
    tags: { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, title: 'Tags' },
    address: {
      type: 'object',
      title: 'Address',
      properties: { street: { type: 'string', title: 'Street' }, city: { type: 'string', title: 'City' } },
    },
    staff: {
      type: 'array',
      items: { type: 'object', properties: { name: { type: 'string', title: 'Name' }, role: { type: 'string' } } },
    },
    aliases: { type: 'array', items: { type: 'object', format: 'localizedString' } },
    desc: { type: 'object', format: 'localizedString', title: 'Description' },
    files: { type: 'object', format: 'obibaFiles' },
    when: { type: 'string', format: 'datepicker' },
    hidden: { type: 'string', 'x-schema-form': { notitle: true, type: 'textarea' } },
  },
  required: ['name'],
}

const quiet = { logger: false as const }

describe('ASF converter', () => {
  it('maps keys to control scopes and strips the t() wrapper', () => {
    const { schema: converted, uischema, diagnostics } = convert(schema, ['name', { key: 'address.city' }], quiet)
    expect(diagnostics).toEqual([])
    expect(uischema).toEqual({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/address/properties/city' },
      ],
    })
    expect(converted.properties.name.title).toBe('person.name')
    // the input is not modified
    expect(schema.properties.name.title).toBe('t(person.name)')
  })

  it('resolves t() tokens with the translate option, also inside HTML', () => {
    const { schema: converted, uischema } = convert(
      schema,
      [{ type: 'help', helpvalue: '<h3>A. t(section.a)</h3><p>t(section.info)</p>' }, 'name'],
      { ...quiet, translate: (key) => `[${key}]` },
    )
    expect(uischema.elements[0]).toEqual({ type: 'Label', text: '<h3>A. [section.a]</h3><p>[section.info]</p>' })
    expect(converted.properties.name.title).toBe('[person.name]')
  })

  it('maps sections, fieldsets and help blocks to layouts, groups and labels with grid classes', () => {
    const { uischema } = convert(schema, [
      { type: 'help', helpvalue: '<h2>Title</h2>', htmlClass: 'text-h6' },
      {
        type: 'fieldset',
        title: 'Contact',
        items: [
          {
            type: 'section',
            htmlClass: 'row',
            items: [
              { type: 'section', htmlClass: 'col-xs-6', items: ['name'] },
              { type: 'section', htmlClass: 'col-xs-12 col-md-6 col-xs-offset-3 hoffset3', items: ['email'] },
            ],
          },
        ],
      },
    ], quiet)
    expect(uischema.elements[0]).toEqual({ type: 'Label', text: '<h2>Title</h2>', options: { class: 'text-h6' } })
    const group = uischema.elements[1]
    expect(group.type).toBe('Group')
    expect(group.label).toBe('Contact')
    const row = group.elements[0]
    expect(row.type).toBe('VerticalLayout')
    expect(row.options.class).toBe('row q-col-gutter-md')
    expect(row.elements[0].options.class).toBe('col-6')
    expect(row.elements[1].options.class).toBe('col-12 col-md-6 offset-3 hoffset3')
    expect(row.elements[1].elements[0].scope).toBe('#/properties/email')
  })

  it('honours the rowClass option', () => {
    const { uischema } = convert(schema, [{ type: 'section', htmlClass: 'row', items: [] }], { ...quiet, rowClass: 'row' })
    expect(uischema.elements[0].options.class).toBe('row')
  })

  it('maps the control options', () => {
    const { schema: converted, uischema } = convert(schema, [
      { key: 'notes', type: 'textarea', notitle: true, wordLimit: '0:500', validationMessage: { wordLimitError: 't(too-long)' }, description: 't(notes.help)', title: 'Notes' },
      { key: 'email', placeholder: 'x@y.z', readonly: true, required: true },
      { key: 'files', type: 'obibaFileUpload', emptyMessage: 't(no-files)', validationMessage: { missingFiles: 't(missing)' }, minItems: 1 },
      { key: 'desc', type: 'obibaSimpleMde', rows: 5, marked: true },
      { key: 'when', dateOptions: { dateFormat: 'yyyy-MM-dd', minDate: 'start', minDateIsRef: true, maxDate: '2030-12-31', validationMessage: { invalidYMDate: 't(bad-date)' } }, validationMessage: 't(date-error)' },
    ], quiet)
    const [notes, email, files, desc, when] = uischema.elements
    expect(notes).toEqual({
      type: 'Control',
      scope: '#/properties/notes',
      label: false,
      options: { rows: 3, wordLimit: '0:500', validationMessage: { wordLimitError: 'too-long' } },
    })
    expect(converted.properties.notes.title).toBe('Notes')
    expect(converted.properties.notes.description).toBe('notes.help')
    expect(email.options).toEqual({ placeholder: 'x@y.z', readonly: true })
    expect(converted.required).toEqual(['name', 'email'])
    expect(files.options).toEqual({ emptyMessage: 'no-files', validationMessage: { missingFiles: 'missing' } })
    expect(converted.properties.files.minItems).toBe(1)
    // the schema format already selects the localized string renderer
    expect(desc.options).toEqual({ rows: 5, marked: true })
    expect(when.options).toEqual({ dateOptions: { dateFormat: 'yyyy-MM-dd' }, max: '2030-12-31', validationMessage: { invalidYMDate: 'bad-date' } })
    expect(when.rules).toEqual({ min: 'start' })
  })

  it('keeps a string validationMessage and merges it with the dateOptions messages', () => {
    const { uischema } = convert(schema, [{ key: 'when', validationMessage: 't(date-error)' }], quiet)
    expect(uischema.elements[0].options.validationMessage).toBe('date-error')
  })

  it('turns titleMap into oneOf and renders enum arrays as checkboxes', () => {
    const { schema: converted, uischema } = convert(schema, [
      { key: 'gender', type: 'radios', titleMap: [{ value: 'm', name: 't(male)' }, { value: 'f', name: 'Female' }] },
      { key: 'tags', titleMap: { a: 'A', b: 'B' } },
    ], quiet)
    expect(converted.properties.gender.enum).toBeUndefined()
    expect(converted.properties.gender.oneOf).toEqual([{ const: 'm', title: 'male' }, { const: 'f', title: 'Female' }])
    expect(uischema.elements[0].options).toEqual({ format: 'radio' })
    expect(converted.properties.tags.items.oneOf).toEqual([{ const: 'a', title: 'A' }, { const: 'b', title: 'B' }])
    expect(converted.properties.tags.uniqueItems).toBe(true)
    expect(uischema.elements[1].options).toEqual({ format: 'checkbox' })
  })

  it('drops null titleMap entries unless the schema allows null', () => {
    const nullable = { type: 'object', properties: { g: { type: ['null', 'string'], enum: ['m', null] }, h: { type: 'string', enum: ['m'] } } }
    const { schema: converted, diagnostics } = convert(nullable, [
      { key: 'g', titleMap: [{ value: null, name: 'N/A' }, { value: 'm', name: 'M' }] },
      { key: 'h', titleMap: [{ value: null, name: 'N/A' }, { value: 'm', name: 'M' }] },
    ], quiet)
    expect(converted.properties.g.oneOf).toEqual([{ const: null, title: 'N/A' }, { const: 'm', title: 'M' }])
    expect(converted.properties.h.oneOf).toEqual([{ const: 'm', title: 'M' }])
    expect(diagnostics).toEqual([expect.objectContaining({ level: 'info', key: 'h' })])
  })

  it('converts conditions into visibility rules and reports the ones it cannot parse', () => {
    const { uischema, diagnostics } = convert(schema, [
      { key: 'notes', condition: "model.gender == 'm'" },
      { type: 'section', condition: '!model.name', items: ['email'] },
      { key: 'email', condition: 'arrayIndex > 0 && model.name' },
    ], quiet)
    expect(uischema.elements[0].rules).toEqual({ visible: 'gender == "m"' })
    expect(uischema.elements[1].rules).toEqual({ visible: 'not (truthy(name))' })
    expect(uischema.elements[2].rules).toBeUndefined()
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]).toMatchObject({ level: 'warn', key: 'email' })
    expect(diagnostics[0]!.message).toContain('condition not converted')
  })

  it('renders arrays of objects with an item layout and the add label', () => {
    const { uischema } = convert(schema, [
      { key: 'staff', add: 't(add-staff)', style: { add: 'btn-info' }, notitle: true, items: ['staff[].name', { key: 'staff[].role', type: 'textarea' }] },
      'aliases',
      { key: 'staff', items: [{ key: 'name' }] },
    ], quiet)
    const staff = uischema.elements[0]
    expect(staff.label).toBe(false)
    expect(staff.options.addLabel).toBe('add-staff')
    expect(staff.options.items).toEqual({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/role', options: { rows: 3 } },
      ],
    })
    // array of localized strings: the item is the control
    expect(uischema.elements[1].options.items).toEqual({ type: 'Control', scope: '#', label: false })
    // default item layout when items are not given
    const { uischema: defaults } = convert(schema, ['staff'], quiet)
    expect(defaults.elements[0].options.items.elements.map((e: any) => e.scope)).toEqual(['#/properties/name', '#/properties/role'])
  })

  it('reports keys that do not belong to the array item', () => {
    const { uischema, diagnostics } = convert(schema, [{ key: 'staff', items: ['name'] }], quiet)
    expect(uischema.elements[0].options.items).toEqual({ type: 'VerticalLayout', elements: [] })
    expect(diagnostics[0]!.message).toContain("does not belong to the array item")
  })

  it('renders object keys as fieldsets of their properties', () => {
    const { uischema } = convert(schema, [
      'address',
      { key: 'address', notitle: true, htmlClass: 'col-xs-6', items: [{ type: 'help', helpvalue: 'H' }, 'address.street'] },
    ], quiet)
    expect(uischema.elements[0]).toEqual({
      type: 'Group',
      label: 'Address',
      elements: [
        { type: 'Control', scope: '#/properties/address/properties/street' },
        { type: 'Control', scope: '#/properties/address/properties/city' },
      ],
    })
    expect(uischema.elements[1]).toEqual({
      type: 'VerticalLayout',
      options: { class: 'col-6' },
      elements: [{ type: 'Label', text: 'H' }, { type: 'Control', scope: '#/properties/address/properties/street' }],
    })
  })

  it('applies x-schema-form defaults from the schema', () => {
    const { uischema, schema: converted } = convert(schema, ['hidden', { key: 'hidden', notitle: false }], quiet)
    expect(uischema.elements[0]).toEqual({ type: 'Control', scope: '#/properties/hidden', label: false, options: { rows: 3 } })
    expect(uischema.elements[1]).toEqual({ type: 'Control', scope: '#/properties/hidden', options: { rows: 3 } })
    expect(converted.properties.hidden['x-schema-form']).toBeDefined()
  })

  it('expands "*" to the properties not listed elsewhere', () => {
    const { uischema } = convert({ type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' }, c: { type: 'string' } } }, ['b', '*'], quiet)
    expect(uischema.elements.map((e: any) => e.scope)).toEqual(['#/properties/b', '#/properties/a', '#/properties/c'])
  })

  it('skips and reports unknown keys, buttons and unsupported types', () => {
    const { uischema, diagnostics } = convert(schema, [
      'unknown',
      { type: 'submit', title: 'Save' },
      { type: 'template', template: '<b>x</b>' },
      { key: 'name', type: 'sf-obiba-selection-tree' },
      { type: 'weird' },
      { key: 'notes', type: 'ui-ace' },
      { key: 'email', type: 'custom-widget' },
    ], quiet)
    expect(uischema.elements).toHaveLength(2)
    expect(uischema.elements[0]).toMatchObject({ scope: '#/properties/notes', options: { rows: 3 } })
    expect(uischema.elements[1]).toEqual({ type: 'Control', scope: '#/properties/email' })
    expect(diagnostics.map((d) => d.level)).toEqual(['warn', 'info', 'info', 'info', 'warn', 'info', 'warn'])
  })

  it('maps the tabs type to a categorization', () => {
    const { uischema } = convert(schema, [{ type: 'tabs', tabs: [{ title: 't(tab.a)', items: ['name'] }, { title: 'B', items: ['email'] }] }], quiet)
    expect(uischema.elements[0]).toEqual({
      type: 'Categorization',
      elements: [
        { type: 'Category', label: 'tab.a', elements: [{ type: 'Control', scope: '#/properties/name' }] },
        { type: 'Category', label: 'B', elements: [{ type: 'Control', scope: '#/properties/email' }] },
      ],
    })
  })

  it('applies the readonly and languages options', () => {
    const { uischema } = convert(schema, ['name', 'desc'], { ...quiet, readonly: true, languages: ['en', 'fr'] })
    expect(uischema.elements[0].options).toEqual({ readonly: true })
    expect(uischema.elements[1].options).toEqual({ readonly: true, languages: ['en', 'fr'] })
  })

  it('calls the logger with every diagnostic', () => {
    const seen: string[] = []
    convert(schema, ['unknown'], { logger: (d) => seen.push(d.message) })
    expect(seen).toEqual(["key 'unknown' is not defined in the schema"])
  })

  it('accepts both dialects with toJsonForms', () => {
    expect(isAsfDefinition([])).toBe(true)
    expect(isAsfDefinition({})).toBe(false)
    const fromAsf = toJsonForms(schema, ['name'], quiet)
    expect(fromAsf.uischema.elements[0].scope).toBe('#/properties/name')
    const native = { type: 'VerticalLayout', elements: [{ type: 'Label', text: 't(hello)' }] }
    const fromNative = toJsonForms(schema, native, quiet)
    expect(fromNative.uischema).toEqual({ type: 'VerticalLayout', elements: [{ type: 'Label', text: 'hello' }] })
    expect(fromNative.schema.properties.name.title).toBe('person.name')
    expect(toJsonForms(schema, undefined, quiet).uischema).toEqual({ type: 'VerticalLayout', elements: [] })
  })

  it('tolerates a missing schema or definition', () => {
    expect(convert(undefined, undefined, quiet)).toEqual({
      schema: { type: 'object', properties: {} },
      uischema: { type: 'VerticalLayout', elements: [] },
      diagnostics: [],
    })
  })
})

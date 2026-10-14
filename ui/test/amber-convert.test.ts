/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import { mountForm, flush } from './utils'
import { convert, isAmberSchema, rewriteExpression } from '../src/amber'
import { errorDataPath } from '../src/utils/visibility'
import { builderCatalog, fromAmber, keywordsSchema, locations, matchItem, propertySchema, recognize, toDefinition } from '../src/builder'
import { rendererOptions } from '../src/catalog'
import demo from './fixtures/amber/demo-form.json'

// jsdom has no canvas: the OpenLayers adapter of the geo control is mocked
vi.mock('../src/utils/geo-map', () => ({
  createGeoMap: () => ({ setGeometry() {}, setMode() {}, setCenter() {}, fit: () => true, updateSize() {}, destroy() {} }),
}))

const last = (wrapper: any, event: string) => {
  const emitted = wrapper.emitted(event)
  return emitted ? emitted[emitted.length - 1]![0] : undefined
}
const keys = (errors: any[] = []) => errors.map((e) => `${e.keyword}:${errorDataPath(e)}`)

const feature = (geometry: any) => ({ type: 'Feature', geometry, properties: null })

/** a record of the demo form, as collected by the Amber (blitzar) forms */
const record = {
  TEXTS: { SHORT_ANSWER: 'a', SHORT_ANSWER_MASKED: ' (123) 456 - 7890', PARAGRAPH: 'p' },
  CHECKS: { SINGLE_CHOICE: '1', MULTIPLE_CHOICES: ['1', '3'] },
  SELECTS: { DROPDOWN_S: '2', DROPDOWN_M: ['1'], IMAGE: '3' },
  AUTOCOMPLETES: { AUTOCOMPLETE_S: '1', AUTOCOMPLETE_M: ['1', '2'] },
  NUMERICS: { NUMBER: 18.5, SLIDER: 50, RATING: 3 },
  TEMPORALS: { DATE: '2026-10-14', TIME: '13:45', DATE_TIME: '2026-10-14 13:45' },
  GEOS: {
    POINT: feature({ type: 'Point', coordinates: [6.14, 46.2] }),
    POLYGON: feature({ type: 'Polygon', coordinates: [[[6.1, 46.2], [6.2, 46.2], [6.2, 46.3], [6.1, 46.2]]] }),
  },
  OTHERS: { TOGGLE: true },
  VALIDATIONS: { REQUIRED: 'x', DATE: '2099-01-01', SLIDER: 5, NUMBER: 3 },
  CONDITIONS: { YESNO: '1', YES: 'because' },
  COMPUTATIONS: { COMP: 10, SLIDER1: 5, SLIDER2: 5 },
}

describe('amber expressions', () => {
  it('rewrites the variable references, val and the Date functions', () => {
    expect(rewriteExpression("$('A.B') === '1'")).toBe("A.B === '1'")
    expect(rewriteExpression('$("A") > 2 && formData.B.C < 3')).toBe('A > 2 && B.C < 3')
    expect(rewriteExpression('Date.parse(val) > Date.now()', 'G.D')).toBe('parseDate(G.D) > now()')
    // not a reference: a string literal, a property named val
    expect(rewriteExpression("x.val == 'val'", 'G.D')).toBe("x.val == 'val'")
  })

  it('rewrites the array methods and the arrow functions', () => {
    expect(rewriteExpression("$('A').includes('1')")).toBe("contains(A, '1')")
    expect(rewriteExpression("$('A').indexOf('1') > -1")).toBe("contains(A, '1')")
    expect(rewriteExpression("$('A').indexOf('1') === -1")).toBe("!contains(A, '1')")
    expect(rewriteExpression("$('A').length > 2")).toBe('length(A) > 2')
    expect(rewriteExpression('(data) => data.A + data.B.C')).toBe('A + B.C')
    expect(rewriteExpression("map($('A'), { '1': 'x' }, 'none')")).toBe("map(A, { '1': 'x' }, 'none')")
  })

  it('throws on what a rule cannot express', () => {
    expect(() => rewriteExpression('(data) => { return data.A }')).toThrow()
    expect(() => rewriteExpression("$('A').toUpperCase() == 'X'")).toThrow()
  })
})

describe('amber convert', () => {
  it('recognizes an Amber schema', () => {
    expect(isAmberSchema(demo)).toBe(true)
    expect(isAmberSchema({ type: 'object', properties: {} })).toBe(false)
    expect(isAmberSchema({ items: [] })).toBe(true)
  })

  it('converts the demo form without diagnostics, one root element per item', () => {
    const { schema, uischema, diagnostics } = convert(demo, { logger: false })
    expect(diagnostics).toEqual([])
    expect(uischema.elements.length).toBe((demo as any).items.length)
    // the image of the image select is too large for a snapshot
    const image = uischema.elements[4].elements[2].options
    expect(image.image).toMatch(/^data:image\/jpeg;base64,/)
    image.image = '<image>'
    expect({ schema, uischema }).toMatchSnapshot()
  })

  it('collects the data of the Amber forms as they are', async () => {
    const { schema, uischema, translations } = convert(demo, { logger: false })
    const wrapper = mountForm({ schema, uischema, translations, modelValue: record })
    await flush(5)
    expect(keys(last(wrapper, 'update:errors'))).toEqual([])
    // nothing to change: no value cleared, recoded or recomputed
    const data = last(wrapper, 'update:modelValue')
    if (data !== undefined) expect(data).toEqual(record)
    wrapper.unmount()
  })

  it('applies the Amber defaults and computations to a new record', async () => {
    const { schema, uischema } = convert(demo, { logger: false })
    // the defaults are emitted while the form is set up, before the wrapper exists
    let wrapper: any
    wrapper = mountForm({
      schema,
      uischema,
      modelValue: {},
      applyDefaults: true,
      'onUpdate:modelValue': (data: any) => wrapper?.setProps({ modelValue: data }),
    })
    await flush(10)
    expect(last(wrapper, 'update:modelValue')).toEqual({
      // as in Amber, the checkboxes store an empty array
      CHECKS: { MULTIPLE_CHOICES: [] },
      NUMERICS: { NUMBER: 18, SLIDER: 50 },
      VALIDATIONS: { SLIDER: 5 },
      COMPUTATIONS: { COMP: 10, SLIDER1: 5, SLIDER2: 5 },
    })
    // the required item of a group, and the validations of empty values (as in Amber, they are false)
    expect(keys(last(wrapper, 'update:errors'))).toEqual(['required:/VALIDATIONS/REQUIRED', 'validation:/VALIDATIONS/DATE', 'validation:/VALIDATIONS/NUMBER'])
    wrapper.unmount()
  })

  it('clears the items hidden by a condition', async () => {
    const { schema, uischema } = convert(demo, { logger: false })
    const wrapper = mountForm({ schema, uischema, modelValue: record })
    await flush(5)
    await wrapper.setProps({ modelValue: { ...record, CONDITIONS: { YESNO: '0', YES: 'because' } } })
    await flush(5)
    expect(last(wrapper, 'update:modelValue').CONDITIONS).toEqual({ YESNO: '0' })
    wrapper.unmount()
  })

  it('converts the other item settings', () => {
    const { schema, uischema, diagnostics } = convert({
      items: [
        { type: 'text', name: 'A', required: true, disabled: "$('B') == true" },
        { type: 'toggle', name: 'B', default: 'true' },
        { type: 'checkboxgroup', name: 'C', options: [{ value: '1', label: 'one' }], default: "['1']", required: "$('B')" },
        { type: 'autocomplete', name: 'D', options: [{ value: 'x', label: 'X' }], newValue: true },
        { type: 'map', name: 'E', geometryType: 'Polygon', multiple: true, geoLocation: false },
        { type: 'image-select', name: 'F', options: [{ value: '1', label: 'one' }], areas: [{ value: '1', points: '0,0 1,0 1,1' }], showSelect: false },
        { type: 'unknown', name: 'G' },
        { type: 'text', name: 'A' },
        { type: 'text', name: 'H', condition: "$('A').toUpperCase() == 'X'" },
      ],
      i18n: { en: { one: 'One' }, fr: { one: 'Un' } },
    }, { logger: false })
    expect(schema.required).toEqual(['A'])
    expect(schema.properties.B.default).toBe(true)
    expect(schema.properties.C).toMatchObject({ type: 'array', uniqueItems: true, default: ['1'] })
    expect(schema.properties.D).toEqual({ type: 'string' })
    expect(schema.properties.E).toEqual({ type: 'array', items: { type: 'object', format: 'geo' } })
    const [a, , c, d, e, f, h] = uischema.elements
    expect(a.rules).toEqual({ enabled: '!(B == true)' })
    expect(c.rules).toEqual({ required: 'B' })
    expect(d.options).toEqual({ format: 'typeahead', values: [{ value: 'x', label: 'X' }], editable: true })
    expect(e.options.items.options).toEqual({ feature: true, geometries: ['polygon'], locate: false })
    expect(f.options).toMatchObject({ format: 'image-map', select: false, areas: { 1: { shape: 'poly', coords: [0, 0, 1, 0, 1, 1] } } })
    expect(h.rules).toBeUndefined()
    expect(diagnostics.map((d) => d.key)).toEqual(['G', 'A', 'H'])
    expect(convert({ items: [], i18n: { en: { one: 'One' } } }, { logger: false }).translations).toEqual({ en: { one: 'One' } })
  })

  it('is imported by the builder', () => {
    expect(recognize(demo)?.kind).toBe('amber')
    const model = fromAmber({ ...demo, i18n: { fr: { 'Text types': 'Textes' } } })
    expect(model.diagnostics).toEqual([])
    const { schema, uischema, translations } = toDefinition(model)
    const converted = convert(demo, { logger: false })
    expect(schema).toEqual(converted.schema)
    expect(uischema).toEqual(converted.uischema)
    expect(translations.fr!['Text types']).toBe('Textes')
  })

  it('writes only options that the builder shows, for the renderer of each control', () => {
    const catalog = builderCatalog()
    const model = fromAmber({
      items: [
        ...(demo as any).items,
        { type: 'autocomplete', name: 'MULTI_AC', options: [{ value: 'x', label: 'X' }], multiple: true, newValue: true },
        { type: 'map', name: 'ZONES', geometryType: 'Polygon', multiple: true, geoLocation: false, mapHeight: '200', zoom: '5' },
        { type: 'text', name: 'PLACED', placeholder: 'Type here' },
        { type: 'image-select', name: 'IMG', options: [{ value: '1', label: 'one' }], areas: [], showSelect: false, multiple: true },
      ],
    })
    const seen: string[] = []
    const missing = new Set<string>()
    for (const { node } of locations(model)) {
      if (node.kind !== 'control') continue
      const item = matchItem(node, propertySchema(model, node.id), catalog.items)
      expect(item, `${node.path?.join('.')} ${JSON.stringify(propertySchema(model, node.id))}`).toBeDefined()
      const api = catalog.renderers[item!.renderer]!
      seen.push(`${node.path?.join('.') ?? '#'}:${api.name}`)
      const listed = Object.keys(rendererOptions(api))
      Object.keys(node.element.options ?? {})
        .filter((option) => !listed.includes(option))
        .forEach((option) => missing.add(`${api.name}.${option}`))
    }
    expect([...missing]).toEqual([])
    // the renderer the builder describes is the one that renders the control
    expect(seen).toEqual(expect.arrayContaining([
      'TEXTS.PARAGRAPH:QStringRenderer',
      'CHECKS.SINGLE_CHOICE:QOptionsRenderer',
      'CHECKS.MULTIPLE_CHOICES:QOptionsRenderer',
      'SELECTS.DROPDOWN_M:QSelectRenderer',
      'SELECTS.IMAGE:QImageMapRenderer',
      'AUTOCOMPLETES.AUTOCOMPLETE_S:QTypeaheadRenderer',
      'MULTI_AC:QTypeaheadRenderer',
      'NUMERICS.SLIDER:QSliderRenderer',
      'NUMERICS.RATING:QRatingRenderer',
      'GEOS.POINT:QGeoRenderer',
      'ZONES:QListRenderer',
      '#:QGeoRenderer',
      'COMPUTATIONS.COMP:QComputedRenderer',
      'IMG:QImageMapRenderer',
    ]))
  })

  it('lets the builder edit the defaults of the primitive properties', () => {
    for (const type of ['string', 'number', 'integer', 'boolean']) {
      expect(keywordsSchema({ type })!.properties.default).toEqual({ type, title: 'default' })
    }
    expect(keywordsSchema({ type: 'array' })!.properties.default).toBeUndefined()
  })
})

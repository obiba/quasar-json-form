/**
 * Consistency of the renderer catalog (src/catalog) with the library: every
 * renderer registered by src/vue-plugin.ts is described, the descriptions are
 * well-formed, every `options.<name>` read by a renderer source is documented
 * (in its entry, or in `controlApi` for the common options), and the palette
 * items are usable.
 */
import { describe, it, expect } from 'vitest'
import { catalog, catalogItems, controlApi, findCatalogItem, rendererOptions } from '../src/catalog'

// the sources of the plugin and of the components, as text
const sources = import.meta.glob(['../src/vue-plugin.ts', '../src/components/*.ts'], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const source = (file: string): string => sources[`../src/${file}`]!

// internal components registered by the plugin that are not JSON Forms renderers
const NOT_RENDERERS = ['QMarkdownEditor']
// option names read under another documented name
const ALIASES: Record<string, string> = { readOnly: 'readonly' }

const plugin = source('vue-plugin.ts')
const registered = [...plugin.matchAll(/app\.component\((\w+)\.name!/g)].map((m) => m[1]!)
const renderers = registered.filter((name) => !NOT_RENDERERS.includes(name))
const entries = Object.values(catalog)

describe('renderer catalog', () => {
  it('finds the renderers registered by the plugin', () => {
    expect(renderers.length).toBeGreaterThan(20)
    expect(renderers).toContain('QJsonForm')
  })

  it.each(renderers)('%s is described', (name) => {
    expect(catalog[name]?.name).toBe(name)
  })

  it('describes nothing else', () => {
    expect(Object.keys(catalog).sort()).toEqual([...renderers].sort())
  })

  it.each(entries.map((api) => api.name))('%s is well-formed', (name) => {
    const api = catalog[name]!
    expect(['control', 'layout', 'form']).toContain(api.kind)
    expect(api.kind === 'control').toBe(api.inherits === 'control')
    for (const trigger of api.triggers ?? []) {
      expect(typeof trigger.schema).toBe('string')
      expect(typeof trigger.rank).toBe('number')
      expect(trigger.desc.length).toBeGreaterThan(0)
    }
    for (const section of ['props', 'element', 'events', 'options', 'validation'] as const) {
      for (const [key, entry] of Object.entries(api[section] ?? {})) {
        expect(key.length, `${name} ${section}`).toBeGreaterThan(0)
        expect(entry.desc?.length, `${name} ${section}.${key}`).toBeGreaterThan(0)
      }
    }
    if (api.data) expect(api.data.desc.length).toBeGreaterThan(0)
  })

  it('describes the common control keys', () => {
    expect(controlApi.name).toBe('Control')
    expect(Object.keys(controlApi.element)).toContain('title')
    expect(Object.keys(controlApi.options)).toContain('readonly')
    expect(rendererOptions(catalog.QStringRenderer!)).toHaveProperty('readonly')
    expect(rendererOptions(catalog.QStringRenderer!)).toHaveProperty('rows')
    expect(rendererOptions(catalog.QGridLayout!)).not.toHaveProperty('readonly')
  })

  const components = renderers.filter((name) => name !== 'QJsonForm')

  it.each(components)('%s documents every option it reads', (name) => {
    const read = new Set<string>()
    for (const match of source(`components/${name}.ts`).matchAll(/(?:options\.value|uischema\.options)\??\.(\w+)/g)) {
      read.add(match[1]!)
    }
    const documented = new Set(Object.keys(rendererOptions(catalog[name]!)))
    const missing = [...read].filter((key) => !documented.has(ALIASES[key] ?? key))
    expect(missing, `${name} reads undocumented options: ${missing.join(', ')}`).toEqual([])
  })
})

describe('palette items', () => {
  it('are contributed by every renderer but the form', () => {
    for (const api of entries) {
      if (api.kind === 'form') expect(api.items).toBeUndefined()
      else expect(api.items?.length, api.name).toBeGreaterThan(0)
    }
  })

  it('have unique names, a label and an icon', () => {
    const names = catalogItems.map((item) => item.name)
    expect(new Set(names).size).toBe(names.length)
    for (const item of catalogItems) {
      expect(item.label.length, item.name).toBeGreaterThan(0)
      expect(item.icon.length, item.name).toBeGreaterThan(0)
      expect(catalog[item.renderer]).toBeDefined()
    }
  })

  it('start a control with a typed property and a Control element, a layout with a typed element', () => {
    for (const item of catalogItems) {
      const kind = catalog[item.renderer]!.kind
      if (kind === 'control') {
        expect(typeof item.schema?.type, item.name).toBe('string')
        expect(item.uischema.type, item.name).toBe('Control')
      } else {
        expect(item.schema, item.name).toBeUndefined()
        expect(typeof item.uischema.type, item.name).toBe('string')
        expect(item.uischema.type, item.name).not.toBe('Control')
      }
    }
  })

  it('are found by name', () => {
    expect(findCatalogItem('textarea')).toMatchObject({ renderer: 'QStringRenderer', uischema: { options: { rows: 3 } } })
    expect(findCatalogItem('tabs')?.uischema.type).toBe('Categorization')
    expect(findCatalogItem('nope')).toBeUndefined()
  })
})

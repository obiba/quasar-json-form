/**
 * Consistency of the API documentation (src/api/*.json) with the library:
 * every renderer registered by ui/src/vue-plugin.ts has an API file, the
 * files are well-formed, and every `options.<name>` read by a renderer source
 * is documented (in its file, or in _control.json for the common options).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')
const uiSrc = path.resolve(root, '../ui/src')
const apiDir = path.resolve(root, 'src/api')

// internal components registered by the plugin that are not JSON Forms renderers
const NOT_RENDERERS = ['QMarkdownEditor']
// option names read under another documented name
const ALIASES: Record<string, string> = { readOnly: 'readonly' }

interface ApiEntry { type?: string; default?: string; message?: string; desc: string }
interface ApiDef {
  name: string
  inherits?: string
  triggers?: { schema: string; rank: number; desc: string }[]
  props?: Record<string, ApiEntry>
  element?: Record<string, ApiEntry>
  events?: Record<string, ApiEntry>
  options?: Record<string, ApiEntry>
  validation?: Record<string, ApiEntry>
  data?: { desc: string; example?: string }
}

const plugin = readFileSync(path.join(uiSrc, 'vue-plugin.ts'), 'utf-8')
const registered = [...plugin.matchAll(/app\.component\((\w+)\.name!/g)].map((m) => m[1]!)
const renderers = registered.filter((name) => !NOT_RENDERERS.includes(name))

const readApi = (name: string): ApiDef => JSON.parse(readFileSync(path.join(apiDir, `${name}.json`), 'utf-8'))
const common = readApi('_control')

describe('API documentation', () => {
  it('finds the renderers registered by the plugin', () => {
    expect(renderers.length).toBeGreaterThan(20)
    expect(renderers).toContain('QJsonForm')
  })

  it.each(renderers)('%s has an API file', (name) => {
    expect(existsSync(path.join(apiDir, `${name}.json`))).toBe(true)
  })

  const files = readdirSync(apiDir).filter((f) => f.endsWith('.json'))

  it.each(files)('%s is well-formed', (file) => {
    const api: ApiDef = JSON.parse(readFileSync(path.join(apiDir, file), 'utf-8'))
    expect(api.name).toBe(file.startsWith('_') ? api.name : file.replace('.json', ''))
    for (const trigger of api.triggers ?? []) {
      expect(typeof trigger.schema).toBe('string')
      expect(typeof trigger.rank).toBe('number')
      expect(trigger.desc.length).toBeGreaterThan(0)
    }
    for (const section of ['props', 'element', 'events', 'options', 'validation'] as const) {
      for (const [key, entry] of Object.entries(api[section] ?? {})) {
        expect(key.length, `${file} ${section}`).toBeGreaterThan(0)
        expect(entry.desc?.length, `${file} ${section}.${key}`).toBeGreaterThan(0)
      }
    }
    if (api.inherits) {
      expect(existsSync(path.join(apiDir, `_${api.inherits}.json`))).toBe(true)
    }
    if (api.data) expect(api.data.desc.length).toBeGreaterThan(0)
  })

  const components = renderers.filter((name) => name !== 'QJsonForm')

  it.each(components)('%s documents every option it reads', (name) => {
    const source = readFileSync(path.join(uiSrc, 'components', `${name}.ts`), 'utf-8')
    const read = new Set<string>()
    for (const match of source.matchAll(/(?:options\.value|uischema\.options)\??\.(\w+)/g)) {
      read.add(match[1]!)
    }
    const api = readApi(name)
    const documented = new Set([
      ...Object.keys(api.options ?? {}),
      ...(api.inherits === 'control' ? Object.keys(common.options ?? {}) : []),
    ])
    const missing = [...read].filter((key) => !documented.has(ALIASES[key] ?? key))
    expect(missing, `${name} reads undocumented options: ${missing.join(', ')}`).toEqual([])
  })
})

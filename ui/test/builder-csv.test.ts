import { describe, it, expect } from 'vitest'
import { fromDefinition, parseCsv, translationsToCsv, mergeCsv } from '../src/builder'

describe('parseCsv', () => {
  it('reads fields, quotes, doubled quotes and line endings', () => {
    expect(parseCsv('a,b\r\n1,2\n')).toEqual([['a', 'b'], ['1', '2']])
    expect(parseCsv('"a, b","say ""hi"""\n"multi\nline",x')).toEqual([['a, b', 'say "hi"'], ['multi\nline', 'x']])
    expect(parseCsv('a,,c\n\n,\n')).toEqual([['a', '', 'c'], ['', '']])
    expect(parseCsv('')).toEqual([])
    expect(parseCsv('single')).toEqual([['single']])
  })
})

describe('translations CSV', () => {
  const model = () => fromDefinition({
    schema: { type: 'object', properties: { name: { type: 'string', title: 'name.title' } } },
    translations: { en: { 'name.title': 'Name, please', 'name.hint': 'Say "hi"' }, fr: { 'name.title': 'Nom' } },
  })

  it('writes a key column then one per language, every key', () => {
    expect(translationsToCsv(model(), ['en', 'fr'])).toBe('key,en,fr\r\nname.hint,"Say ""hi""",\r\nname.title,"Name, please",Nom\r\n')
  })

  it('merges a file: existing keys updated, new keys and languages added, empty cells kept', () => {
    const m = model()
    const result = mergeCsv(m, '﻿key,fr,de\r\nname.title,Nom complet,Name\r\nname.hint,,Hinweis\r\nother.title,Autre,\r\n\r\n')
    expect(result).toEqual({ languages: ['fr', 'de'], keys: 3, values: 4 })
    expect(m.translations.fr).toEqual({ 'name.title': 'Nom complet', 'other.title': 'Autre' })
    expect(m.translations.de).toEqual({ 'name.title': 'Name', 'name.hint': 'Hinweis' })
    expect(m.translations.en).toEqual({ 'name.title': 'Name, please', 'name.hint': 'Say "hi"' })
  })

  it('round-trips', () => {
    const m = model()
    const csv = translationsToCsv(m, ['en', 'fr'])
    const other = fromDefinition({ schema: {} })
    mergeCsv(other, csv)
    expect(other.translations).toEqual(m.translations)
  })

  it('rejects a file without the key header', () => {
    expect(() => mergeCsv(model(), 'name,en\nx,y')).toThrow()
    expect(() => mergeCsv(model(), 'key\nx')).toThrow()
    expect(() => mergeCsv(model(), '')).toThrow()
  })
})

describe('mergeCsv columns', () => {
  it('keeps the column of each language when a header is empty', () => {
    const m = fromDefinition({ schema: {} })
    expect(mergeCsv(m, 'key,,fr\nname.title,ignored,Nom\n')).toEqual({ languages: ['fr'], keys: 1, values: 1 })
    expect(m.translations).toEqual({ fr: { 'name.title': 'Nom' } })
  })
})

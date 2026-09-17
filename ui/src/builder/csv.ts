/**
 * Translations as CSV: a `key` column then one column per language, for the
 * translators' spreadsheets.
 */
import type { FormModel } from './model'

/** Parses CSV text (RFC 4180: quoted fields, doubled quotes, CR LF or LF), rows of fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let i = 0
  const endRow = () => {
    row.push(field)
    field = ''
    if (row.length > 1 || row[0] !== '') rows.push(row)
    row = []
  }
  while (i < text.length) {
    const c = text[i]!
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      endRow()
    } else field += c
    i++
  }
  if (field !== '' || row.length > 0) endRow()
  return rows
}

function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** The translations of a model as CSV: `key` then the languages, one row per key (every language). */
export function translationsToCsv(model: FormModel, languages: string[]): string {
  const keys = new Set<string>()
  Object.values(model.translations).forEach((messages) => Object.keys(messages).forEach((key) => keys.add(key)))
  const lines = [['key', ...languages].map(escapeCsv).join(',')]
  for (const key of [...keys].sort()) {
    lines.push([key, ...languages.map((locale) => model.translations[locale]?.[key] ?? '')].map(escapeCsv).join(','))
  }
  return lines.join('\r\n') + '\r\n'
}

export interface CsvImport {
  /** languages of the file, in column order */
  languages: string[]
  /** number of (key, language) values set */
  values: number
  /** keys of the file */
  keys: number
}

/**
 * Merges a CSV file into the translations: the header gives the languages
 * (`key` first), every non-empty cell sets its key in its language, adding
 * the keys and languages the model does not have; empty cells leave the
 * existing values. Throws when the header is not `key,<language>...`.
 */
export function mergeCsv(model: FormModel, text: string): CsvImport {
  const rows = parseCsv(text.replace(/^﻿/, ''))
  const header = rows[0]?.map((cell) => cell.trim())
  if (!header || header[0]?.toLowerCase() !== 'key' || header.length < 2) throw new Error('key,<language>... header expected')
  const languages = header.slice(1).filter((locale) => locale.length > 0)
  let values = 0
  let keys = 0
  for (const row of rows.slice(1)) {
    const key = row[0]?.trim()
    if (!key) continue
    keys++
    languages.forEach((locale, index) => {
      const value = row[index + 1]
      if (value === undefined || value === '') return
      ;(model.translations[locale] ??= {})[key] = value
      values++
    })
  }
  return { languages, values, keys }
}

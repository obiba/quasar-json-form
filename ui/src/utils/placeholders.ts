/* eslint-disable @typescript-eslint/no-explicit-any */
import { ruleEngine } from '../composables/useRules'
import { encodeUrl, sanitizeHtml } from './markdown'

/**
 * `{{ expression }}` placeholders of the texts of a form (titles,
 * descriptions, hints, labels): the expression is evaluated with the rule
 * engine on the form data, and its value replaces the placeholder.
 */
const PLACEHOLDER = /\{\{([\s\S]*?)\}\}/g

/** The expressions of the placeholders of a text. */
export function placeholders(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1]!.trim())
}

/** The error of the first placeholder expression that does not compile, undefined when they all do. */
export function placeholderError(text: string | undefined): string | undefined {
  if (!text) return undefined
  for (const expression of placeholders(text)) {
    const error = expression ? ruleEngine.expressionError(expression) : 'empty expression'
    if (error) return `{{${expression}}}: ${error}`
  }
  return undefined
}

/** The text of a value: nothing for `undefined` / `null`, the values of an array separated by commas. */
export function formatValue(value: any): string {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value)) return value.map(formatValue).join(', ')
  if (value instanceof Date) return isNaN(value.getTime()) ? '' : value.toISOString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** The text with its placeholders replaced by the text of their value, for a plain text (not markdown). */
export function fillPlaceholders(text: string, evaluate: (expression: string) => any): string {
  if (!text.includes('{{')) return text
  return text.replace(PLACEHOLDER, (_match, expression: string) => formatValue(evaluate(expression.trim())))
}

const HTML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]!)
}

// A placeholder stands as `\uE000<index>\uE001` (private use characters,
// left as is by markdown-it and DOMPurify) while the text is rendered, or
// percent-encoded when markdown-it normalized it in a link URL
const TOKEN = /\uE000(\d+)\uE001|%EE%80%80(\d+)%EE%80%81/g

/**
 * The HTML of a markdown text (`render` is `renderMarkdown` or
 * `renderMarkdownInline`) with its placeholders replaced by the value of
 * their expression. The text is rendered with the placeholders as tokens (the
 * rendering does not depend on the data, it stays cached) and the values
 * replace the tokens in the HTML, HTML-escaped (percent-encoded in a link), so
 * that the data cannot inject markup; the result is sanitized again, as a
 * value can make a dangerous URL of an attribute (`javascript:`).
 */
export function renderPlaceholders(text: string, render: (text: string) => string, evaluate: (expression: string) => any): string {
  if (!text.includes('{{')) return render(text)
  const expressions: string[] = []
  const html = render(text.replace(PLACEHOLDER, (_match, expression: string) => `\uE000${expressions.push(expression.trim()) - 1}\uE001`))
  return sanitizeHtml(html.replace(TOKEN, (_match, index: string | undefined, encodedIndex: string | undefined) => {
    const value = formatValue(evaluate(expressions[Number(index ?? encodedIndex)]!))
    return escapeHtml(index !== undefined ? value : encodeUrl(value))
  }))
}

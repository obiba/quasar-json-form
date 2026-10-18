/* eslint-disable @typescript-eslint/no-explicit-any */
import { ruleEngine } from '../composables/useRules'

/**
 * `{{ expression }}` placeholders of the texts of a form (titles,
 * descriptions, hints, labels): the expression is evaluated with the rule
 * engine on the form data, and its value replaces the placeholder.
 */
const PLACEHOLDER = /\{\{([^{}]*)\}\}/g

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
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * A value as literal markdown text: the HTML special characters become
 * entities and the markdown punctuation is backslash-escaped, so that the
 * data cannot inject markup.
 */
export function escapeMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/[\\`*_{}[\]()#+\-.!|~"']/g, '\\$&')
}

/**
 * The text with its placeholders replaced by the escaped value of their
 * expression (`evaluate` gives undefined when it fails, an empty string is
 * displayed then). A text without placeholders is returned as is.
 */
export function fillPlaceholders(text: string, evaluate: (expression: string) => any): string {
  if (!text.includes('{{')) return text
  return text.replace(PLACEHOLDER, (_match, expression: string) => escapeMarkdown(formatValue(evaluate(expression.trim()))))
}

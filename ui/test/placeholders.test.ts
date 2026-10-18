/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { fillPlaceholders, placeholderError, escapeMarkdown, formatValue } from '../src/utils/placeholders'
import { renderMarkdownInline } from '../src/utils/markdown'
import { mountForm, flush } from './utils'

describe('placeholders', () => {
  it('replaces the placeholders by the value of their expression', () => {
    const data: Record<string, any> = { a: 'x', n: 2 }
    expect(fillPlaceholders('{{a}} and {{ n + 1 }}', (e) => (e === 'a' ? data.a : data.n + 1))).toBe('x and 3')
    expect(fillPlaceholders('no placeholder', () => { throw new Error('not called') })).toBe('no placeholder')
  })

  it('formats the values', () => {
    expect(formatValue(undefined)).toBe('')
    expect(formatValue(null)).toBe('')
    expect(formatValue(['a', 1])).toBe('a, 1')
    expect(formatValue(0)).toBe('0')
    expect(formatValue(false)).toBe('false')
  })

  it('escapes the values so that they cannot inject markup', () => {
    const html = renderMarkdownInline(escapeMarkdown('<img src=x onerror=alert(1)> **bold** [link](javascript:alert(1))'))
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<strong>')
    expect(html).not.toContain('<a ')
    expect(html).toContain('[link](javascript:alert(1))')
    expect(html).toContain('&lt;img')
    expect(html).toContain('**bold**')
  })

  it('reports the invalid expressions', () => {
    expect(placeholderError('Hello {{name}}')).toBeUndefined()
    expect(placeholderError('no placeholder')).toBeUndefined()
    expect(placeholderError('Hello {{name ==}}')).toMatch(/^\{\{name ==\}\}: /)
    expect(placeholderError('Hello {{unknownFn(name)}}')).toMatch(/unknown function/)
    expect(placeholderError('Hello {{ }}')).toMatch(/empty expression/)
  })
})

describe('placeholders in the form texts', () => {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      age: { type: 'integer', title: 'Age of {{name}}', description: 'In {{ year + 1 }}', hint: 'Hint for {{name}}' },
      year: { type: 'integer' },
    },
  }
  const uischema = {
    type: 'VerticalLayout',
    elements: [
      { type: 'Section', label: 'Section {{name}}', description: 'Section text {{name}}' },
      {
        type: 'Group', label: 'Group {{name}}', description: 'Group text {{name}}', hint: 'Group hint {{name}}',
        elements: [{ type: 'Control', scope: '#/properties/age' }],
      },
      { type: 'Label', text: 'Hello **{{name}}**' },
    ],
  }

  it('renders the values in the titles, descriptions, hints and labels', async () => {
    const wrapper = mountForm({ schema, uischema, modelValue: { name: 'Ada', year: 2025 } })
    await flush()
    const text = wrapper.text()
    for (const expected of ['Section Ada', 'Section text Ada', 'Group Ada', 'Group text Ada', 'Group hint Ada', 'Age of Ada', 'In 2026', 'Hint for Ada']) {
      expect(text).toContain(expected)
    }
    expect(wrapper.find('.q-label-renderer strong').text()).toBe('Ada')
    wrapper.unmount()
  })

  it('follows the data, and escapes it', async () => {
    const wrapper = mountForm({ schema, uischema, modelValue: { name: 'Ada' } })
    await flush()
    await wrapper.setProps({ modelValue: { name: '<b>Bob</b>' } })
    await flush()
    expect(wrapper.find('.q-label-renderer').html()).not.toContain('<b>')
    expect(wrapper.find('.q-label-renderer').text()).toContain('Hello <b>Bob</b>')
    await wrapper.setProps({ modelValue: {} })
    await flush()
    expect(wrapper.find('.q-label-renderer').text()).not.toContain('Bob')
    wrapper.unmount()
  })

  it('replaces the placeholders of the translations', async () => {
    const translations = { en: { greeting: 'Hi {{name}}' }, fr: { greeting: 'Salut {{name}}' } }
    const wrapper = mountForm({
      schema, translations, locale: 'fr', modelValue: { name: 'Ada' },
      uischema: { type: 'VerticalLayout', elements: [{ type: 'Label', text: 'greeting' }] },
    })
    await flush()
    expect(wrapper.find('.q-label-renderer').text()).toBe('Salut Ada')
    wrapper.unmount()
  })
})

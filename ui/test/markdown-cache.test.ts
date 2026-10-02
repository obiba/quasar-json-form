import { describe, it, expect, vi } from 'vitest'
import DOMPurify from 'dompurify'
import { renderMarkdown, renderMarkdownInline } from '../src/utils/markdown'

describe('markdown rendering', () => {
  it('renders a text once', () => {
    const sanitize = vi.spyOn(DOMPurify, 'sanitize')
    const text = `**cached** ${Math.random()}`
    expect(renderMarkdown(text)).toContain('<strong>cached</strong>')
    expect(renderMarkdown(text)).toContain('<strong>cached</strong>')
    expect(renderMarkdownInline(text)).toContain('<strong>cached</strong>')
    expect(renderMarkdownInline(text)).not.toContain('<p>')
    expect(sanitize).toHaveBeenCalledTimes(2)
    sanitize.mockRestore()
  })
})

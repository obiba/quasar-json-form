import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: true,        // Enable HTML tags in source
  xhtmlOut: true,    // Use '/' to close single tags (<br />)
  breaks: false,     // Convert '\n' in paragraphs into <br>
  linkify: true,     // Autoconvert URL-like text to links
  typographer: true  // Enable smartquotes and other typographic replacements
})

// The sanitized HTML by source text: the renderers render their labels and
// descriptions again on every data change of the form
// ponytail: cleared when full, an LRU if forms ever have more distinct texts than this
const MAX_CACHED = 1000

function cached(render: (text: string) => string): (text: string) => string {
  const cache = new Map<string, string>()
  return (text) => {
    let html = cache.get(text)
    if (html === undefined) {
      if (cache.size >= MAX_CACHED) cache.clear()
      html = DOMPurify.sanitize(render(text))
      cache.set(text, html)
    }
    return html
  }
}

export const renderMarkdown = cached((text) => md.render(text))

export const renderMarkdownInline = cached((text) => md.renderInline(text))

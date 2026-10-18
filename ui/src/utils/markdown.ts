import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: true,        // Enable HTML tags in source
  xhtmlOut: true,    // Use '/' to close single tags (<br />)
  breaks: false,     // Convert '\n' in paragraphs into <br>
  linkify: true,     // Autoconvert URL-like text to links
  typographer: true  // Enable smartquotes and other typographic replacements
})

// A link with a placeholder token (see placeholders.ts) is only encoded, not
// normalized: the punycode of its host would lose the token
const normalizeLink = md.normalizeLink.bind(md)
md.normalizeLink = (url) => (url.includes('\uE000') ? md.utils.lib.mdurl.encode(url) : normalizeLink(url))

/** A URL (or a part of it) percent-encoded as markdown-it does: the existing `%XX` escapes are kept. */
export const encodeUrl: (url: string) => string = md.utils.lib.mdurl.encode

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

/** The sanitized HTML, cached */
export const sanitizeHtml = cached((html) => html)

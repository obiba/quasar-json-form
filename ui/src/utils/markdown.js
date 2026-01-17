import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const md = new MarkdownIt({
  html: true,        // Enable HTML tags in source
  xhtmlOut: true,    // Use '/' to close single tags (<br />)
  breaks: false,     // Convert '\n' in paragraphs into <br>
  linkify: true,     // Autoconvert URL-like text to links
  typographer: true  // Enable smartquotes and other typographic replacements
});

export function renderMarkdown(text) {
  return DOMPurify.sanitize(md.render(text));
}

export function renderMarkdownInline(text) {
  return DOMPurify.sanitize(md.renderInline(text));
}
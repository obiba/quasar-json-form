---
title: Markdown
---

# Markdown

<p class="doc-lead">A string with <code>format: "markdown"</code> renders a markdown editor: a textarea with a formatting toolbar and a preview toggle.</p>

<DocExample name="markdown/basic" title="Editor" source />

## Read-only

Read-only, the markdown is rendered with markdown-it and sanitized with DOMPurify. The same
`renderMarkdown` function is exported by the library.

<DocExample name="markdown/readonly" title="Rendered" />

## API

<DocApi name="QMarkdownRenderer" />

---
title: Section and label
---

# Section and label

<p class="doc-lead">A <code>Section</code> is a heading announcing the fields that follow; a <code>Label</code> is free markdown text.</p>

A `Label` carries its content in `text` (JSON Forms convention). It is first resolved as a vue-i18n
key, then rendered as markdown with raw HTML allowed (`<h3>`, alert `<div>`s, links...), sanitized
with DOMPurify. Both accept a `rules.visible` rule.

<DocExample name="layouts/section-label" title="Section, HTML label and conditional label" source />

## API

<DocApi name="QSectionRenderer" />

<DocApi name="QLabelRenderer" />

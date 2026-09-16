---
title: Typeahead
---

# Typeahead

<p class="doc-lead">A string with <code>format: "typeahead"</code> is an input with filtered suggestions.</p>

The suggestions come from `options.values` (strings or `{ label, value }`), or the schema
`examples` / `enum`. By default the value must be one of the suggestions; `options.editable: true`
accepts any text typed, added with Enter.

<DocExample name="typeahead/basic" title="Suggestions and editable" source />

## API

<DocApi name="QTypeaheadRenderer" />

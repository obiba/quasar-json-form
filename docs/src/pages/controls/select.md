---
title: Select
---

# Select

<p class="doc-lead">A property with <code>enum</code> or <code>oneOf</code> values renders a <a href="https://quasar.dev/vue-components/select">QSelect</a>.</p>

With `enum`, each value is its own label (translated with vue-i18n when it is a key). With
`oneOf`, each entry is `{ const, title }`: the `const` is stored and the `title` displayed, which
also allows non-string values.

<DocExample name="select/enum" title="enum and oneOf" source />

## Multiple selection

An array with `uniqueItems: true` whose `items` have `enum` or `oneOf` values is a multiple
selection. `minItems` and `maxItems` are validated by AJV. Add `options.format: "checkbox"` to
render [checkboxes](/#/controls/options) instead.

<DocExample name="select/multiple" title="Multiple" />

## Dynamic options

A `oneOf` entry accepts its own `rules.visible` [filtrex rule](/#/start/rules): the option is
listed only when the rule is true, and a selected value that becomes hidden is cleared. This is
how dependent selects are expressed within the schema.

<DocExample name="select/dynamic" title="Dependent options" />

## API

<DocApi name="QSelectRenderer" />

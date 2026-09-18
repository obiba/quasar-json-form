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
render [checkboxes](#/controls/options) instead.

<DocExample name="select/multiple" title="Multiple" />

## Dynamic options

A `oneOf` entry accepts its own `rules.visible` [rule](#/start/rules): the option is
listed only when the rule is true, and a selected value that becomes hidden is cleared. This is
how dependent selects are expressed within the schema.

<DocExample name="select/dynamic" title="Dependent options" />

## Options from the application

When the values come from elsewhere (a server, a lookup table too large for the schema), the
application rewrites the `enum` of a property in its `update:modelValue` handler, and resets the
data that is no longer among the values: the select is rendered again with the new values. An
empty `enum` is not a valid JSON Schema and AJV refuses to compile it, so a form whose enums
start empty needs `validation-mode="NoValidation"`, or a placeholder value.

<DocExample name="select/dynamic-app" title="Values rewritten by the application" source />

## API

<DocApi name="QSelectRenderer" />

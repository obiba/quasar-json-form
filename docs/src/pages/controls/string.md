---
title: String
---

# String

<p class="doc-lead">A <code>{ "type": "string" }</code> property renders a <a href="https://quasar.dev/vue-components/input">QInput</a>.</p>

The schema `title` is displayed above the input and the `description` under the title; `label` on
the control element is the floating label of the input and `hint` the help text under it (see
[QJsonForm](#/start/json-form#title-description-label-and-hint)). All are translated with vue-i18n
when they are keys (switch the language in the header). `required` adds a `*` to the title, and
`minLength`, `maxLength`, `pattern` and `format` are validated by AJV.

<DocExample name="string/basic" title="Basic" source />

## Input types

The schema `format` (or `options.format`) selects the type of the input: `email`, `url` / `uri`,
`password`, `search`, `tel`, `textarea`. `email` and `uri` are also validated by AJV.

<DocExample name="string/formats" title="Formats" />

## Textarea

`options.rows` greater than 1 renders a textarea with that many rows.

<DocExample name="string/textarea" title="Textarea" />

## Word limits

`options.wordLimit` (`"min:max"` or a maximum), `wordMin` and `wordMax` validate the number of
words and show a word counter under the input. The messages can be set per control with
`validationMessage.wordLimitError` / `wordMinError` / `wordMaxError`, or globally with the
`error.wordLimit` / `error.wordMin` / `error.wordMax` i18n keys.

<DocExample name="string/word-limit" title="Word limit" />

## Quasar props

Any other option of the control is passed to `QInput`: `outlined`, `filled`, `dense`, `clearable`,
`placeholder`, `prefix`, `suffix`, `maxlength`, `counter`, `mask`... A control is read-only with
`readOnly: true` on the schema property or `options.readonly` on the control.

<DocExample name="string/quasar-props" title="QInput props and read-only" />

## API

<DocApi name="QStringRenderer" />

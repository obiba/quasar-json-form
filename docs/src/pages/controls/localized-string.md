---
title: Localized string
---

# Localized string

<p class="doc-lead">An object with <code>format: "localizedString"</code> holds one value per language, entered through one input and a language selector.</p>

The data is `{ "en": "...", "fr": "..." }`. Switching the language selector switches every
localized control of the form. A required localized string must be completed in every language,
and a string emptied in every language becomes `undefined` so that `required` applies.

The languages come from `options.languages`, then `config.languages`, then the `languages` prop
of `QJsonForm`, either `['en', 'fr']` or `{ en: 'English', fr: 'Français' }`.

<DocExample name="localized-string/basic" title="Single line" source />

## Textarea and markdown

`options.rows` renders a textarea. `options.marked: true` (or `format: "obibaSimpleMde"`) renders
the [markdown editor](#/controls/markdown) with a preview; read-only, the markdown is rendered.

<DocExample name="localized-string/markdown" title="Textarea with its own languages, markdown editor" />

## API

<DocApi name="QLocalizedStringRenderer" />

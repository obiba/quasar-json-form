---
title: QJsonFormBuilder
---

# QJsonFormBuilder

<p class="doc-lead">The <code>builder</code> entry holds <code>QJsonFormBuilder</code>, an editor of complete forms: the schema, the UI schema and the translations, designed in the browser by a content manager without access to the application setup.</p>

A form is a self-contained bundle, `{ schema, uischema, translations }`. Every title, hint, option
label and message of the schema and UI schema is a translation key, and the `translations` object
carries their texts keyed by language. `QJsonForm` renders such a bundle with its
[`translations` and `locale` props](#/start/i18n), without merging anything into the vue-i18n
instance of the application.

```html
<QJsonFormBuilder v-model="form" :languages="['en', 'fr']" :config="config" />
```

```js
import { QJsonFormBuilder } from '@obiba/quasar-ui-json-form/builder'
```

The builder is not registered by the plugin: import it where it is used. Its stylesheet is part of
`dist/index.css`, and its labels come from the `builder.*` keys of the built-in messages (english
and french), overridable in the application bundles like the [validation messages](#/start/installation#validation-messages).
Try it on the [builder playground](#/builder/playground).

## Editing a form

The builder is an outline tree, a property panel and a live preview.

- **Outline**: the tree of the form, with a palette of layouts and controls made from the
  [renderer catalog](#/start/custom-controls#catalog). Elements are reordered and
  reparented by drag and drop; a control stays at its level, so it cannot move into or out of a
  list of objects. Nested objects, lists of objects and layouts are supported from the start.
- **Properties** of the selected element: its key (renaming a property rewrites the scopes of
  the nested controls; the rules still mentioning the old name are listed), whether it is
  required, its texts typed in the builder language, its choices (the labels of an `enum` are
  converted to a `oneOf`), the settings of its renderer as a form generated from the catalog, the
  validation keywords of its property, its `visible`, `enabled` and `validation` rules as
  [filtrex expressions](#/start/rules) checked with the names of the fields listed, and the raw
  JSON of the element and of the property for everything else.
- **Preview**: the form as `QJsonForm` renders it, with a language switch, a read-only toggle,
  and the data and errors as in the [playground](#/playground/index).
- **Translations**: a table of the keys with one column per language, the missing values
  highlighted, a filter on the missing ones, and languages added. *Collect the texts* turns the
  literal strings of an imported form into keys and adds the missing entries of every language.
  The table is downloaded as CSV (`key` then one column per language) for the translators and
  uploaded back: the non-empty cells update or add keys and languages.
- **Source**: the schema, the UI schema and the translations, editable as JSON.

Import accepts a form, a schema alone (the UI schema is generated, one control per property) or an
[angular-schema-form pair](#/migration/overview) (schema and definition, converted with its
diagnostics), pasted or picked as a file. Export downloads the form or one of its parts.

A hand-written schema is preserved: the keywords the builder does not understand stay attached
to their element and are written back as they were. A property that cannot be modeled at all
(`$ref`, an object-level `oneOf`...) is edited as JSON only and reported in the diagnostics.

## Texts and keys

A text is stored under a key generated from the position of its element, so that the keys stay
readable and stable across languages:

| Text | Key |
|---|---|
| Title and description of a property | `name.title`, `name.description` |
| Label, hint and text of a control | `name.label`, `name.hint` |
| A property of a list of objects | `contacts.items.email.title` |
| Option labels | `role.options.editor` |
| Messages of the validation rules | `name.validation.0` |
| Label of a layout, group or category | `group.1.label` |

This follows the `<path>.error.<keyword>` convention of JSON Forms: a form can also carry its
own `name.error.minLength` in its translations. The key is not shown unless asked: the property
panel edits the text of the current language.

## Extending the palette

The application adds its own controls with the same two props as `QJsonForm` plus their
descriptions: `renderers` for the preview, and `catalog` with the [`RendererApi`](#/start/custom-controls#catalog)
entries whose `items` become palette entries and whose `options` generate the settings form.

```html
<QJsonFormBuilder v-model="form" :catalog="[colorApi]" :renderers="[colorRenderer]" />
```

The builder playground includes the color control of the [custom controls](#/start/custom-controls) page this way.

## API

<DocApi name="QJsonFormBuilder" />

The component also exposes `getModel()`, the [model](#/builder/model) it works on, for an
application that needs more than the emitted bundle.

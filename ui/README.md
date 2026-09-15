# Component QJsonForm

[![npm](https://img.shields.io/npm/v/@obiba/quasar-ui-json-form.svg?label=@obiba/quasar-ui-json-form)](https://www.npmjs.com/package/@obiba/quasar-ui-json-form)
[![npm](https://img.shields.io/npm/dt/@obiba/quasar-ui-json-form.svg)](https://www.npmjs.com/package/@obiba/quasar-ui-json-form)

**Compatible with Quasar UI v2 and Vue 3**.

## Requirements

- Quasar v2, Vue 3
- [vue-i18n](https://vue-i18n.intlify.dev/) v11 (peer dependency), registered in the application
  with `app.use(i18n)` (composition mode, `legacy: false`). Every title, description, option
  label, hint and message is passed through `t()`, so they can be either i18n keys or literal
  strings (an unknown key is displayed as-is; set `missingWarn: false` to silence vue-i18n).
  Without vue-i18n installed, the forms still render: strings are displayed untranslated and
  validation messages come from the built-in english defaults (a warning is logged once).

A Quasar UI component that renders dynamic, schema-driven forms based on a JSON Schema and an optional UI schema, using [JSON Forms](https://jsonforms.io/) renderers styled with Quasar components.

# Usage

## Quasar CLI project


Install the [App Extension](../app-extension).

**OR**:


Create and register a boot file:

```js
import Vue from 'vue'
import Plugin from '@obiba/quasar-ui-json-form'
import '@obiba/quasar-ui-json-form/dist/index.css'

Vue.use(Plugin)
```

**OR**:

```html
<style src="@obiba/quasar-ui-json-form/dist/index.css"></style>

<script>
import { Component as QJsonForm } from '@obiba/quasar-ui-json-form'

export default {
  
  components: {
    QJsonForm
  }
  
  
}
</script>
```

## Vue CLI project

```js
import Vue from 'vue'
import Plugin from '@obiba/quasar-ui-json-form'
import '@obiba/quasar-ui-json-form/dist/index.css'

Vue.use(Plugin)
```

**OR**:

```html
<style src="@obiba/quasar-ui-json-form/dist/index.css"></style>

<script>
import { Component as QJsonForm } from '@obiba/quasar-ui-json-form'

export default {
  
  components: {
    QJsonForm
  }
  
  
}
</script>
```

# QJsonForm

```html
<QJsonForm
  v-model="data"
  v-model:errors="errors"
  :schema="schema"
  :uischema="uischema"
  :readonly="false"
  validation-mode="ValidateAndShow"
/>
```

| Prop | Default | Description |
|---|---|---|
| `modelValue` | `{}` | Form data (`v-model`) |
| `schema` | | JSON Schema |
| `uischema` | generated | JSON Forms UI schema; when omitted, one `Control` per property |
| `readonly` | `false` | Render every control read-only (inputs are not editable, list/upload buttons are hidden) |
| `validationMode` | `ValidateAndShow` | `ValidateAndShow`: validate against the schema and show errors on the controls; `ValidateAndHide`: validate, do not show; `NoValidation`: skip schema validation. Filtrex `validation` rules are always evaluated |
| `ajv` | | Custom AJV instance (`createAjv` from `@jsonforms/core`) |
| `additionalErrors` | `[]` | AJV-shaped errors to display in addition to validation errors (e.g. from a server) |
| `config` | | JSON Forms config passed to renderers (`languages`, `countries`, `fileUpload`, see below) |
| `languages` | | Languages of the localized strings: `['en', 'fr']` or `{ en: 'English', fr: 'Français' }` |

Events: `update:modelValue` (data), `update:errors` (AJV-shaped `ErrorObject[]`, also emitted on mount).
The errors contain the AJV validation errors (none in `NoValidation` mode) followed by the errors found by
the renderers themselves, which are always evaluated: filtrex `validation` rules (`keyword: "validation"`),
localized strings not completed (`completed`), word limits (`wordLimit`), file counts (`files`), radio
matrix (`allItemsSelected`) and date bounds (`date`); their `instancePath` points at the control.

A control can also be read-only through `options.readonly` in the UI schema or `readOnly` in the schema.

## Validation messages

Required controls get a `*` appended to their label. Error messages are looked up with vue-i18n
under the [JSON Forms i18n keys](https://jsonforms.io/docs/i18n): `<path>.error.<keyword>` for a
specific control, then `error.<keyword>` (`error.required`, `error.minLength`, `error.pattern`...)
with the AJV error params available for interpolation (`{limit}`, `{pattern}`, `{format}`...),
then `error.default`. Keys missing from the application bundles fall back to the library defaults
(english and french), exported as `messages`:

```js
import { messages } from '@obiba/quasar-ui-json-form'

createI18n({ messages: { en: { ...messages.en, ...appEn } } })
```

## Layout classes

`options.class` sets CSS classes on the root element of any layout, group, section, label or
control. `VerticalLayout` / `HorizontalLayout` render their elements as direct children, so Quasar
grid classes work as in Bootstrap:

```json
{
  "type": "VerticalLayout",
  "options": { "class": "row q-col-gutter-md" },
  "elements": [
    { "type": "VerticalLayout", "options": { "class": "col-md-6" }, "elements": [ ... ] },
    { "type": "Control", "scope": "#/properties/notes", "options": { "class": "col-12" } }
  ]
}
```

When `row`, `column` or `flex` is present in the class, the default flex stacking of the layout is
not applied.

## Labels

`{ "type": "Label", "text": "..." }` renders markdown with raw HTML allowed (`<h3>`, alert
`<div>`s...), sanitized with DOMPurify; the text is first resolved as a vue-i18n key.

## Renderer messages

A renderer-level check reads its message from `options.validationMessage.<name>` on the control when
defined (translated with `t()`), else from the built-in messages (`localized.completed`, `error.wordLimit`,
`files.missing`...), which the application can override in its own vue-i18n bundles.

## Localized strings

`{ "type": "object", "format": "localizedString" }` holds `{ "en": "...", "fr": "..." }`. One input is
displayed for the current language, with a language selector when there is more than one language
(switching it switches every localized control of the form). Languages come from `options.languages`
on the control, then `config.languages`, then the `languages` prop of `QJsonForm` (or a
`jsonforms-languages` provide at the application level), and default to `['en']`.

Options: `rows` (textarea when > 1), `marked: true` for a markdown editor with preview (also the
default of `format: "obibaSimpleMde"`), `validationMessage.completed`. A required localized string
must be completed in every language; a string emptied in every language becomes `undefined` so that
`required` applies. Read-only, the markdown variant renders the text.

`{ "type": "string", "format": "markdown" }` renders the same markdown editor for a plain string.

## File upload

| Schema | Data |
|---|---|
| `type: string, format: file` | the uploaded file path (`pathKey` in the JSON response, `path` by default) |
| `type: array, format: files` | a list of file items `[{ id, fileName, size, ... }]` |
| `type: object, format: files` / `obibaFiles` | `{ [itemsKey]: [...] }` (`itemsKey`: `obibaFiles` for that format, `files` otherwise) |

Options: `multiple` (default: yes, unless `maxItems` is 1), `accept`, `emptyMessage` (read-only, no
file), `validationMessage.missingFiles` / `minItems` / `maxItems`; `minItems` / `maxItems` from the
schema (or the filtrex `min` / `max` rules) are enforced on object controls.

Upload flow, declarative: `uploadUrl` (+ `uploadMethod`, `uploadHeaders`, `fileField`, default
`file`), then the file item is read from the JSON response (`pathKey`, or the whole body), or, when
`metadataUrl` is set (`{id}` placeholder), from a `GET` of the id found in the `Location` header (the
Mica temp file flow: `uploadUrl: "/ws/files/temp"`, `metadataUrl: "/ws/files/temp/{id}"`). Uploaded
items get `justUploaded: true`; removing such an item calls `deleteUrl` (`{id}`) when set. `downloadUrl`
is a template with the item properties (`/ws/files/{id}/{fileName}`) used as link in the list.

Programmatic, through `config.fileUpload` (see `FileUploadHooks`): `upload(file, context)` returning the
item (or the path), `remove(item, context)`, `downloadUrl(item, context)`.

## Radio matrix

`{ "type": "object", "format": "radioGroupCollection" }` (or `"radio-matrix"`) renders items as rows and
values as radio columns; data is `{ [item.key]: value.key }`. Rows and columns come from `items`
(`[{ key, name }]`) and `values` (`[{ key, caption }]` or `{ key: caption }`) in the control options or,
as in the angular-schema-form add-on, on the schema itself. `options.checkboxMode` renders one checkbox
per item (`{ [item.key]: boolean }`). A required matrix must have every row answered (at least one
checked in checkbox mode): `validationMessage.allItemsSelected`.

## Dates

The date renderer (`format: date`, `datepicker`) accepts, directly or under `dateOptions`:

- `dateFormat`: mask of the stored value (`YYYY-MM-DD` by default; angular-strap masks such as
  `yyyy-MM-dd` are accepted). `format: "year-month"` uses `YYYY-MM` with a month picker.
- `min` / `max`: bounds (ISO or mask format; the filtrex `min` / `max` rules work too), with
  `validationMessage.dateRange` / `dateMin` / `dateMax`.
- `yearRef` / `monthRef` (`format: "ymdatepicker"`): names of the year and month fields (siblings of
  the control, or root fields) the date must belong to. The input is disabled until both are set, the
  value defaults to the first day of that month (`lastDay: true`: the last one) and follows them;
  `validationMessage.invalidYMDate`.

## Word limits

On string controls, `options.wordLimit: "min:max"` (or a maximum), `wordMin`, `wordMax` validate the
number of words and show a word counter (`validationMessage.wordLimitError` / `wordMinError` /
`wordMaxError`). The filtrex engine also provides `wordCount(text)` and `contains(list, value)` for
rules: `{ "validation": [{ "expr": "wordCount(abstract) <= 500", "message": "..." }] }`.

## Countries and typeahead

`format: "countries"` (or `obibaCountriesUiSelect`) is a searchable select of ISO codes, single
(`type: string`) or multiple (`type: array`). The `[{ code, name }]` list comes from
`options.countries`, `config.countries` or a `jsonforms-countries` provide, either an array or a
`{ locale: [...] }` map (the current locale is used). The `countryCodes` export holds the english and
french names of the ISO 3166-1 alpha-3 codes:

```js
import { countryCodes } from '@obiba/quasar-ui-json-form'
// <QJsonForm :config="{ countries: countryCodes }" ... />
```

`format: "typeahead"` on a string is an input with suggestions from `options.values` (strings or
`{ label, value }`), or the schema `examples` / `enum`; `options.editable: true` accepts any text.

# Setup
```bash
$ npm install
```

# Developing
```bash
$ npm run dev
```

# Building package
```bash
$ npm run build
```

# Testing
```bash
$ npm test
```

Unit tests (vitest + @vue/test-utils, jsdom) live in `ui/test`.

# Adding Testing Components
in the `ui/dev/src/pages` you can add Vue files to test your component/directive. When using `npm run dev` to build the UI, any pages in that location will automatically be picked up by dynamic routing and added to the test page.

# Adding Assets
If you have a component that has assets, like language or icon-sets, you will need to provide these for UMD. In the `ui/build/script.javascript.js` file, you will find a couple of commented out commands that call `addAssets`. Uncomment what you need and add your assets to have them be built and put into the `ui/dist` folder.

# Donate
If you appreciate the work that went into this, please consider [donating to Quasar](https://donate.quasar.dev).

# License
MIT (c) Yannick Marcon <yannick.marcon@obiba.org>

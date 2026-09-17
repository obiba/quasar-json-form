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
| `ajv` | | Custom AJV instance (`createAjv` from `@jsonforms/core`). The default one knows the custom formats of the renderers and validates `time` and `date-time` as the pickers store them (`HH:mm`, `YYYY-MM-DD HH:mm`, seconds and timezone optional) |
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
control. A `Group` displays its `label` (or `title`) as a heading; `label: false` on a control hides
its title. `VerticalLayout` / `HorizontalLayout` render their elements as direct children, so Quasar
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
defined (translated with `t()`; a single string applies to every check of the control, and in a map
`default` is the fallback of the named messages), else from the built-in messages (`localized.completed`, `error.wordLimit`,
`files.missing`...), which the application can override in its own vue-i18n bundles.

## Lists

Arrays of objects and arrays of primitives (strings, numbers, booleans, or objects with a `format`
such as localized strings) render as a list with add / remove / reorder buttons. The UI schema of
one item comes from `options.items` (`Control` scopes relative to the item schema, `#` for the item
itself), by default one control per property of an object item, or the item itself. Options:
`addLabel`, `addIcon`, `ordering` (default true), `confirmation` (confirm before removing);
`minItems` / `maxItems` from the schema (or the filtrex `min` / `max` rules) bound the list.

## Localized strings

`{ "type": "object", "format": "localizedString" }` holds `{ "en": "...", "fr": "..." }`. One input is
displayed for the current language, with a language selector when there is more than one language
(switching it switches every localized control of the form). Languages come from `options.languages`
on the control, then `config.languages`, then the `languages` prop of `QJsonForm` (or a
`jsonforms-languages` provide at the application level, a plain value or a ref), and default to
`['en']`.

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
  `yyyy-MM-dd` are accepted). It applies to `datepicker` / `ymdatepicker` controls: `format: "date"`
  is validated by AJV as an ISO date and keeps `YYYY-MM-DD`. `format: "year-month"` uses `YYYY-MM`
  with a month picker.
- `min` / `max`: bounds (ISO or mask format; the filtrex `min` / `max` rules work too), with
  `validationMessage.dateRange` / `dateMin` / `dateMax`; a value that does not match the mask reports
  `validationMessage.dateInvalid`.
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

## Geo

`format: "geo"` on an object is a map (OpenLayers, loaded on demand) on which a point, a line or a
polygon is drawn; the data is a GeoJSON geometry in WGS84 longitude / latitude, for instance
`{ "type": "Point", "coordinates": [lon, lat] }`. `options.geometries` restricts the kinds
(`point`, `linestring`, `polygon`), the toolbar picks the one to draw, locates the user
(Geolocation API) and clears the value; a point can also be typed as a latitude and a longitude.
The tiles are those of OpenStreetMap unless `options.tiles` or `config.geo.tiles` (a `{z}/{x}/{y}`
URL template, or `{ url, attributions }`) selects another source, displayed in a scale of greys unless
`grayscale: false`; `config.geo` also holds default `center`, `zoom`, `height`, `precision` and
`grayscale`:

```js
// <QJsonForm :config="{ geo: { tiles: { url: 'https://.../{z}/{x}/{y}.png', attributions: '...' }, center: [lon, lat], zoom: 6 } }" ... />
```

## angular-schema-form compatibility

`@obiba/quasar-ui-json-form/asf` converts a form of the
[angular-schema-form](https://github.com/json-schema-form/angular-schema-form) dialect (a JSON
schema and a `definition` array, as stored by Mica) into a `(schema, uischema)` pair for `QJsonForm`.
It is pure TypeScript (also exported by the main entry as `convertAsf` / `toJsonForms`):

```js
import { convert, toJsonForms } from '@obiba/quasar-ui-json-form/asf'

const { schema, uischema, diagnostics } = convert(asfSchema, asfDefinition, { translate: t })
// <QJsonForm :schema="schema" :uischema="uischema" ... />

// either dialect, detected by shape (array: ASF definition, object: JSON Forms UI schema)
const result = toJsonForms(schema, definitionOrUischema)
```

Options: `translate(key)` resolves the `t(key)` tokens of the schema and the definition (titles,
help blocks, option labels, messages); without it the `t()` wrapper is removed and the key kept, so
that strings made of a single token are still translated by the renderers with vue-i18n. `readonly`
sets `options.readonly` on every control, `languages` sets `options.languages` on the localized
strings, `rowClass` replaces the Bootstrap `row` class (`row q-col-gutter-md` by default),
`textareaRows` (3), `logger` receives the diagnostics (`console.warn` by default, `false` to silence).

| ASF | JSON Forms |
|---|---|
| `"a.b"`, `{ key: "a.b" }`, `"*"` (the properties not listed elsewhere) | `Control` with scope `#/properties/a/properties/b` |
| `section` (+ `htmlClass`), object key with `items` | `VerticalLayout` (+ `options.class`) |
| `fieldset` (+ `title`), object key without `items` | `Group` (+ `label`), one control per property |
| `help` + `helpvalue` | `Label` (`text`, HTML allowed) |
| `tabs` | `Categorization` / `Category` |
| `htmlClass` | `options.class`, with `col-xs-N` → `col-N`, `col-*-offset-N` → `offset-*-N`, `row` → `rowClass` |
| `condition` | `rules.visible` (filtrex, see below) |
| `notitle` | `label: false` |
| `title`, `description` | written on the schema property |
| `titleMap` | `oneOf` (`{ const, title }`) on the property or its items; enum arrays get `uniqueItems` |
| `radios`, `checkboxes` | `options.format: "radio"` / `"checkbox"`; enum arrays default to checkboxes |
| `textarea`, `rows` | `options.rows` |
| `localizedstring`, `obibaSimpleMde` (`marked`), `obibaFileUpload`, `radioGroupCollection`, `obibaCountriesUiSelect`, `sf-typeahead`, `datepicker` | `options.format` when the schema `format` does not already select the renderer |
| `wordLimit`, `emptyMessage`, `validationMessage` (object or string), `placeholder`, `marked` | same option |
| `readonly` | `options.readonly`, also on the item controls of an array |
| `add` | `options.addLabel` |
| `minItems`, `maxItems`, `required: true` | written on the schema |
| `dateOptions` (`dateFormat`, `yearRef`, `monthRef`, `lastDay`, `validationMessage`) | `options.dateOptions` / `options.validationMessage` |
| `dateOptions.minDate` / `maxDate` (+ `minDateIsRef` / `maxDateIsRef`) | `options.min` / `max`, or `rules.min` / `max` when it names a field |
| array key with `items` (`"arr[].x"` keys) | `options.items` (item UI schema, scopes relative to the item) |
| `x-schema-form` on a schema property | definition defaults for that key |
| `actions`, `submit`, `button`, `template`, `hidden`, `sf-obiba-selection-tree` | skipped (info diagnostic) |

Unknown keys and unsupported elements without a key are skipped, a keyed control of an unknown type
is rendered from its schema, and a condition that cannot be translated leaves its element visible; all
of these are reported in `diagnostics` (`{ level, message, key?, element? }`).

Conditions (`transpileCondition`) accept the JavaScript subset found in form definitions:
`model.a.b` paths, string / number / boolean / null literals, `!`, `&&`, `||`, parentheses,
`==` / `===` / `!=` / `!==` / `<` / `<=` / `>` / `>=`, `model.list.indexOf(v) >= 0` (or `> -1`,
`!= -1`, and the negative forms), `model.list.includes(v)` and `model.list.length`. JavaScript
truthiness is kept through the `truthy()` filtrex function (`!model.b` → `not (truthy(b))`),
`indexOf` becomes `contains(list, v)`, and comparisons with `true` / `false` / `null` / `undefined` use
the `isBoolean` / `isNull` / `isUndefined` functions with the strict / loose distinction of JavaScript
(`model.a == null` → `isNull(a)`, `model.a === null` → `(isNull(a) and not (isUndefined(a)))`,
`model.a === true` → `(isBoolean(a) and truthy(a))`). Known deviations from JavaScript: a loose
`model.a == true` is JavaScript truthiness (`2 == true` is true here, false in JavaScript), filtrex `==`
is strict (`'1' == 1` is false), and an ordering comparison is false when the value is null, undefined
or an empty string. Ordering comparisons with a boolean or null literal are rejected.

The 13 default Mica forms are converted as acceptance fixtures (`test/fixtures/asf`, snapshots in
`__snapshots__`), and the `ui/dev` page "test-asf-converter" renders any pasted pair.

# Renderer catalog

`@obiba/quasar-ui-json-form/catalog` describes every built-in renderer and the form component:
the schema shapes that trigger it, the element keys, options and validation checks it understands,
the data it writes, and the items it contributes to the form builder palette (name, label, icon,
and the schema and UI schema fragments a new element starts from). It is the source of the API
documentation of the site and of the form builder.

```js
import { catalog, catalogItems, controlApi, rendererOptions } from '@obiba/quasar-ui-json-form/catalog'

catalog.QStringRenderer.options.rows.desc    // 'Number of rows; when greater than 1 the input is a `textarea`.'
rendererOptions(catalog.QStringRenderer)    // its options, with the ones common to every control
catalogItems.find((item) => item.name === 'textarea')  // { renderer: 'QStringRenderer', schema, uischema, ... }
```

`ui/test/catalog.test.ts` checks that every renderer registered by the plugin is described, and
that every `options.<name>` read by a renderer is documented.

# Form builder

`@obiba/quasar-ui-json-form/builder` holds the `QJsonFormBuilder` component and the model it
works on. The component edits a form bound to `v-model` as `{ schema, uischema, translations }`:
the outline of the form with its palette (drag and drop to reorder and reparent, with sortablejs),
the properties of the selected node (key, required, texts in the builder language, choices, the
settings of its renderer from the catalog, validation keywords, filtrex rules, raw JSON), the live
preview with a language switch, the translations editor (a button collects the texts of the form,
turning literals into keys and adding the missing entries of every language; the translations as a CSV file,
`key` then one column per language, downloaded for the translators and uploaded back: the
non-empty cells update or add keys and languages), and the source with import and export (a
form, a schema alone, or an angular-schema-form pair).

```html
<QJsonFormBuilder v-model="form" :languages="['en', 'fr']" :catalog="[colorApi]" :renderers="[colorRenderer]" :config="config" />
```

```js
import { QJsonFormBuilder } from '@obiba/quasar-ui-json-form/builder'
```

| Prop | Content |
|---|---|
| `modelValue` | the form, `{ schema, uischema, translations }` (`v-model`) |
| `languages` | languages of the form, added to the ones of its translations (`['en', 'fr']` or `{ en: 'English' }`) |
| `locale` | language edited and previewed initially (the vue-i18n locale when it is one of the languages) |
| `catalog` | `RendererApi` descriptions of the renderers of the application, added to the palette |
| `renderers`, `config` | passed to the preview form |

The labels of the builder come from the `builder.*` keys of the built-in messages (english and
french), overridable in the application bundles.

## Model

The model of a form under construction: a tree of nodes mirroring the UI schema (`control`,
`layout` or plain `element` nodes, a list of objects carrying the layout of its items as
`detail`), bound to the JSON schema of the data and to the translations of the form.

```js
import { fromDefinition, toDefinition, addNode, setText, textSlots } from '@obiba/quasar-ui-json-form/builder'
import { findCatalogItem } from '@obiba/quasar-ui-json-form/catalog'

const model = fromDefinition({ schema, uischema, translations })
const node = addNode(model, model.root.id, findCatalogItem('textarea'), undefined, 'comment')
setText(model, node, textSlots(model, node)[0], 'en', 'Your comment')  // schema title: `comment.title`
const { schema, uischema, translations } = toDefinition(model)
```

- `fromDefinition` copies the form (a missing UI schema is generated, nested translations are
  flattened to dotted keys) and reports in `model.diagnostics` what it could not model; the
  unknown keywords of the schema and of the elements are kept and written back by
  `toDefinition`. `fromAsf` accepts an angular-schema-form pair.
- `addNode`, `removeNode`, `moveNode`, `duplicateNode` and `renameProperty` keep the schema in
  step with the tree: the property of a control is created in its container (the root schema, or
  the `items` of its list), removed with it unless another control uses it, copied under a new
  key, or renamed with the scopes of the nested controls. A control cannot move into or out of a
  list. `ruleReferences` finds the filtrex rules mentioning a property.
- Every text is a translation key: `textSlots` lists the texts of a node (title, description,
  label, hint, option labels, messages...), `getText` and `setText` read and write them in a
  language, the key being generated from the position of the node (`name.title`,
  `contacts.items.email.hint`, `group.1.label`). `usedKeys`, `missingTranslations` and
  `pruneTranslations` serve the translations editor.

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

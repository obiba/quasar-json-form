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
| `config` | | JSON Forms config passed to renderers |

Events: `update:modelValue` (data), `update:errors` (AJV `ErrorObject[]`, also emitted on mount, in every validation mode except `NoValidation`).

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

---
title: Migrating from angular-schema-form
---

# Migrating from angular-schema-form

<p class="doc-lead">The <code>asf</code> entry converts a form of the <a href="https://github.com/json-schema-form/angular-schema-form">angular-schema-form</a> dialect, a JSON schema and a <code>definition</code> array as stored by Mica, into a schema and UI schema for <code>QJsonForm</code>.</p>

The schema is nearly standard JSON Schema already: the custom formats (`localizedString`,
`obibaFiles`, `radioGroupCollection`, `obibaCountriesUiSelect`...) are understood by the
renderers. The `definition` array is translated into a JSON Forms UI schema. Everything the
converter cannot translate is reported as a diagnostic and skipped, so a form always renders.

```js
import { convert } from '@obiba/quasar-ui-json-form/asf'

const { schema, uischema, diagnostics } = convert(asfSchema, asfDefinition, { translate: t })
```

```html
<QJsonForm v-model="data" :schema="schema" :uischema="uischema" :languages="['en', 'fr']" />
```

The converter is pure TypeScript, also exported by the main entry as `convertAsf` and
`toJsonForms`. Try it on the [converter playground](#/migration/playground) with the default
Mica forms.

## Either dialect

`toJsonForms(schema, definitionOrUischema)` detects the dialect by shape: an array is an ASF
definition and is converted, an object is a JSON Forms UI schema and is returned as-is with the
schema. This lets an application accept both formats while its forms migrate.

```js
import { toJsonForms, isAsfDefinition } from '@obiba/quasar-ui-json-form/asf'

const { schema, uischema } = toJsonForms(schema, definitionOrUischema)
```

## Options

| Option | Default | Description |
|---|---|---|
| `translate` | | Resolves the `t(key)` tokens of the schema and the definition (titles, help blocks, option labels, messages). Without it, the `t()` wrapper is removed and the key kept, so that strings made of a single token are still translated by the renderers with vue-i18n |
| `languages` | | Set as `options.languages` on the localized string controls |
| `readonly` | `false` | Set `options.readonly` on every control |
| `rowClass` | `row q-col-gutter-md` | CSS class replacing the Bootstrap `row` |
| `textareaRows` | `3` | Rows of the `textarea` controls without `rows` |
| `logger` | `console.warn` | Receives the diagnostics; `false` to silence |

## Diagnostics

The result carries `diagnostics`, an array of `{ level, message, key?, element? }` with level
`warn` or `info`. Unknown keys and unsupported elements without a key are skipped, a keyed control
of an unknown type is rendered from its schema, a condition that cannot be translated leaves its
element visible, and `actions`, `submit`, `button`, `template`, `hidden` and
`sf-obiba-selection-tree` elements are dropped with an info diagnostic.

The 13 default Mica forms are the acceptance fixtures of the converter: they convert without any
diagnostic and their output is snapshot-tested.

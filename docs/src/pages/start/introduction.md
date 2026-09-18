---
title: Introduction
---

# Introduction

<p class="doc-lead">Quasar JSON Form renders dynamic, schema-driven forms from a JSON Schema and an optional UI schema, using <a href="https://jsonforms.io/">JSON Forms</a> renderers styled with <a href="https://quasar.dev/">Quasar</a> components.</p>

Give it a schema describing the data and it renders one control per property, validates the data
with [AJV](https://ajv.js.org/) and reports the errors on the controls. Add a UI schema to lay the
controls out, pick a specific renderer, or set the props of the underlying Quasar component.

<DocExample name="json-form/basic" title="A form from a schema alone" source />

## How it works

- **Schema**: a [JSON Schema](https://json-schema.org/) (draft 7). `type`, `format`, `enum`, `oneOf`
  and the array `items` select the renderer; `required`, `minLength`, `minimum`, `pattern`... are
  validated.
- **UI schema**: a [JSON Forms UI schema](https://jsonforms.io/docs/uischema): layouts
  (`VerticalLayout`, `HorizontalLayout`, `Group`, `Categorization`...), `Label`s, and `Control`s
  pointing at a schema property through `scope`. The `options` of a control configure the renderer
  and anything else is passed to the Quasar component.
- **Rules**: `visible`, `enabled`, `min`, `max`, `compute` and `validation` rules written as
  [expressions](#/start/rules) (a JavaScript subset) over the form data, on the schema or the
  UI schema.
- **i18n**: every title, description, option label, hint and message goes through vue-i18n `t()`,
  so it can be an i18n key or a literal string.
- **Extensible**: the application can add its own [controls](#/start/custom-controls), written
  with the same composables as the built-in ones.
- **Builder**: the [`QJsonFormBuilder`](#/builder/overview) component edits a complete form,
  schema, UI schema and translations, with a live preview.

## Packages

| Package | Purpose |
|---|---|
| [`@obiba/quasar-ui-json-form`](https://www.npmjs.com/package/@obiba/quasar-ui-json-form) | The `QJsonForm` component and its renderers (ESM, CommonJS and UMD builds), with the `asf` converter, the renderer `catalog` and the form `builder` as separate entries |
| [`@obiba/quasar-app-extension-json-form`](https://www.npmjs.com/package/@obiba/quasar-app-extension-json-form) | Quasar CLI app extension that installs and registers the component |

Both are compatible with Quasar v2 and Vue 3, and require vue-i18n v11 in the application.

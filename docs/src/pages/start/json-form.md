---
title: QJsonForm
---

# QJsonForm

<p class="doc-lead">The form component: give it the data, a schema and optionally a UI schema.</p>

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

Without a UI schema, one control per property of the schema is rendered in a vertical layout.

<DocExample name="json-form/basic" title="Schema only" />

## UI schema

A UI schema lays the controls out and configures them. `Control` elements point at a schema
property through their `scope` (a JSON pointer); the `options` of a control are read by the
renderer and, for the rest, passed as props to the Quasar component.

<DocExample name="json-form/uischema" title="Layouts and control options" source />

## Errors

The `errors` model contains the AJV validation errors (none in `NoValidation` mode) followed by
the errors found by the renderers themselves, which are always evaluated: filtrex `validation`
rules (`keyword: "validation"`), localized strings not completed (`completed`), word limits
(`wordLimit`), file counts (`files`), radio matrix (`allItemsSelected`) and date bounds (`date`).
Their `instancePath` points at the control. The errors are also emitted on mount, so that a
submit button can be disabled right away.

Required controls get a `*` appended to their label. Error messages are looked up with vue-i18n
under the [JSON Forms i18n keys](https://jsonforms.io/docs/i18n): `<path>.error.<keyword>` for a
specific control, then `error.<keyword>` (`error.required`, `error.minLength`, `error.pattern`...)
with the AJV error params available for interpolation (`{limit}`, `{pattern}`, `{format}`...),
then `error.default`.

## Read-only

The `readonly` prop renders every control read-only: inputs are not editable and list / upload
buttons are hidden. A single control can also be read-only through `options.readonly` in the UI
schema or `readOnly` in the schema.

## API

<DocApi name="QJsonForm" />

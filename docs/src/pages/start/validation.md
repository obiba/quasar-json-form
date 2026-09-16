---
title: Validation
---

# Validation

<p class="doc-lead">The schema is validated with AJV, the renderers add their own checks, and both kinds of errors are displayed on the controls and emitted as <code>errors</code>.</p>

## Schema keywords

`required`, `minLength`, `maxLength`, `pattern`, `format` (`email`, `uri`, `date`, `time`,
`date-time`...), `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`,
`minItems`, `maxItems`, `uniqueItems`, `enum`, `const`... are validated by AJV. Required controls
get a `*` appended to their label.

<DocExample name="validation/keywords" title="Schema keywords" source />

The custom formats of the renderers (`file`, `localizedString`, `datepicker`, `typeahead`...) are
registered as always valid on the default AJV instance. `time` and `date-time` are validated as
the pickers store them (`HH:mm`, `YYYY-MM-DD HH:mm`, seconds and timezone optional). Pass your own
instance through the `ajv` prop (`createAjv` from `@jsonforms/core`) to change this.

## Validation modes

The `validationMode` prop of `QJsonForm` is `ValidateAndShow` by default. `ValidateAndHide`
validates and emits the errors without showing them on the controls. `NoValidation` skips the
schema validation entirely. The renderer-level checks and the filtrex `validation` rules are
always evaluated.

<DocExample name="validation/modes" title="NoValidation: only the filtrex rule applies" />

## Renderer checks

Some renderers validate what the schema cannot express: word limits on strings, date bounds,
localized strings completed in every language, file counts, every row of a radio matrix answered,
and the filtrex `validation` rules of any control. These errors are reported in the `errors` model
after the AJV errors, with their own `keyword` (`validation`, `wordLimit`, `date`, `completed`,
`files`, `allItemsSelected`) and an `instancePath` pointing at the control.

Their message comes from `options.validationMessage.<name>` on the control when defined (a single
string applies to every check of the control; `default` is the fallback of the named messages), and
otherwise from the built-in i18n keys. The message is translated with `t()`: when it is a key of
the application bundles, the check params (`{min}`, `{max}`, `{limit}`...) are interpolated; a
literal string is displayed as-is.

<DocExample name="validation/messages" title="Custom messages" />

## Errors model

`v-model:errors` receives AJV-shaped `ErrorObject[]` (`instancePath`, `keyword`, `message`,
`params`), also emitted on mount so that a submit button can be disabled right away. Errors from
elsewhere, for instance a server, are displayed on the controls when passed through the
`additionalErrors` prop in the same shape.

```js
const errors = ref([])
const canSubmit = computed(() => errors.value.length === 0)
```

Read-only controls (`readonly` prop, `options.readonly`, schema `readOnly`) are still validated.

---
title: Custom controls
---

# Custom controls

<p class="doc-lead">The application adds its own controls with the <code>renderers</code> prop: JSON Forms renderer entries, tried before the built-in ones.</p>

```html
<QJsonForm v-model="data" :schema="schema" :uischema="uischema" :renderers="[colorRenderer]" />
```

A renderer entry is a `{ renderer, tester }` pair, as in any [JSON Forms](https://jsonforms.io/docs/tutorial/custom-renderers)
application: the `renderer` is a Vue component, the `tester` gives a rank to a control (`-1` to
decline it) and the control is rendered by the entry with the highest rank. The application
entries come first, so they win a tie with a built-in renderer.

<DocExample name="custom/color" title="A color control" source />

## Tester

`rankWith` and the predicates of `@jsonforms/core` (`isStringControl`, `isNumberControl`,
`schemaTypeIs`, `formatIs`, `optionIs`, `uiTypeIs`, `and`, `or`...) build the tester. The rank
must beat the built-in renderer that would otherwise take the control: the *Triggers* table in
the API of each control gives its rank (3 for a plain string, number or boolean, 4 for an `enum`
or a date, up to 7 for the format-specific controls).

```js
import { rankWith, isStringControl, optionIs, and } from '@jsonforms/core'

const tester = rankWith(4, and(isStringControl, optionIs('format', 'color')))
```

A custom `format` in the UI schema `options` is the simplest trigger. A custom `format` in the
JSON Schema works too, but AJV does not know it: register it on the instance given to the `ajv`
prop (`ajv.addFormat('color', true)`) to avoid a warning. A custom UI schema `type` (for a layout
or a widget without data) is matched with `uiTypeIs`.

## Component

The component is written like the built-in ones: `rendererProps` and `useJsonFormsControl` from
`@jsonforms/vue` give the resolved `control` (its `path`, `data`, `schema`, `uischema`, `errors`,
`required`...) and the `handleChange(path, value)` function to store a value. The
`useControlProperties(control)` composable of the library then evaluates the rules and prepares
what every control displays:

| Member | Content |
|---|---|
| `isVisible`, `isEnabled`, `isReadonly` | the `visible` and `enabled` [rules](#/start/rules) and the read-only state (form prop, `options.readonly` or `readOnly` in the schema) |
| `renderHeader()`, `renderHint()`, `hintSlot` | the title and description above the control, and the hint after it (or as a `hint` slot of a Quasar field) |
| `inputLabel`, `requiredMark` | the label of the input with the `*` of a required control |
| `hasError`, `errorMessage` | the errors of the control, translated |
| `options`, `config` | the UI schema `options` and the form `config` |
| `minValue`, `maxValue`, `computeValue` | the `min`, `max` and `compute` rules |
| `selectOptions`, `isValueValid`, `clearInvalidSelection` | the `enum` / `oneOf` values with their visibility rules |
| `validationMessage(name, fallbackKey)` | the message of a renderer-level check, from `options.validationMessage` |

Pass the UI schema `options` as props of the Quasar component, after removing the ones meant
for the renderer with `omitOptions(options.value)` (`format`, `validationMessage`...). Clear the
value with `handleChange(path, undefined)` when the control becomes hidden, so that a hidden
control does not keep data: the built-in controls watch `isVisible` for this.

Translations go through `useFormI18n()`, which returns `t` and `te` from vue-i18n (or a
pass-through when it is not installed) and `translate`, which falls back to the library messages.

## Reporting errors

A control that validates its value itself (a word limit, a set of fields to complete...) reports
its messages with `useReportedErrors(path, keyword, messages)`: they are merged with the AJV
errors in the `errors` model of the form, under the given `keyword`, and removed when the control
is unmounted.

```js
import { computed } from 'vue'
import { useReportedErrors } from '@obiba/quasar-ui-json-form'

const messages = computed(() => (isDark(control.value.data) ? ['Too dark'] : []))
useReportedErrors(() => control.value.path, 'contrast', messages)
```

Read-only rendering is the responsibility of the control: check `isReadonly` and render the
value (or the Quasar component with `readonly`) instead of an editable input.

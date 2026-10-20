---
title: Migrating from Amber forms
---

# Migrating from Amber forms

<p class="doc-lead">The <code>amber</code> entry converts the schema of an <a href="https://www.obiba.org/pages/products/amber/">Amber</a> form, a tree of <code>items</code> with its <code>i18n</code> translations, into a schema, a UI schema and translations for <code>QJsonForm</code>, collecting the same data.</p>

```js
import { convert } from '@obiba/quasar-ui-json-form/amber'

const { schema, uischema, translations, diagnostics } = convert(amberSchema)
```

```html
<QJsonForm v-model="data" :schema="schema" :uischema="uischema" :translations="translations" :locale="locale" apply-defaults />
```

The data keeps the shape of the Amber forms, so that the records already collected are read and
exported as before: a group is a nested object, a multiple choice an array, a map a GeoJSON
`Feature`. The root UI schema has one element per top-level item: an application paging the form
(Amber `layout: "multi"`) renders `uischema.elements[page]`. The form-level settings (`label`,
`idLabel`, `idMask`, `layout`, `license`...) are not converted. `applyDefaults` sets the item
defaults of a new record. The [builder](#/builder/overview) imports an Amber schema too.

## Items

| Amber item | Schema | Control options |
|---|---|---|
| `text`, `textarea` | `string` | `mask`; `rows: 3` |
| `number` | `number` | |
| `slider`, `rating` | `integer`, `minimum` / `maximum` | `format: slider` (`labelAlways`) / `rating` (`icon`, `color`, `size`) |
| `radiogroup`, `select` | `oneOf` of the options | `format: radio` |
| `checkboxgroup`, `select` with `multiple` | array of `oneOf`, `uniqueItems` | `format: checkbox` |
| `autocomplete` | `string`, array with `multiple` | `format: typeahead`, `values`, `editable` (`newValue`) |
| `image-select` | `oneOf`, array with `multiple` | `format: image-map`, `image`, `areas` (`poly`), `select` (`showSelect`) |
| `toggle` | `boolean` | |
| `date`, `datetime`, `time` | `format: date` / `date-time` / `time` | |
| `map` | `format: geo`, array of them with `multiple` | `feature: true`, `geometries`, `height`, `center`, `zoom`, `locate` |
| `computed` | `format: computed`, `rules.compute` | `hidden: true` |
| `section` | | `Section` element |
| `group` | `object` | `Group` element (`VerticalLayout` without label nor description) |

`label` and `description` are the `title` and `description` of the property, `hint` the hint of
the control, `labelClass` / `descriptionClass` its `titleClass` / `descriptionClass`, `default`
the schema `default`. A `required` item is in the `required` list of the form, or a `required`
rule inside a group (AJV does not validate the properties of a group not answered yet).

## Expressions

`condition`, `required`, `disabled`, `validation` and `compute` become the `visible`, `required`,
`enabled` (negated), `validation` and `compute` [rules](#/start/rules), rewritten by
`rewriteExpression`:

| Amber | Rule |
|---|---|
| `$('GROUP.ITEM')`, `formData.GROUP.ITEM` | `GROUP.ITEM` |
| `val` | the path of the item itself |
| `Date.parse(d)`, `Date.now()` | `parseDate(d)`, `now()` |
| `new Date().getFullYear()`, `getMonth()`, `getDate()`, `getDay()` | `currentYear()`, `(currentMonth() - 1)`, `currentDay()`, `currentWeekday()` |
| `new Date().getHours()`, `getMinutes()`, `getSeconds()`, `getTime()` | `currentHour()`, `currentMinute()`, `currentSecond()`, `now()` |
| `list.includes(v)`, `list.indexOf(v) > -1` | `contains(list, v)` |
| `list.length` | `length(list)` |
| `(data) => data.A + data.B` | `A + B` |

`map()` is a rule function. An expression that is still not a valid rule (a block, a method call)
is reported as a diagnostic and dropped: the item is then always visible, required or valid.

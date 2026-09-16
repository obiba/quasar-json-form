---
title: Rules
---

# Rules

<p class="doc-lead">Dynamic behaviour is declared with <a href="https://github.com/m93a/filtrex">filtrex</a> expressions over the form data, on the schema property or on the UI schema element.</p>

```json
{ "type": "Control", "scope": "#/properties/city", "rules": { "visible": "country == \"CA\"" } }
```

Rules on the UI schema element override the same rules on the schema property. Field names are
the root data properties (`a.b` for nested objects). Rules also apply to layouts, groups, labels
and sections.

| Rule | Type | Effect |
|---|---|---|
| `visible` | boolean | Hide the element when false; the data of a hidden control is cleared |
| `enabled` | boolean | Disable the control when false |
| `validation` | `[{ expr, message }]` | Each expression must be true, else `message` (translated) is displayed and reported with the `validation` keyword |
| `min` / `max` | value | Bounds for [dates](/#/controls/date), [lists](/#/controls/list) and [file uploads](/#/controls/file-upload) |
| `compute` | value | Value of a [computed](/#/controls/computed) control |

<DocExample name="rules/visible-enabled" title="visible and enabled" source />

## Validation rules

<DocExample name="rules/validation" title="validation" />

## Bounds

<DocExample name="rules/min-max" title="max on a list" />

## Expressions

Filtrex supports arithmetic, comparisons (`==`, `!=`, `<`, `<=`, `>`, `>=`), `and`, `or`, `not`,
`in` (`"one" in picks`), `if ... then ... else`, and ternaries through `ifElse`. Strings use
double quotes. The following functions are added:

| Function | Description |
|---|---|
| `isEmpty(v)`, `isNotEmpty(v)` | null, undefined or empty string |
| `isNull(v)`, `isUndefined(v)` | null or undefined; undefined only |
| `isBoolean(v)`, `isNumber(v)`, `isString(v)` | type checks |
| `truthy(v)` | JavaScript truthiness |
| `ifElse(cond, a, b)` | `a` when `cond` is true, else `b` |
| `length(v)` | length of a string or array |
| `get(v, i)` | element `i` of a string or array |
| `contains(list, v)` | `list` (array or string) contains `v` |
| `inArray(v, a, b, ...)` | `v` is one of the arguments |
| `startsWith(s, p)`, `endsWith(s, s)` | string prefix / suffix |
| `matches(s, pattern)` | regular expression test (pattern of at most 100 characters) |
| `wordCount(s)` | number of whitespace-separated words |

An expression that fails to evaluate logs an error and counts as `false` (`true` for `visible`).
The `filtrexEngine` export lets the application register more functions with `addFunction`.

## Options visibility

A `oneOf` entry of a [select](/#/controls/select) or [radio](/#/controls/options) control can carry
its own `rules.visible`; a selected value that becomes hidden is cleared.

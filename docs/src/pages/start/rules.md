---
title: Rules
---

# Rules

<p class="doc-lead">Dynamic behaviour is declared with expressions over the form data, on the schema property or on the UI schema element.</p>

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
| `min` / `max` | value | Bounds for [dates](#/controls/date), [lists](#/controls/list) and [file uploads](#/controls/file-upload) |
| `compute` | value | Value of a [computed](#/controls/computed) control |

<DocExample name="rules/visible-enabled" title="visible and enabled" source />

## Validation rules

<DocExample name="rules/validation" title="validation" />

## Bounds

<DocExample name="rules/min-max" title="max on a list" />

## Expressions

Rules are a subset of JavaScript, evaluated by
[angular-expressions](https://github.com/peerigon/angular-expressions) with the form data as scope:

- `a.b.c` paths into the form data; a missing segment gives `undefined` rather than an error;
- `"string"` / `'string'`, number, `true`, `false`, `null` and `undefined` literals, `[a, b]` arrays;
- arithmetic (`+`, `-`, `*`, `/`, `%`), comparisons (`==`, `!=`, `===`, `!==`, `<`, `<=`, `>`, `>=`,
  with the JavaScript loose / strict distinction), `&&`, `||`, `!` and the `cond ? a : b` ternary;
- calls of the functions below (only these: methods such as `list.indexOf(v)` are not available).

Assignments and the `this` keyword are rejected, and the data is never mutated by a rule.

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

An expression that fails to compile or to evaluate logs an error and counts as `false` (`true` for
`visible`). The values follow JavaScript: `undefined > 3` is `false` and `undefined % 2 == 0` is
`false` too, so a `validation` rule of an optional field is usually guarded, as in
`isEmpty(even) || even % 2 == 0`.

The `ruleEngine` export lets the application register more functions with `addFunction`:

```ts
import { ruleEngine } from '@obiba/quasar-ui-json-form'

ruleEngine.addFunction('isAdult', (age: number) => age >= 18)
```

### Migrating from filtrex

Rules used to be [filtrex](https://github.com/cshaa/filtrex) expressions. Rewrite
`and` / `or` / `not` as `&&` / `||` / `!`, `x in list` as `contains(list, x)`, `mod` as `%`, and
`if c then a else b` as `c ? a : b`; the functions and the comparison operators are unchanged
(`==` is now the loose JavaScript equality, `===` the strict one).

## Options visibility

A `oneOf` entry of a [select](#/controls/select) or [radio](#/controls/options) control can carry
its own `rules.visible`; a selected value that becomes hidden is cleared.

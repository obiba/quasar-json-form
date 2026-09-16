---
title: Conditions
---

# Conditions

<p class="doc-lead">The JavaScript <code>condition</code> expressions of angular-schema-form are transpiled into filtrex <code>rules.visible</code>.</p>

`transpileCondition` accepts the JavaScript subset found in form definitions and throws a
`ConditionError` for anything else. Try it:

<DocConditionTranspiler />

## Accepted syntax

- `model.a.b` paths (the `model.` prefix is dropped), string, number, boolean, `null` and
  `undefined` literals;
- `!`, `&&`, `||` and parentheses;
- `==`, `===`, `!=`, `!==`, `<`, `<=`, `>`, `>=`;
- `model.list.indexOf(v) >= 0` (or `> -1`, `!= -1`, and the negative forms) and
  `model.list.includes(v)`, mapped to `contains(list, v)`;
- `model.list.length`, mapped to `length(list)`.

## Truthiness and null checks

filtrex has neither boolean nor null literals, so JavaScript truthiness is kept through the
`truthy()` function where a value is used as a boolean (`!model.b` becomes `not (truthy(b))`), and
comparisons with `true`, `false`, `null` and `undefined` use the `isBoolean`, `isNull` and
`isUndefined` functions with the strict / loose distinction of JavaScript:

| JavaScript | filtrex |
|---|---|
| `model.a == null` | `isNull(a)` |
| `model.a === null` | `(isNull(a) and not (isUndefined(a)))` |
| `model.a === undefined` | `isUndefined(a)` |
| `model.a === true` | `(isBoolean(a) and truthy(a))` |
| `model.a == true` | `truthy(a)` |

Known deviations from JavaScript: a loose `model.a == true` is JavaScript truthiness (`2 == true`
is true here, false in JavaScript), filtrex `==` is strict (`'1' == 1` is false), and an ordering
comparison is false when the value is null, undefined or an empty string. Ordering comparisons with
a boolean or null literal are rejected.

## In the converter

A `condition` that cannot be transpiled is reported as a diagnostic and its element is left
visible. The transpiler is exported as `transpileCondition` by the `asf` entry, and as
`transpileAsfCondition` by the main one.

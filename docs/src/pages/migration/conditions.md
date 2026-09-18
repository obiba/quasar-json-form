---
title: Conditions
---

# Conditions

<p class="doc-lead">The JavaScript <code>condition</code> expressions of angular-schema-form are transpiled into <code>rules.visible</code> <a href="#/start/rules">rules</a>.</p>

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

## Booleans

Rules are a JavaScript subset, so the literals, operators and their loose / strict distinction are
kept as they are (`model.a === null` becomes `a === null`). A `visible` rule must evaluate to a
boolean, which `&&` and `||` do not guarantee in JavaScript: a value used as a boolean is coerced
with `!!`, `!` and the comparisons already being booleans.

| JavaScript | Rule |
|---|---|
| `model.a` | `!!a` |
| `!model.a` | `!a` |
| `model.a && model.b == 1` | `!!a && b == 1` |
| `model.a == true` | `a == true` |
| `model.list.indexOf('x') < 0` | `!contains(list, "x")` |

The only deviation from JavaScript is a missing object in a path: `model.a.b` is `undefined`
rather than an error when `a` is not set.

## In the converter

A `condition` that cannot be transpiled is reported as a diagnostic and its element is left
visible. The transpiler is exported as `transpileCondition` by the `asf` entry, and as
`transpileAsfCondition` by the main one.

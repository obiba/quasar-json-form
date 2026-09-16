---
title: Toggle
---

# Toggle

<p class="doc-lead">A <code>{ "type": "boolean" }</code> property renders a <a href="https://quasar.dev/vue-components/toggle">QToggle</a>.</p>

The schema `title` and `description` are displayed above the toggle, `label` on the control
element is the text of the toggle and `hint` is displayed under it.

<DocExample name="toggle/basic" title="Toggles" source />

## A toggle that must be on

Do not express a boolean that must be checked with `const: true` (nor `enum: [true]`): the JSON
Forms enum tester matches any schema with a `const` or `enum` keyword, whatever its type, and
its select renderer outranks the toggle renderer. The property is then rendered as a
[select](#/controls/select) whose options are built from `enum`, which is missing: an empty
dropdown.

Wrap the constraint in `allOf` instead. The property stays a plain boolean for the renderers,
so it gets a toggle, and AJV still reports a "must be equal to true" error on it while it is
off. The toggle has no message area, so the error is only visible in the `errors` model of the
form (see [validation](#/start/json-form)).

```json
{
  "terms": { "type": "boolean", "title": "I accept the terms", "allOf": [{ "const": true }] }
}
```

## Quasar props

<DocExample name="toggle/quasar-props" title="Colors, icons, label and hint" />

## API

<DocApi name="QToggleRenderer" />

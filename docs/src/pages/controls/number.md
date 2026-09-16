---
title: Number
---

# Number

<p class="doc-lead">A <code>{ "type": "number" }</code> or <code>{ "type": "integer" }</code> property renders a numeric <a href="https://quasar.dev/vue-components/input">QInput</a>.</p>

The value is stored as a JavaScript number; an emptied input stores `undefined` so that `required`
applies. `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf` and the
`integer` type are validated by AJV. An integer with `options.format` `slider` or `rating` renders
a [slider](#/controls/slider) or a [rating](#/controls/rating) instead.

<DocExample name="number/basic" title="Number and integer" source />

## Quasar props

Every option is passed to `QInput`; the native `step`, `min` and `max` attributes drive the
spinner of the browser.

<DocExample name="number/quasar-props" title="Prefix, suffix and step" />

## API

<DocApi name="QNumberRenderer" />

---
title: Range
---

# Range

<p class="doc-lead">An object with <code>format: "range"</code> renders a <a href="https://quasar.dev/vue-components/range">QRange</a> selecting two ends.</p>

The value is the QRange model, an object `{ min, max }` of two numbers, and the schema declares
the `min` and `max` properties so that `minimum`, `maximum` or `required` apply. The format is
read from the schema or from `options.format`. The schema `title` and `description` are displayed
above the range and the `hint` of the control element under it, unless there is an error. Every
other option is passed to `QRange`: `min`, `max`, `step`, `minRange`, `maxRange`, `dragRange`,
`markers`, `label`, `labelAlways`, `color`... For a single value, see the [slider](#/controls/slider).

<DocExample name="range/basic" title="Ranges" source />

## API

<DocApi name="QRangeRenderer" />

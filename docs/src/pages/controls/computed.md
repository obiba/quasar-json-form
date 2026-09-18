---
title: Computed
---

# Computed

<p class="doc-lead">A control with <code>format: "computed"</code> writes the result of its <code>compute</code> rule into the data.</p>

The [rule](#/start/rules) expression is re-evaluated whenever the form data changes. The title
and description are rendered as markdown above the value, the hint under it, and `options.show: true`
displays the value. A hidden computed control stores `undefined`.

<DocExample name="computed/basic" title="Total" source />

## API

<DocApi name="QComputedRenderer" />

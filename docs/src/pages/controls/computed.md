---
title: Computed
---

# Computed

<p class="doc-lead">A control with <code>format: "computed"</code> writes the result of its <code>compute</code> rule into the data.</p>

The [filtrex](#/start/rules) expression is re-evaluated whenever the form data changes. The label
and description are rendered as markdown, and `options.show: true` displays the value. A hidden
computed control stores `undefined`.

<DocExample name="computed/basic" title="Total" source />

## API

<DocApi name="QComputedRenderer" />

---
title: Radio matrix
---

# Radio matrix

<p class="doc-lead">An object with <code>format: "radioGroupCollection"</code> (or <code>"radio-matrix"</code>) renders items as rows and values as radio columns.</p>

Rows come from `items` (`[{ key, name }]`) and columns from `values` (`[{ key, caption }]` or
`{ key: caption }`), in the control options or directly on the schema property as in the
angular-schema-form add-on. Labels are translated and rendered as inline markdown. The data is
`{ [item.key]: value.key }`; a required matrix must have every row answered.

<DocExample name="radio-matrix/basic" title="Radio matrix" source />

## Schema definition and checkbox mode

`options.checkboxMode: true` renders one checkbox per item and stores `{ [item.key]: boolean }`;
a required matrix then needs at least one checked item.

<DocExample name="radio-matrix/schema-checkbox" title="Rows on the schema, checkbox mode" />

## API

<DocApi name="QRadioMatrixRenderer" />

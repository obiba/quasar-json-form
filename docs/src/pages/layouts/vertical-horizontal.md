---
title: Vertical and horizontal layouts
---

# Vertical and horizontal layouts

<p class="doc-lead"><code>VerticalLayout</code> stacks its elements, <code>HorizontalLayout</code> puts them side by side with equal widths.</p>

Layouts nest freely. Without a UI schema, `QJsonForm` generates a `VerticalLayout` with one
control per property of the schema.

<DocExample name="layouts/nested" title="Nested layouts" source />

## Grid classes

The elements are rendered as direct children of the layout root, so `options.class` can carry
Quasar [grid classes](https://quasar.dev/layout/grid/row): `row q-col-gutter-md` on the layout,
`col-*` on its children. When `row`, `column` or `flex` is present in the class, the default flex
stacking of the layout is not applied. This is the equivalent of the Bootstrap `row` / `col-md-6`
markup of angular-schema-form.

<DocExample name="layouts/grid" title="Responsive grid" />

## Rules

A layout accepts `rules.visible` and `rules.enabled` [filtrex rules](/#/start/rules), applied to
every element it contains. The data of hidden controls is cleared.

<DocExample name="layouts/rules" title="Hidden layout" />

## API

<DocApi name="QLayoutRenderer" />

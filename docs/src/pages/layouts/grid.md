---
title: Grid
---

# Grid

<p class="doc-lead"><code>GridLayout</code> places its elements on a <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout" target="_blank">CSS grid</a>: the layout declares the columns, rows and areas, each element declares where it goes.</p>

The `options` of the layout map onto the `grid-template-*` properties of the container:
`columns` is a number of equal columns or a track list, `rows` likewise, `areas` names the cells,
`gap` sets the gutters. The `options.grid` of an element maps onto its placement: `column` and
`row` accept a line (`2`), a range (`"1 / 3"`, `"1 / -1"` for the full width) or a span
(`"span 2"`), `colSpan` and `rowSpan` are shorthands for spans, `area` places the element in a
named area.

<DocExample name="layouts/css-grid" title="Columns and spans" source />

Every element is wrapped in a `.q-grid-layout__cell` carrying its placement, so any renderer,
including a custom one, can be placed. The cell of an element hidden by a
[rule](#/start/rules) is removed from the flow.

## Breakpoints

`columns`, `rows`, `areas`, the gaps and every placement value also accept a
[Quasar breakpoint](https://quasar.dev/style/breakpoints) map, resolved against the screen width
like the `col-md-*` classes: the value of the largest breakpoint not wider than the screen
applies, and none below the smallest one. Fluid grids need no breakpoints at all:
`"columns": "repeat(auto-fit, minmax(240px, 1fr))"`.

<DocExample name="layouts/css-grid-areas" title="Responsive areas" source />

## Flex grid

The Quasar `row` / `col-*` classes remain available on the
[vertical and horizontal layouts](#/layouts/vertical-horizontal) for a
flexbox grid, the equivalent of the Bootstrap markup of angular-schema-form.

## API

<DocApi name="QGridLayout" />

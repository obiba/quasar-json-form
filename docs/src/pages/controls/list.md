---
title: List
---

# List

<p class="doc-lead">An array of objects or of primitives renders a list with add, remove and reorder buttons.</p>

By default an object item renders one control per property, and a primitive item is the control
itself. A new item gets the default value of the item schema. Read-only, the buttons are hidden.
The list uses the `add-item`, `confirm-remove-item`, `cancel` and `remove` i18n keys of the
application.

<DocExample name="list/objects" title="Objects" source />

## Item layout and options

`options.items` is the UI schema of one item, with `Control` scopes relative to the item schema
(`#` for the item itself). `minItems` / `maxItems` from the schema (or the filtrex `min` / `max`
rules) disable the remove and add buttons.

<DocExample name="list/item-layout" title="Horizontal items, confirmation, no reordering" />

## Primitives

Arrays of strings, numbers, booleans, or of formatted objects such as localized strings, render the
item itself. Enum arrays with `uniqueItems` render a [selection](/#/controls/select) instead.

<DocExample name="list/primitives" title="Strings and localized strings" />

## API

<DocApi name="QListRenderer" />

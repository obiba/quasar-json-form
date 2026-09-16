---
title: Radio and checkbox
---

# Radio and checkbox

<p class="doc-lead">The <code>radio</code>, <code>checkbox</code> and <code>toggle</code> format options render the values of a <a href="/#/controls/select">selection</a> as a <a href="https://quasar.dev/vue-components/option-group">QOptionGroup</a>.</p>

`options.format: "radio"` on a single selection (`enum` or `oneOf`) renders radio buttons.

<DocExample name="options/radio" title="Radio buttons" source />

## Checkboxes and toggles

On a multiple selection (array with `uniqueItems`), `options.format: "checkbox"` or `"toggle"`
renders one checkbox or toggle per value. The data is always an array, empty when nothing is
checked.

<DocExample name="options/checkbox" title="Checkboxes and toggles" />

## API

<DocApi name="QOptionsRenderer" />

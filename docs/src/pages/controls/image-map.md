---
title: Image map
---

# Image map

<p class="doc-lead">The <code>image-map</code> format renders the values of a <a href="#/controls/select">selection</a> as clickable areas of one image: click an area to select its value.</p>

The image is the `options.image` of the control: an http(s) or relative URL or a data URI, in JPEG,
PNG or WebP, or `{ src, width, height }` when its natural size is known up front. Each value needs
an area, given as the `area` key of its `oneOf` entry, or in the `options.areas` map (required for
a plain `enum`, and winning over the entries). An area follows the HTML `<area>` convention:
`{ shape, coords }` with `rect` (`x1, y1, x2, y2`), `circle` (`cx, cy, r`) or `poly`
(`x1, y1, x2, y2, ...`), the coords in the pixels of the image, as an array or a comma separated
string. A value without a valid area is only available in the list.

The areas are drawn as an SVG overlay that scales with the image, so it can be constrained with
`options.maxWidth` and still fit its container. The `title` of the entry is the tooltip and the
accessible name of the area. An image that cannot be loaded shows a placeholder icon.

## Single choice

`options.format: "image-map"` on a string with `enum` or `oneOf` selects one value. A hovered area
is tinted, a selected one is filled and outlined in the `color` option (`primary` by default). A
second click clears an optional choice.

A [select](#/controls/select) under the image shows the same value: choosing an entry in the list
highlights its area, and clicking an area updates the list. `options.select: false` hides it, the
error and the hint are then displayed under the image. `options.outline: true` outlines all the
areas, to show where they are.

<DocExample name="image-map/single" title="One area" source />

## Multiple choices

On an array with `uniqueItems` and `enum` or `oneOf` items, the data is an array of the selected
values, empty when nothing is selected, in the order of the entries. Once `maxItems` values are
selected, the other areas are disabled. The list shows the values as chips.

<DocExample name="image-map/multiple" title="Several areas" />

## API

<DocApi name="QImageMapRenderer" />

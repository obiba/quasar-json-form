---
title: Images
---

# Images

<p class="doc-lead">The <code>images</code> format renders the values of a <a href="#/controls/select">selection</a> as images laid out on a grid: click one to select it.</p>

Each value needs an image, given as the `image` key of its `oneOf` entry, or in the `options.images`
map of the control (required for a plain `enum`, and winning over the entries). An image is an
http(s) or relative URL, or a data URI, in JPEG, PNG or WebP. The `title` of the entry is the caption
and the alternative text, translated with `t()`. An image that cannot be loaded, or a data URI of
another type, shows a placeholder icon.

## Single choice

`options.format: "images"` on a string with `enum` or `oneOf` selects one value. A selected image is
outlined and badged in the `color` option (`primary` by default). A second click clears an optional
choice.

<DocExample name="images/single" title="One image" source />

## Multiple choices

On an array with `uniqueItems` and `enum` or `oneOf` items, the data is an array of the selected
values, empty when nothing is selected, in the order of the entries. Once `maxItems` values are
selected, the other images are disabled.

With `options.ordering: true` the array keeps the click order instead: the badge shows the rank and
buttons under the caption move an image before or after the other selected ones.

<DocExample name="images/multiple" title="Several images, ranked images" />

## Grid

The images fill a CSS grid, as many columns as fit `options.minWidth` (120px) by default.
`options.columns` and `gap` take the values of a [grid layout](#/layouts/grid): a number of
columns, a track list, or a Quasar breakpoint map (`{ xs: 2, md: 4 }`). An entry (or an
`options.images` entry) can carry a `grid` placement (`column`, `row`, `colSpan`, `rowSpan`,
`area`) to span cells or be placed explicitly. `captions: false` hides the captions, `ratio` and
`fit` shape the images.

<DocExample name="images/grid" title="Spanning and placing images" />

## API

<DocApi name="QImagesRenderer" />

import type { RendererApi } from './types'

export default {
  name: 'QImagesRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "string", "enum": [...] } + format: "images"',
      rank: 7,
      desc: 'One image per `enum` value, the images come from `options.images`.',
    },
    {
      schema: '{ "oneOf": [{ "const", "title", "image" }] } + format: "images"',
      rank: 7,
      desc: 'One image per `oneOf` entry, its `image` key is the URL (`rules.visible` on an entry hides it).',
    },
    {
      schema: '{ "type": "array", "uniqueItems": true, "items": { "enum" | "oneOf" } } + format: "images"',
      rank: 7,
      desc: 'Multiple choices, the data is an array.',
    },
  ],
  options: {
    format: {
      type: 'String',
      desc: '`images`, also accepted as the schema `format`.',
    },
    images: {
      type: 'Object',
      desc: 'Image of each value, keyed by value: a URL, or `{ src, grid, title }`. Wins over the `image` / `grid` / `title` of the `oneOf` entry. JPEG, PNG and WebP, as an http(s) or relative URL or a data URI.',
    },
    columns: {
      type: 'Number | String | Object',
      desc: '`grid-template-columns`: a number of equal columns, a track list, or a breakpoint map (`{ xs: 2, md: 4 }`). By default as many columns of `minWidth` as fit (`repeat(auto-fill, minmax(minWidth, 1fr))`).',
    },
    minWidth: {
      type: 'Number | String',
      default: '120px',
      desc: 'Minimum width of a column when `columns` is not set.',
    },
    gap: {
      type: 'Number | String | Object',
      default: '10',
      desc: 'Row and column gap, in px when a number; `rowGap` / `columnGap` win over it.',
    },
    grid: {
      type: 'Object',
      desc: 'On a `oneOf` entry or an `images` entry: the placement of its cell, `column` / `row` (`2`, `"1 / 3"`, `"span 2"`), `colSpan` / `rowSpan`, `area`, as an element of a [grid layout](#/layouts/grid).',
    },
    ratio: {
      type: 'Number | String',
      default: '1',
      desc: 'Aspect ratio of the images (`QImg` `ratio`), `16/9`, `4/3`...',
    },
    fit: {
      type: 'String',
      default: 'cover',
      desc: '`object-fit` of the images: `cover`, `contain`, `fill`, `scale-down`, `none`.',
    },
    loading: {
      type: 'String',
      default: 'lazy',
      desc: '`loading` attribute of the images: `lazy` or `eager`.',
    },
    captions: {
      type: 'Boolean',
      default: 'true',
      desc: 'Show the caption (the entry `title`, or the value) under each image.',
    },
    color: {
      type: 'String',
      default: 'primary',
      desc: 'Quasar color of the outline, badge and move buttons of a selected image.',
    },
    ordering: {
      type: 'Boolean',
      default: 'false',
      desc: 'Multiple choices: keep the click order, show the rank in the badge and the move buttons under the caption. Otherwise the array follows the order of the entries.',
    },
  },
  validation: {
    required: {
      message: 'error.required',
      desc: 'A required single choice with no value (AJV).',
    },
    minItems: {
      message: 'error.minItems',
      desc: 'Lower bound of a multiple choice (AJV).',
    },
    maxItems: {
      message: 'error.maxItems',
      desc: 'Upper bound of a multiple choice (AJV); the renderer also disables the other images once it is reached.',
    },
  },
  data: {
    desc: 'The selected value, or an array of values for a multiple choice (an empty array when nothing is selected). A second click clears an optional single choice; once `maxItems` values (or the filtrex `max` rule, which wins) are selected, the other images are disabled. Read-only, the selection is displayed but ignores clicks; a hidden control (`rules.visible`) loses its value, a value that is no longer an entry is cleared. The tiles are focusable, Space or Enter toggles them.',
    example: '{ "landscape": "forest", "places": ["forest", "lake"] }',
  },
  items: [
    {
      name: 'images',
      label: 'Images',
      icon: 'image',
      schema: {
        type: 'string',
        oneOf: [
          {
            const: 'a',
            title: 'A',
            image: '',
          },
          {
            const: 'b',
            title: 'B',
            image: '',
          },
        ],
      },
      uischema: {
        type: 'Control',
        options: {
          format: 'images',
        },
      },
    },
  ],
} satisfies RendererApi

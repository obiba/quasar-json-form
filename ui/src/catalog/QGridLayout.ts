import type { RendererApi } from './types'

export default {
  name: 'QGridLayout',
  kind: 'layout',
  triggers: [
    {
      schema: '{ "type": "GridLayout", "options": { "columns": 3 }, "elements": [...] }',
      rank: 2,
      desc: 'A CSS grid container: `options` declare the grid, `options.grid` of each element its placement.',
    },
  ],
  element: {
    elements: {
      type: 'Array',
      desc: 'The child elements (layouts, groups, labels, controls), each wrapped in a `.q-grid-layout__cell` carrying its placement.',
    },
    rules: {
      type: 'Object',
      desc: '`visible` and `enabled` rules apply to the whole layout.',
    },
  },
  options: {
    columns: {
      type: 'Number | String',
      desc: '`grid-template-columns`: a number of equal columns (`repeat(n, minmax(0, 1fr))`) or a track list (`200px 1fr`, `repeat(auto-fit, minmax(240px, 1fr))`).',
    },
    rows: {
      type: 'Number | String',
      desc: '`grid-template-rows`, same values as `columns`.',
    },
    areas: {
      type: 'Array | String',
      desc: '`grid-template-areas`: one string per row (`["title title", "year month"]`), `.` for an empty cell.',
    },
    gap: {
      type: 'Number | String',
      desc: 'Row and column gap, in px when a number. Defaults to the 10px row / 20px column gaps of the flex layouts.',
    },
    rowGap: {
      type: 'Number | String',
      desc: '`row-gap`, wins over `gap`.',
    },
    columnGap: {
      type: 'Number | String',
      desc: '`column-gap`, wins over `gap`.',
    },
    autoFlow: {
      type: 'String',
      desc: '`grid-auto-flow`: `row`, `column`, `dense`, `row dense`...',
    },
    align: {
      type: 'String',
      desc: '`align-items` of the cells: `stretch` (default), `start`, `center`, `end`.',
    },
    justify: {
      type: 'String',
      desc: '`justify-items` of the cells.',
    },
    class: {
      type: 'String',
      desc: 'CSS classes of the root element.',
    },
    grid: {
      type: 'Object',
      desc: 'On each **element** of the layout: its placement. `column` / `row` (`2`, `"1 / 3"`, `"span 2"`), `colSpan` / `rowSpan` (numbers), `area` (name from `areas`), `align` / `justify` (`align-self` / `justify-self`).',
    },
  },
  items: [
    {
      name: 'grid',
      label: 'Grid',
      icon: 'grid_view',
      uischema: {
        type: 'GridLayout',
        options: {
          columns: 2,
        },
        elements: [],
      },
    },
  ],
} satisfies RendererApi

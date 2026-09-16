import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string', title: 'Title' },
      year: { type: 'integer', title: 'Year' },
      month: { type: 'integer', title: 'Month' },
      day: { type: 'integer', title: 'Day' },
      abstract: { type: 'string', title: 'Abstract' },
      keywords: { type: 'string', title: 'Keywords' },
    },
  },
  uischema: {
    type: 'GridLayout',
    options: { columns: 6, gap: 12 },
    elements: [
      { type: 'Control', scope: '#/properties/title', options: { grid: { colSpan: 6 } } },
      { type: 'Control', scope: '#/properties/year', options: { grid: { colSpan: 2 } } },
      { type: 'Control', scope: '#/properties/month', options: { grid: { colSpan: 2 } } },
      { type: 'Control', scope: '#/properties/day', options: { grid: { colSpan: 2 } } },
      { type: 'Control', scope: '#/properties/abstract', options: { grid: { column: '1 / 5', row: 'span 2' }, type: 'textarea', rows: 5 } },
      { type: 'Control', scope: '#/properties/keywords', options: { grid: { column: '5 / -1' } } },
    ],
  },
} satisfies DocExampleDef

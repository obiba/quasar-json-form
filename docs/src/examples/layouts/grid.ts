import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      title: { type: 'string', title: 'Title' },
      year: { type: 'integer', title: 'Year' },
      month: { type: 'integer', title: 'Month' },
      abstract: { type: 'string', title: 'Abstract' },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    options: { class: 'row q-col-gutter-md' },
    elements: [
      { type: 'Control', scope: '#/properties/title', options: { class: 'col-12 col-md-6' } },
      { type: 'Control', scope: '#/properties/year', options: { class: 'col-6 col-md-3' } },
      { type: 'Control', scope: '#/properties/month', options: { class: 'col-6 col-md-3' } },
      { type: 'Control', scope: '#/properties/abstract', options: { class: 'col-12', rows: 3 } },
    ],
  },
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      abstract: {
        type: 'string',
        title: 'examples.contact.abstract',
        description: 'examples.contact.abstract_hint',
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/abstract', options: { rows: 4, wordLimit: '10:50' } },
    ],
  },
  data: { abstract: 'Too short.' },
} satisfies DocExampleDef

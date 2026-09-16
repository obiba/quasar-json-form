import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      email: { type: 'string', title: 'Email', format: 'email' },
      notes: { type: 'string', title: 'Notes' },
    },
  },
  uischema: {
    type: 'TabsLayout',
    labels: ['Contact', 'Notes'],
    elements: [
      {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/name' },
          { type: 'Control', scope: '#/properties/email' },
        ],
      },
      { type: 'Control', scope: '#/properties/notes', options: { rows: 3 } },
    ],
  },
} satisfies DocExampleDef

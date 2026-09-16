import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      firstName: { type: 'string', title: 'First name' },
      lastName: { type: 'string', title: 'Last name' },
      email: { type: 'string', title: 'Email', format: 'email' },
      phone: { type: 'string', title: 'Phone', format: 'tel' },
      notes: { type: 'string', title: 'Notes' },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'HorizontalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/firstName' },
          { type: 'Control', scope: '#/properties/lastName' },
        ],
      },
      {
        type: 'HorizontalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/email' },
          { type: 'Control', scope: '#/properties/phone' },
        ],
      },
      { type: 'Control', scope: '#/properties/notes', options: { rows: 2 } },
    ],
  },
} satisfies DocExampleDef

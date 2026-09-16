import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'examples.contact.name' },
      email: { type: 'string', title: 'examples.contact.email', format: 'email' },
      comment: { type: 'string', title: 'examples.contact.comment' },
    },
    required: ['name'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'HorizontalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/name', options: { outlined: true } },
          { type: 'Control', scope: '#/properties/email', options: { outlined: true } },
        ],
      },
      { type: 'Control', scope: '#/properties/comment', options: { outlined: true, rows: 3 } },
    ],
  },
  data: { name: 'Ada' },
} satisfies DocExampleDef

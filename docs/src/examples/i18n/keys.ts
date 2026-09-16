import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'examples.contact.name', description: 'examples.contact.name_hint' },
      email: { type: 'string', title: 'examples.contact.email', format: 'email' },
      comment: { type: 'string', title: 'examples.contact.comment', description: 'examples.contact.comment_hint' },
    },
    required: ['name', 'email'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'HorizontalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/name' },
          { type: 'Control', scope: '#/properties/email' },
        ],
      },
      { type: 'Control', scope: '#/properties/comment', options: { rows: 2 } },
    ],
  },
  data: { name: 'Ada' },
} satisfies DocExampleDef

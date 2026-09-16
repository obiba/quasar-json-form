import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      comment: {
        type: 'string',
        title: 'examples.contact.comment',
        description: 'examples.contact.comment_hint',
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/comment', options: { rows: 4, outlined: true } },
    ],
  },
} satisfies DocExampleDef

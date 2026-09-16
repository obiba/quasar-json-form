import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      comments: {
        type: 'array',
        title: 'Comments',
        description: 'One control per property of an item, by default',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            message: { type: 'string', maxLength: 50 },
            kind: { type: 'string', enum: ['note', 'question'] },
          },
          required: ['message'],
        },
      },
    },
  },
  data: { comments: [{ date: '2024-01-01', message: 'Hello World', kind: 'note' }] },
} satisfies DocExampleDef

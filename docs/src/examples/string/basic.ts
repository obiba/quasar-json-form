import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: 'examples.contact.name',
        description: 'examples.contact.name_hint',
        minLength: 2,
        maxLength: 50,
      },
    },
    required: ['name'],
  },
  data: { name: 'Ada Lovelace' },
} satisfies DocExampleDef

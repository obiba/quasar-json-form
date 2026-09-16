import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'examples.contact.name', minLength: 2 },
      email: { type: 'string', title: 'examples.contact.email', format: 'email' },
      age: { type: 'integer', minimum: 0, maximum: 130 },
      subscribed: { type: 'boolean' },
      role: { type: 'string', enum: ['user', 'editor', 'admin'] },
    },
    required: ['name', 'email'],
  },
  data: { name: 'Ada', email: 'ada@example.org', subscribed: true },
} satisfies DocExampleDef

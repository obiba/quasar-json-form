import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      username: { type: 'string', title: 'Username', minLength: 3, maxLength: 12, pattern: '^[a-z0-9_]+$', description: 'Lowercase letters, digits and underscores' },
      email: { type: 'string', title: 'Email', format: 'email' },
      age: { type: 'integer', title: 'Age', minimum: 18, exclusiveMaximum: 100 },
      website: { type: 'string', title: 'Website', format: 'uri' },
    },
    required: ['username', 'email'],
  },
  data: { username: 'Ada Lovelace', email: 'ada@', age: 12, website: 'not a url' },
} satisfies DocExampleDef

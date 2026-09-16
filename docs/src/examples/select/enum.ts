import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      role: { type: 'string', title: 'Role', enum: ['user', 'editor', 'admin'] },
      priority: { type: 'integer', title: 'Priority', description: 'oneOf with titles', oneOf: [
        { const: 1, title: 'Low' },
        { const: 2, title: 'Normal' },
        { const: 3, title: 'High' },
      ] },
    },
    required: ['role'],
  },
  data: { role: 'editor', priority: 2 },
} satisfies DocExampleDef

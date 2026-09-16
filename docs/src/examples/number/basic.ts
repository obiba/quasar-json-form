import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      age: { type: 'integer', title: 'Age', minimum: 0, maximum: 130 },
      height: { type: 'number', title: 'Height', description: 'In meters', minimum: 0.5, maximum: 2.5 },
    },
    required: ['age'],
  },
  data: { age: 42, height: 1.75 },
} satisfies DocExampleDef

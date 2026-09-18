import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      code: { type: 'string', title: 'Code', pattern: '^[A-Z]{3}$', description: 'Three uppercase letters, checked by the schema' },
      even: { type: 'integer', title: 'Even number', rules: { validation: [{ expr: 'even % 2 == 0', message: 'Must be even (rule, always evaluated)' }] } },
    },
    required: ['code'],
  },
  data: { code: 'abc', even: 3 },
  validationMode: 'NoValidation',
} satisfies DocExampleDef

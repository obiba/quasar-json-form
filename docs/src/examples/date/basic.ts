import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      birthDate: { type: 'string', format: 'date', title: 'Birth date', description: 'ISO date, validated by AJV' },
      period: { type: 'string', format: 'year-month', title: 'Period' },
    },
    required: ['birthDate'],
  },
  data: { birthDate: '1990-05-17', period: '2024-03' },
} satisfies DocExampleDef

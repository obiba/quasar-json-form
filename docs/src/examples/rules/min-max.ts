import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      maxGuests: { type: 'integer', title: 'Maximum number of guests', minimum: 0, maximum: 5 },
      guests: {
        type: 'array',
        title: 'Guests',
        description: 'The add button follows the maximum above',
        items: { type: 'string' },
        rules: { max: 'maxGuests' },
      },
    },
  },
  data: { maxGuests: 2, guests: ['Ada'] },
} satisfies DocExampleDef

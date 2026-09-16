import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      subscribed: { type: 'boolean', title: 'Subscribe to the newsletter', description: 'One email per month, no spam', label: 'I do subscribe'  },
      // a toggle that must be on: `const: true` would select the enum (select) renderer
      terms: { type: 'boolean', title: 'I accept the terms', allOf: [{ const: true }] },
    },
    required: ['terms'],
  },
  data: { subscribed: true },
} satisfies DocExampleDef

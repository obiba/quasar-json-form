import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      price: { type: 'number', title: 'Price', multipleOf: 0.01 },
      quantity: { type: 'integer', title: 'Quantity', minimum: 1 },
    },
  },
  uischema: {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/price', options: { outlined: true, prefix: '$', step: 0.01 } },
      { type: 'Control', scope: '#/properties/quantity', options: { outlined: true, suffix: 'units', step: 1, min: 1 } },
    ],
  },
  data: { price: 9.99, quantity: 3 },
} satisfies DocExampleDef

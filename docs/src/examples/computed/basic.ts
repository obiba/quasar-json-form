import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      quantity: { type: 'integer', title: 'Quantity', minimum: 0 },
      price: { type: 'number', title: 'Unit price' },
      total: {
        type: 'number',
        format: 'computed',
        title: 'Total',
        description: 'Computed with `quantity * price`, stored in the data',
        rules: { compute: 'quantity * price' },
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'HorizontalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/quantity' },
          { type: 'Control', scope: '#/properties/price' },
        ],
      },
      { type: 'Control', scope: '#/properties/total', options: { show: true } },
    ],
  },
  data: { quantity: 3, price: 9.99 },
} satisfies DocExampleDef

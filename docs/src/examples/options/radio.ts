import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      size: { type: 'string', title: 'Size', enum: ['S', 'M', 'L', 'XL'] },
      shipping: {
        type: 'string',
        title: 'Shipping',
        description: 'oneOf with titles',
        oneOf: [
          { const: 'std', title: 'Standard (5 days)' },
          { const: 'exp', title: 'Express (2 days)' },
        ],
      },
    },
    required: ['size'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/size', options: { format: 'radio', inline: true } },
      { type: 'Control', scope: '#/properties/shipping', options: { format: 'radio' } },
    ],
  },
  data: { size: 'M' },
} satisfies DocExampleDef

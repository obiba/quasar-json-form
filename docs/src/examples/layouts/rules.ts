import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      hasAddress: { type: 'boolean', title: 'Provide an address' },
      street: { type: 'string', title: 'Street' },
      city: { type: 'string', title: 'City' },
      postalCode: { type: 'string', title: 'Postal code', maxLength: 5 },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/hasAddress' },
      {
        type: 'HorizontalLayout',
        rules: { visible: 'hasAddress == true' },
        elements: [
          { type: 'Control', scope: '#/properties/street' },
          { type: 'Control', scope: '#/properties/city' },
          { type: 'Control', scope: '#/properties/postalCode' },
        ],
      },
    ],
  },
  data: { hasAddress: true },
} satisfies DocExampleDef

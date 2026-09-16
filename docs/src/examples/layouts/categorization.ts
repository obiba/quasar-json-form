import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      firstName: { type: 'string', title: 'First name', minLength: 3 },
      lastName: { type: 'string', title: 'Last name', minLength: 3 },
      birthDate: { type: 'string', title: 'Birth date', format: 'date' },
      street: { type: 'string', title: 'Street' },
      city: { type: 'string', title: 'City' },
      vegan: { type: 'boolean', title: 'Vegan' },
      favoriteVegetable: { type: 'string', title: 'Favorite vegetable', enum: ['Tomato', 'Potato', 'Salad', 'Other'] },
    },
  },
  uischema: {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        label: 'Identification',
        description: 'Please provide your identification details',
        elements: [
          {
            type: 'HorizontalLayout',
            elements: [
              { type: 'Control', scope: '#/properties/firstName' },
              { type: 'Control', scope: '#/properties/lastName' },
            ],
          },
          { type: 'Control', scope: '#/properties/birthDate' },
        ],
      },
      {
        type: 'Category',
        label: 'Address',
        elements: [
          { type: 'Control', scope: '#/properties/street' },
          { type: 'Control', scope: '#/properties/city' },
        ],
      },
      {
        type: 'Category',
        label: 'Diet',
        elements: [
          { type: 'Control', scope: '#/properties/vegan' },
          { type: 'Control', scope: '#/properties/favoriteVegetable', rules: { visible: 'vegan == true' } },
        ],
      },
    ],
  },
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      email: { type: 'string', title: 'Email', format: 'email' },
      plan: { type: 'string', title: 'Plan', enum: ['free', 'team', 'enterprise'] },
      agree: { type: 'boolean', title: 'I agree to the terms' },
    },
    required: ['name', 'email'],
  },
  uischema: {
    type: 'StepperLayout',
    labels: ['Account', 'Plan', 'Confirm'],
    icons: ['person', 'shopping_cart', 'check'],
    elements: [
      {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/name' },
          { type: 'Control', scope: '#/properties/email' },
        ],
      },
      { type: 'Control', scope: '#/properties/plan', options: { format: 'radio' } },
      { type: 'Control', scope: '#/properties/agree' },
    ],
  },
  data: { name: 'Ada', email: 'ada@example.org' },
} satisfies DocExampleDef

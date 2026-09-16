import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      satisfaction: { type: 'integer', title: 'Satisfaction', description: 'From 0 to 10', minimum: 0, maximum: 10 },
      budget: { type: 'integer', title: 'Budget' },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/satisfaction', options: { format: 'slider', min: 0, max: 10, markers: true, label: true } },
      { type: 'Control', scope: '#/properties/budget', hint: 'In thousands', options: { format: 'slider', min: 0, max: 100, step: 5, labelAlways: true, color: 'teal' } },
    ],
  },
  data: { satisfaction: 7, budget: 25 },
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      ages: {
        type: 'object',
        format: 'range',
        title: 'Ages',
        description: 'Youngest and oldest participant',
        properties: {
          min: { type: 'integer', minimum: 18 },
          max: { type: 'integer', maximum: 100 },
        },
      },
      hours: {
        type: 'object',
        title: 'Opening hours',
        properties: {
          min: { type: 'number' },
          max: { type: 'number' },
        },
      },
    },
    required: ['ages'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/ages', options: { min: 0, max: 100, step: 1, label: true, markers: 10 } },
      { type: 'Control', scope: '#/properties/hours', hint: 'At least two hours', options: { format: 'range', min: 0, max: 24, step: 0.5, minRange: 2, dragRange: true, labelAlways: true, color: 'teal' } },
    ],
  },
  data: { ages: { min: 25, max: 65 }, hours: { min: 9, max: 17.5 } },
} satisfies DocExampleDef

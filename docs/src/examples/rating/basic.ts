import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      stars: { type: 'integer', title: 'Overall', description: 'Rate this documentation', minimum: 1, maximum: 5 },
      hearts: { type: 'integer', title: 'Love it?' },
    },
    required: ['stars'],
  },
  uischema: {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/stars', options: { format: 'rating', max: 5, size: '2em', color: 'orange' } },
      { type: 'Control', scope: '#/properties/hearts', hint: 'Up to 3', options: { format: 'rating', max: 3, icon: 'favorite_border', iconSelected: 'favorite', color: 'red', size: '2em' } },
    ],
  },
  data: { stars: 4 },
} satisfies DocExampleDef

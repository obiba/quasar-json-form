import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      location: {
        type: 'object',
        title: 'Where are you?',
        description: 'Click the map, use your current position, or type the coordinates',
        format: 'geo',
      },
    },
    required: ['location'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/location', options: { geometries: ['point'], center: [-73.5673, 45.5017], zoom: 11 } },
    ],
  },
  data: {},
} satisfies DocExampleDef

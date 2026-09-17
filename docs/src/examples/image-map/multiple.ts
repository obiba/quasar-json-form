import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      rooms: {
        type: 'array',
        title: 'Rooms to renovate',
        description: 'Up to three',
        uniqueItems: true,
        maxItems: 3,
        items: {
          type: 'string',
          oneOf: [
            { const: 'kitchen', title: 'Kitchen', area: { shape: 'rect', coords: [20, 20, 220, 180] } },
            { const: 'living', title: 'Living room', area: { shape: 'rect', coords: [240, 20, 580, 180] } },
            { const: 'bedroom', title: 'Bedroom', area: { shape: 'rect', coords: [20, 200, 220, 380] } },
            { const: 'bathroom', title: 'Bathroom', area: { shape: 'rect', coords: [240, 200, 360, 380] } },
            { const: 'patio', title: 'Patio', area: { shape: 'poly', coords: [380, 200, 580, 200, 380, 380] } },
            { const: 'pool', title: 'Pool', area: { shape: 'circle', coords: [520, 330, 40] } },
          ],
        },
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/rooms', options: { format: 'image-map', image: 'images/floor-plan.png', maxWidth: 480, color: 'teal' } },
    ],
  },
  data: { rooms: ['kitchen', 'pool'] },
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      room: {
        type: 'string',
        title: 'Where did it happen?',
        description: 'Click a room on the plan, or pick it in the list',
        oneOf: [
          { const: 'kitchen', title: 'Kitchen', area: { shape: 'rect', coords: [20, 20, 220, 180] } },
          { const: 'living', title: 'Living room', area: { shape: 'rect', coords: [240, 20, 580, 180] } },
          { const: 'bedroom', title: 'Bedroom', area: { shape: 'rect', coords: [20, 200, 220, 380] } },
          { const: 'bathroom', title: 'Bathroom', area: { shape: 'rect', coords: [240, 200, 360, 380] } },
          { const: 'patio', title: 'Patio', area: { shape: 'poly', coords: [380, 200, 580, 200, 380, 380] } },
          { const: 'pool', title: 'Pool', area: { shape: 'circle', coords: [520, 330, 40] } },
        ],
      },
      floor: {
        type: 'string',
        title: 'Which side?',
        enum: ['left', 'right'],
      },
    },
    required: ['room'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/room', options: { format: 'image-map', image: 'images/floor-plan.png', maxWidth: 480 } },
      {
        type: 'Control',
        scope: '#/properties/floor',
        options: {
          format: 'image-map',
          image: { src: 'images/floor-plan.png', width: 600, height: 400 },
          maxWidth: 480,
          color: 'deep-orange',
          outline: true,
          select: false,
          areas: {
            left: { shape: 'rect', coords: '0, 0, 230, 400' },
            right: { shape: 'rect', coords: '230, 0, 600, 400' },
          },
        },
        hint: 'No list, outlined areas, a second click clears the choice',
      },
    ],
  },
  data: { room: 'kitchen' },
} satisfies DocExampleDef

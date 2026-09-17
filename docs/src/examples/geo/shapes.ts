import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      area: {
        type: 'object',
        title: 'Study area',
        description: 'Draw the area as a polygon, or a route as a line: click the map to add a point, double click to finish',
        properties: {
          type: { type: 'string', enum: ['LineString', 'Polygon'] },
          coordinates: { type: 'array' },
        },
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/area', options: { format: 'geo', color: 'deep-orange', height: 360, minPoints: 3 }, hint: 'Drag a vertex to move it, draw again to replace' },
    ],
  },
  data: {
    area: { type: 'Polygon', coordinates: [[[-73.58, 45.49], [-73.55, 45.49], [-73.55, 45.51], [-73.58, 45.51], [-73.58, 45.49]]] },
  },
} satisfies DocExampleDef

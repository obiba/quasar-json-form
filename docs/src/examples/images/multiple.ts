import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      places: {
        type: 'array',
        title: 'Places to visit',
        description: 'Up to three',
        uniqueItems: true,
        maxItems: 3,
        items: {
          type: 'string',
          oneOf: [
            { const: 'sunset', title: 'Beach', image: 'images/sunset.webp' },
            { const: 'mountains', title: 'Mountains', image: 'images/mountains.jpg' },
            { const: 'forest', title: 'Forest', image: 'images/forest.png' },
            { const: 'desert', title: 'Desert', image: 'images/desert.webp' },
            { const: 'city', title: 'City', image: 'images/city.jpg' },
            { const: 'lake', title: 'Lake', image: 'images/lake.png' },
          ],
        },
      },
      ranked: {
        type: 'array',
        title: 'Ranked preferences',
        description: 'The first click is the first choice',
        uniqueItems: true,
        items: {
          type: 'string',
          oneOf: [
            { const: 'sunset', title: 'Beach', image: 'images/sunset.webp' },
            { const: 'mountains', title: 'Mountains', image: 'images/mountains.jpg' },
            { const: 'forest', title: 'Forest', image: 'images/forest.png' },
            { const: 'city', title: 'City', image: 'images/city.jpg' },
          ],
        },
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/places', options: { format: 'images', columns: { xs: 3, sm: 6 } } },
      { type: 'Control', scope: '#/properties/ranked', options: { format: 'images', ordering: true, columns: 4, color: 'deep-orange' } },
    ],
  },
  data: { places: ['forest', 'lake'], ranked: ['city', 'sunset'] },
} satisfies DocExampleDef

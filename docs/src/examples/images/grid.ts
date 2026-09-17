import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      cover: {
        type: 'string',
        title: 'Cover picture',
        oneOf: [
          { const: 'city', title: 'City', image: 'images/city.jpg', grid: { colSpan: 2, rowSpan: 2 } },
          { const: 'sunset', title: 'Sunset', image: 'images/sunset.webp' },
          { const: 'mountains', title: 'Mountains', image: 'images/mountains.jpg' },
          { const: 'forest', title: 'Forest', image: 'images/forest.png' },
          { const: 'desert', title: 'Desert', image: 'images/desert.webp' },
        ],
      },
      logo: {
        type: 'string',
        title: 'Logo',
        enum: ['lake', 'forest', 'desert'],
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/cover', options: { format: 'images', columns: 4, gap: 6, captions: false, ratio: 1 } },
      {
        type: 'Control',
        scope: '#/properties/logo',
        options: {
          format: 'images',
          columns: '160px 80px 80px',
          fit: 'contain',
          images: {
            lake: { src: 'images/lake.png', grid: { row: '1 / 3' } },
            forest: { src: 'images/forest.png', grid: { column: 2, row: 1 } },
            desert: { src: 'images/desert.webp', grid: { column: 3, row: 1 } },
          },
        },
      },
    ],
  },
  data: { cover: 'city' },
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      landscape: {
        type: 'string',
        title: 'Favorite landscape',
        description: 'Pick one',
        oneOf: [
          { const: 'sunset', title: 'Sunset', image: 'images/sunset.webp' },
          { const: 'mountains', title: 'Mountains', image: 'images/mountains.jpg' },
          { const: 'forest', title: 'Forest', image: 'images/forest.png' },
          { const: 'desert', title: 'Desert', image: 'images/desert.webp' },
        ],
      },
      size: {
        type: 'string',
        title: 'Format',
        enum: ['small', 'large'],
      },
    },
    required: ['landscape'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/landscape', options: { format: 'images', color: 'teal' }, hint: 'Click again to clear an optional choice' },
      {
        type: 'Control',
        scope: '#/properties/size',
        options: {
          format: 'images',
          columns: 4,
          images: {
            small: { src: 'images/lake.png', title: 'Small' },
            large: { src: 'images/city.jpg', title: 'Large' },
          },
        },
      },
    ],
  },
  data: { landscape: 'forest' },
} satisfies DocExampleDef

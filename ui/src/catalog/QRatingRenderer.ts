import type { RendererApi } from './types'

export default {
  name: 'QRatingRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "integer" } + options.format: "rating"',
      rank: 3,
      desc: 'An integer property with the `rating` format option.',
    },
  ],
  options: {
    max: {
      type: 'Number',
      default: 'schema maximum, else 5',
      desc: 'Number of icons.',
    },
    icon: {
      type: 'String',
      desc: 'Icon name (Quasar icon set).',
    },
    color: {
      type: 'String',
      desc: 'Quasar color of the icons.',
    },
    size: {
      type: 'String',
      desc: 'Size of the icons, a CSS unit (`2em`) or a Quasar size (`md`).',
    },
    '…': {
      type: 'any',
      desc: 'Every option is passed as a prop to [QRating](https://quasar.dev/vue-components/rating#qrating-api): `max`, `icon`, `iconSelected`, `iconHalf`, `color`, `size`, `noReset`, `noDimming`...',
    },
  },
  data: {
    desc: 'An integer; no value displays no selected icon.',
    example: '{ "stars": 4 }',
  },
  items: [
    {
      name: 'rating',
      label: 'Rating',
      icon: 'star',
      schema: {
        type: 'integer',
        minimum: 0,
        maximum: 5,
      },
      uischema: {
        type: 'Control',
        options: {
          format: 'rating',
        },
      },
    },
  ],
} satisfies RendererApi

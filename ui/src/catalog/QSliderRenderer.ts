import type { RendererApi } from './types'

export default {
  name: 'QSliderRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "integer" } + options.format: "slider"',
      rank: 3,
      desc: 'An integer property with the `slider` format option.',
    },
  ],
  options: {
    '…': {
      type: 'any',
      desc: 'Every option is passed as a prop to [QSlider](https://quasar.dev/vue-components/slider#qslider-api): `min`, `max`, `step`, `label`, `labelAlways`, `markers`, `markerLabels`, `snap`, `color`, `dense`...',
    },
  },
  data: {
    desc: 'A number.',
    example: '{ "satisfaction": 7 }',
  },
  items: [
    {
      name: 'slider',
      label: 'Slider',
      icon: 'linear_scale',
      schema: {
        type: 'integer',
        minimum: 0,
        maximum: 10,
      },
      uischema: {
        type: 'Control',
        options: {
          format: 'slider',
        },
      },
    },
  ],
} satisfies RendererApi

import type { RendererApi } from './types'

export default {
  name: 'QNumberRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "number" }',
      rank: 3,
      desc: 'Any number property.',
    },
    {
      schema: '{ "type": "integer" }',
      rank: 3,
      desc: 'Any integer property without `options.format` `slider` or `rating`.',
    },
  ],
  options: {
    '…': {
      type: 'any',
      desc: 'Every option is passed as a prop or attribute to [QInput](https://quasar.dev/vue-components/input#qinput-api) (`type` is forced to `number`): `outlined`, `dense`, `prefix`, `suffix`, and the native `step`, `min`, `max` attributes.',
    },
  },
  data: {
    desc: 'A JavaScript number (`Number(value)` of the input). An emptied input stores `undefined`, so that `required` applies. The schema keywords `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum` and `multipleOf` are validated by AJV, as well as `type: integer`.',
    example: '{ "age": 42, "price": 9.99 }',
  },
  items: [
    {
      name: 'number',
      label: 'Number',
      icon: 'numbers',
      schema: {
        type: 'number',
      },
      uischema: {
        type: 'Control',
      },
    },
    {
      name: 'integer',
      label: 'Integer',
      icon: 'tag',
      schema: {
        type: 'integer',
      },
      uischema: {
        type: 'Control',
      },
    },
  ],
} satisfies RendererApi

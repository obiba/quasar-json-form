import type { RendererApi } from './types'

export default {
  name: 'QOptionsRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "string", "enum": [...] } + options.format: "radio"',
      rank: 5,
      desc: 'Radio buttons, one per `enum` value.',
    },
    {
      schema: '{ "oneOf": [{ "const", "title" }] } + options.format: "radio"',
      rank: 7,
      desc: 'Radio buttons, one per `oneOf` entry (`rules.visible` on an entry hides it).',
    },
    {
      schema: '{ "type": "array", "uniqueItems": true, "items": { "enum" | "oneOf" } } + options.format: "checkbox" | "toggle"',
      rank: 7,
      desc: 'One checkbox (or toggle) per value, the data is an array.',
    },
  ],
  options: {
    format: {
      type: 'String',
      desc: '`radio` for a single selection; `checkbox` or `toggle` for a multiple selection.',
    },
    '…': {
      type: 'any',
      desc: 'Every other option is passed as a prop to [QOptionGroup](https://quasar.dev/vue-components/option-group#qoptiongroup-api): `inline`, `color`, `dense`, `leftLabel`, `size`...',
    },
  },
  data: {
    desc: 'The selected value, or an array of values for checkboxes and toggles (an empty array when nothing is checked). Read-only, the selection is displayed but ignores clicks.',
    example: '{ "size": "M", "toppings": ["cheese", "olives"] }',
  },
  items: [
    {
      name: 'radio',
      label: 'Radio buttons',
      icon: 'radio_button_checked',
      schema: {
        type: 'string',
        oneOf: [
          {
            const: 'a',
            title: 'A',
          },
          {
            const: 'b',
            title: 'B',
          },
        ],
      },
      uischema: {
        type: 'Control',
        options: {
          format: 'radio',
        },
      },
    },
    {
      name: 'checkbox',
      label: 'Checkboxes',
      icon: 'check_box',
      schema: {
        type: 'array',
        uniqueItems: true,
        items: {
          type: 'string',
          oneOf: [
            {
              const: 'a',
              title: 'A',
            },
            {
              const: 'b',
              title: 'B',
            },
          ],
        },
      },
      uischema: {
        type: 'Control',
        options: {
          format: 'checkbox',
        },
      },
    },
  ],
} satisfies RendererApi

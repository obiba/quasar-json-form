import type { RendererApi } from './types'

export default {
  name: 'QSelectRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "string", "enum": [...] }',
      rank: 4,
      desc: 'Single selection among the `enum` values; each value is translated with `t()` for its label.',
    },
    {
      schema: '{ "oneOf": [{ "const": ..., "title": ... }] }',
      rank: 6,
      desc: 'Single selection among `oneOf` entries: `const` is the value, `title` the label. An entry with `rules.visible` is listed only when its rule is true.',
    },
    {
      schema: '{ "type": "array", "uniqueItems": true, "items": { "enum" | "oneOf" } }',
      rank: 6,
      desc: 'Multiple selection, the data is an array of values.',
    },
  ],
  options: {
    '…': {
      type: 'any',
      desc: 'Every option is passed as a prop to [QSelect](https://quasar.dev/vue-components/select#qselect-api): `outlined`, `dense`, `useChips`, `optionsDense`, `behavior`, `displayValue`... `emitValue` and `mapOptions` are always set, `multiple` follows the schema type and `clearable` is set unless the control is required.',
    },
  },
  data: {
    desc: 'The selected value (`enum` value or `oneOf` `const`), or an array of values for a multiple selection. A cleared selection stores `undefined`. When the options change (a `oneOf` entry becomes hidden) a selection that is no longer listed is cleared.',
    example: '{ "role": "admin", "tags": ["a", "b"] }',
  },
  items: [
    {
      name: 'select',
      label: 'Select',
      icon: 'arrow_drop_down_circle',
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
      },
    },
    {
      name: 'multiselect',
      label: 'Multiple select',
      icon: 'playlist_add_check',
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
      },
    },
  ],
} satisfies RendererApi

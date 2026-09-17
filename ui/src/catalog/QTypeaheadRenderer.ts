import type { RendererApi } from './types'

export default {
  name: 'QTypeaheadRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "string" } + format: "typeahead" (schema or options)',
      rank: 5,
      desc: 'Text input with filtered suggestions.',
    },
  ],
  options: {
    values: {
      type: 'Array',
      desc: 'The suggestions: strings, or `{ label, value }` objects (`name` / `title` and `key` / `const` are accepted too). Defaults to the schema `examples`, then `enum`. Labels are translated with `t()`.',
    },
    editable: {
      type: 'Boolean',
      default: 'false',
      desc: 'Accept any typed text (added with Enter) instead of only the suggestions.',
    },
    '…': {
      type: 'any',
      desc: 'Every other option is passed as a prop to [QSelect](https://quasar.dev/vue-components/select#qselect-api): `outlined`, `dense`, `hideDropdownIcon`...',
    },
  },
  data: {
    desc: 'The selected (or typed, when `editable`) string; a cleared input stores `undefined`.',
    example: '{ "role": "Data manager" }',
  },
  items: [
    {
      name: 'typeahead',
      label: 'Typeahead',
      icon: 'manage_search',
      schema: {
        type: 'string',
        format: 'typeahead',
      },
      uischema: {
        type: 'Control',
        options: {
          values: [
            'A',
            'B',
          ],
        },
      },
    },
  ],
} satisfies RendererApi

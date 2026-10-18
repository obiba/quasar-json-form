import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      firstName: { type: 'string', title: 'First name' },
      colors: { type: 'array', uniqueItems: true, title: 'Favorite colors', items: { type: 'string', enum: ['blue', 'red', 'yellow'] } },
      reason: {
        type: 'string',
        title: 'Why do you like {{colors}}, {{isEmpty(firstName) ? "dear visitor" : firstName}}?',
        description: 'You selected {{length(colors)}} color(s).',
        rules: { visible: 'length(colors) > 0' },
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/firstName' },
      { type: 'Label', text: 'Hello **{{firstName}}**!', rules: { visible: 'isNotEmpty(firstName)' } },
      { type: 'Control', scope: '#/properties/colors' },
      { type: 'Control', scope: '#/properties/reason', options: { rows: 2 } },
    ],
  },
  data: { firstName: 'Ada', colors: ['blue'] },
} satisfies DocExampleDef

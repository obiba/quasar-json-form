import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      languages: {
        type: 'array',
        title: 'Programming languages',
        uniqueItems: true,
        items: { type: 'string', enum: ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go'] },
        minItems: 1,
        maxItems: 3,
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/languages', options: { outlined: true, useChips: true } },
    ],
  },
  data: { languages: ['TypeScript'] },
} satisfies DocExampleDef

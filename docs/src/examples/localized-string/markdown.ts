import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      description: { type: 'object', format: 'localizedString', title: 'Description' },
      objectives: { type: 'object', format: 'obibaSimpleMde', title: 'Objectives' },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/description', options: { rows: 3, languages: ['en', 'fr', 'de'] } },
      { type: 'Control', scope: '#/properties/objectives', options: { rows: 4 } },
    ],
  },
  data: { objectives: { en: 'Some **markdown** text\n\n- item 1\n- item 2' } },
  languages: ['en', 'fr'],
} satisfies DocExampleDef

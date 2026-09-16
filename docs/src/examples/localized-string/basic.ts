import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'object', format: 'localizedString', title: 'Name', description: 'Required in every language' },
      acronym: { type: 'object', format: 'localizedString', title: 'Acronym' },
    },
    required: ['name'],
  },
  uischema: {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/name' },
      { type: 'Control', scope: '#/properties/acronym', options: { outlined: true } },
    ],
  },
  data: { name: { en: 'My study' } },
  languages: { en: 'English', fr: 'Français' },
} satisfies DocExampleDef

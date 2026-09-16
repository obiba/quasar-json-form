import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: 'examples.contact.name',
        description: 'examples.contact.name_description',
        minLength: 2,
        maxLength: 50,
      },
    },
    required: ['name'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/name', label: 'examples.contact.name_label', hint: 'examples.contact.name_hint' },
    ],
  },
  data: { name: 'Ada Lovelace' },
} satisfies DocExampleDef

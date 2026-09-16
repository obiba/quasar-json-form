import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'examples.contact.name' },
      notes: { type: 'string', title: 'examples.contact.notes', readOnly: true },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/name',
        options: { filled: true, dense: true, clearable: true, placeholder: 'Ada Lovelace', prefix: '@', maxlength: 20, counter: true },
      },
      { type: 'Control', scope: '#/properties/notes', options: { outlined: true } },
    ],
  },
  data: { notes: 'Read-only through readOnly: true on the schema property' },
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      contacts: {
        type: 'array',
        title: 'Contacts',
        minItems: 1,
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Name' },
            email: { type: 'string', title: 'Email', format: 'email' },
            primary: { type: 'boolean', title: 'Primary' },
          },
        },
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/contacts',
        options: {
          addLabel: 'Add a contact',
          addIcon: 'person_add',
          confirmation: true,
          ordering: false,
          items: {
            type: 'HorizontalLayout',
            elements: [
              { type: 'Control', scope: '#/properties/name', options: { dense: true } },
              { type: 'Control', scope: '#/properties/email', options: { dense: true } },
              { type: 'Control', scope: '#/properties/primary' },
            ],
          },
        },
      },
    ],
  },
  data: { contacts: [{ name: 'Ada', email: 'ada@example.org', primary: true }] },
} satisfies DocExampleDef

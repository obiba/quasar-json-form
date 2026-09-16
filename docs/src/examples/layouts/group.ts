import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      email: { type: 'string', title: 'Email', format: 'email' },
      street: { type: 'string', title: 'Street' },
      city: { type: 'string', title: 'City' },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Group',
        label: 'Identity',
        description: 'Who you are, as it appears on your *ID card*',
        elements: [
          { type: 'Control', scope: '#/properties/name' },
          { type: 'Control', scope: '#/properties/email' },
        ],
      },
      {
        type: 'Group',
        label: 'Address',
        hint: 'Used for **shipping** only',
        titleClass: 'text-primary',
        options: { class: 'q-mt-md q-pa-md bg-grey-2 rounded-borders' },
        elements: [
          {
            type: 'HorizontalLayout',
            elements: [
              { type: 'Control', scope: '#/properties/street' },
              { type: 'Control', scope: '#/properties/city' },
            ],
          },
        ],
      },
    ],
  },
} satisfies DocExampleDef

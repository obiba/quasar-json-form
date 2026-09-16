import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      email: { type: 'string', title: 'examples.contact.email', format: 'email' },
      website: { type: 'string', title: 'examples.contact.website', format: 'url' },
      password: { type: 'string', title: 'examples.contact.password', format: 'password', minLength: 8 },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/email' },
      { type: 'Control', scope: '#/properties/website' },
      { type: 'Control', scope: '#/properties/password', options: { autocomplete: 'new-password' } },
    ],
  },
} satisfies DocExampleDef

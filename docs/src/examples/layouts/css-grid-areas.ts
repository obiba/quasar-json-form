import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      firstName: { type: 'string', title: 'First name' },
      lastName: { type: 'string', title: 'Last name' },
      email: { type: 'string', title: 'Email', format: 'email' },
      phone: { type: 'string', title: 'Phone', format: 'tel' },
      notes: { type: 'string', title: 'Notes' },
    },
  },
  uischema: {
    type: 'GridLayout',
    options: {
      columns: { xs: 1, sm: 2, md: 4 },
      areas: {
        xs: ['first', 'last', 'email', 'phone', 'notes'],
        sm: ['first last', 'email phone', 'notes notes'],
        md: ['first last notes notes', 'email phone notes notes'],
      },
      align: 'start',
    },
    elements: [
      { type: 'Control', scope: '#/properties/firstName', options: { grid: { area: 'first' } } },
      { type: 'Control', scope: '#/properties/lastName', options: { grid: { area: 'last' } } },
      { type: 'Control', scope: '#/properties/email', options: { grid: { area: 'email' } } },
      { type: 'Control', scope: '#/properties/phone', options: { grid: { area: 'phone' } } },
      { type: 'Control', scope: '#/properties/notes', options: { grid: { area: 'notes' }, type: 'textarea', rows: 4 } },
    ],
  },
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      meeting: { type: 'string', format: 'date-time', title: 'Meeting' },
      sampled: { type: 'string', format: 'date-fulltime', title: 'Sampled at' },
    },
  },
  uischema: {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/meeting' },
      { type: 'Control', scope: '#/properties/sampled', options: { outlined: true } },
    ],
  },
  data: { meeting: '2024-03-15 14:30' },
} satisfies DocExampleDef

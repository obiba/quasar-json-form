import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      start: { type: 'string', format: 'time', title: 'Start' },
      precise: { type: 'string', format: 'fulltime', title: 'With seconds' },
    },
  },
  uischema: {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/start' },
      { type: 'Control', scope: '#/properties/precise', options: { outlined: true } },
    ],
  },
  data: { start: '09:30', precise: '09:30:15' },
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      start: { type: 'string', format: 'datepicker', title: 'Start (dd/MM/yyyy, from 2020)' },
      end: { type: 'string', format: 'datepicker', title: 'End (after the start)' },
    },
  },
  uischema: {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/start', options: { dateFormat: 'dd/MM/yyyy', min: '2020-01-01', validationMessage: { dateMin: 'No earlier than 2020' } } },
      { type: 'Control', scope: '#/properties/end', options: { dateFormat: 'dd/MM/yyyy' }, rules: { min: 'start' } },
    ],
  },
  data: { start: '15/03/2024', end: '01/01/2024' },
} satisfies DocExampleDef

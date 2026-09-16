import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      startYear: { type: 'integer', title: 'Year', minimum: 1900, maximum: 2100 },
      startMonth: { type: 'integer', title: 'Month', minimum: 1, maximum: 12 },
      startDay: { type: 'string', format: 'ymdatepicker', title: 'Day' },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    options: { class: 'row q-col-gutter-md' },
    elements: [
      { type: 'Control', scope: '#/properties/startYear', options: { class: 'col-4' } },
      { type: 'Control', scope: '#/properties/startMonth', options: { class: 'col-4' } },
      {
        type: 'Control',
        scope: '#/properties/startDay',
        options: {
          class: 'col-4',
          dateOptions: { dateFormat: 'yyyy-MM-dd', yearRef: 'startYear', monthRef: 'startMonth', validationMessage: { invalidYMDate: 'Not in the selected month' } },
        },
      },
    ],
  },
  data: { startYear: 2024, startMonth: 2 },
} satisfies DocExampleDef

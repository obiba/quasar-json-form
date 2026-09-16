import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      frequency: {
        type: 'object',
        format: 'radio-matrix',
        title: 'Frequency (rows and columns on the schema)',
        values: { daily: 'Daily', weekly: 'Weekly', never: 'Never' },
        items: [
          { key: 'sport', name: 'Sport' },
          { key: 'reading', name: 'Reading' },
        ],
      },
      consents: { type: 'object', format: 'radio-matrix', title: 'Consents (checkbox mode)' },
    },
    required: ['consents'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/frequency' },
      {
        type: 'Control',
        scope: '#/properties/consents',
        options: {
          checkboxMode: true,
          items: [
            { key: 'data_sharing', name: 'Data sharing' },
            { key: 'recontact', name: 'Re-contact' },
          ],
          validationMessage: { allItemsSelected: 'Check at least one consent' },
        },
      },
    ],
  },
  data: { frequency: { sport: 'weekly' }, consents: {} },
} satisfies DocExampleDef

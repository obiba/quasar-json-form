import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      access: { type: 'object', format: 'radioGroupCollection', title: 'Access', description: 'Every row must be answered' },
    },
    required: ['access'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/access',
        options: {
          values: [
            { key: 'yes', caption: 'Yes' },
            { key: 'no', caption: 'No' },
            { key: 'na', caption: 'Not applicable' },
          ],
          items: [
            { key: 'access_data', name: 'Access to *data*' },
            { key: 'access_bio_samples', name: 'Access to bio samples' },
            { key: 'access_other', name: 'Access to other material' },
          ],
        },
      },
    ],
  },
  data: { access: { access_data: 'yes' } },
} satisfies DocExampleDef

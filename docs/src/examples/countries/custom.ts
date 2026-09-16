import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      country: { type: 'string', format: 'countries', title: 'Country', description: 'A list given in the control options' },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/country',
        options: {
          countries: [
            { code: 'CA', name: 'Canada' },
            { code: 'FR', name: 'France' },
            { code: 'CH', name: 'Switzerland' },
          ],
        },
      },
    ],
  },
} satisfies DocExampleDef

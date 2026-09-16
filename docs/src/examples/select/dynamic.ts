import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      country: {
        type: 'string',
        title: 'Country',
        oneOf: [
          { const: 'CA', title: 'Canada' },
          { const: 'CH', title: 'Switzerland' },
        ],
      },
      region: {
        type: 'string',
        title: 'Region',
        description: 'The options depend on the country',
        oneOf: [
          { const: 'ON', title: 'Ontario', rules: { visible: 'country == "CA"' } },
          { const: 'QC', title: 'Quebec', rules: { visible: 'country == "CA"' } },
          { const: 'GE', title: 'Geneva', rules: { visible: 'country == "CH"' } },
          { const: 'ZH', title: 'Zurich', rules: { visible: 'country == "CH"' } },
        ],
        rules: { visible: 'isNotEmpty(country)' },
      },
    },
  },
  data: { country: 'CA', region: 'QC' },
} satisfies DocExampleDef

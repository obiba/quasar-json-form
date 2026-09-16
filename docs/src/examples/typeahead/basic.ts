import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        format: 'typeahead',
        title: 'Role',
        description: 'Suggestions from the schema examples',
        examples: ['Principal investigator', 'Co-investigator', 'Data manager', 'Statistician'],
      },
      team: { type: 'string', title: 'Team' },
    },
  },
  uischema: {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/role' },
      {
        type: 'Control',
        scope: '#/properties/team',
        options: {
          format: 'typeahead',
          editable: true,
          outlined: true,
          values: [{ label: 'Biostatistics', value: 'biostat' }, { label: 'Data science', value: 'ds' }],
          placeholder: 'Pick one or type your own (Enter)',
        },
      },
    ],
  },
  data: { role: 'Data manager' },
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      kind: { type: 'string', title: 'Kind', enum: ['person', 'organization'] },
      name: { type: 'string', title: 'Name' },
      orgNumber: { type: 'string', title: 'Registration number', rules: { visible: 'kind == "organization"' } },
      birthDate: { type: 'string', title: 'Birth date', format: 'date', rules: { visible: 'kind == "person"' } },
      newsletter: { type: 'boolean', title: 'Newsletter', description: 'Enabled once the name is filled in', rules: { enabled: 'isNotEmpty(name)' } },
    },
  },
  data: { kind: 'person' },
} satisfies DocExampleDef

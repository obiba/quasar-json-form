import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      notes: { type: 'string', format: 'markdown', title: 'Notes' },
    },
  },
  data: { notes: 'Rendered **markdown**, sanitized: <script>alert(1)</script> is removed.\n\n1. first\n2. second' },
  readonly: true,
} satisfies DocExampleDef

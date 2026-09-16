import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      notes: { type: 'string', format: 'markdown', title: 'Notes', description: 'Toggle the preview with the eye icon' },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/notes', options: { rows: 6, outlined: true } },
    ],
  },
  data: { notes: '## Findings\n\nA plain *markdown* string with a [link](https://www.obiba.org).\n\n- one\n- two' },
} satisfies DocExampleDef

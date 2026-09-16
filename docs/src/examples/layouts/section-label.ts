import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      agree: { type: 'boolean', title: 'I have read the notice' },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Section', label: 'Participant', description: 'Fields marked with `*` are required' },
      { type: 'Control', scope: '#/properties/name' },
      {
        type: 'Label',
        text: '<div class="bg-amber-2 q-pa-sm rounded-borders">**Notice**: your data is stored in the EU. See the <a href="https://www.obiba.org">privacy policy</a>.</div>',
      },
      { type: 'Control', scope: '#/properties/agree' },
      { type: 'Label', text: 'Thank you!', labelClass: 'text-h6 text-positive', rules: { visible: 'agree == true' } },
    ],
  },
} satisfies DocExampleDef

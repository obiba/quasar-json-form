import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      age: { type: 'integer', title: 'How old are you?', description: 'In *years*', minimum: 0 },
      city: { type: 'string', title: 'Where do you live?', enum: ['Montréal', 'Paris', 'Other'] },
      other: { type: 'string', title: 'Other city' },
      agree: { type: 'boolean', title: 'Do you agree with the **terms**?', const: true },
    },
    required: ['age', 'agree'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/age', label: 'Age', hint: 'Rounded *down*' },
      { type: 'Control', scope: '#/properties/city', label: 'City', hint: 'Pick **Other** to type a city', titleClass: 'text-primary' },
      // `label: false` hides the title: the input only has its placeholder
      { type: 'Control', scope: '#/properties/other', label: false, options: { placeholder: 'Other city' }, rules: { visible: 'city == "Other"' } },
      { type: 'Control', scope: '#/properties/agree', label: 'Yes', hint: 'Required to continue' },
    ],
  },
  data: { age: 42, city: 'Montréal' },
} satisfies DocExampleDef

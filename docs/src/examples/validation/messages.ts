import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      abstract: { type: 'string', title: 'Abstract' },
      title: { type: 'object', format: 'localizedString', title: 'Title' },
    },
    required: ['title'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/abstract', options: { rows: 2, wordLimit: '5:20', validationMessage: { wordLimitError: 'examples.messages.wordLimit' } } },
      { type: 'Control', scope: '#/properties/title', options: { validationMessage: 'Both languages are needed' } },
    ],
  },
  data: { abstract: 'Too short', title: { en: 'Only english' } },
  languages: ['en', 'fr'],
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      tags: { type: 'array', title: 'Tags', items: { type: 'string', minLength: 2 } },
      names: { type: 'array', title: 'Localized names', items: { type: 'object', format: 'localizedString' } },
    },
  },
  uischema: {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/tags', options: { dense: true } },
      { type: 'Control', scope: '#/properties/names' },
    ],
  },
  data: { tags: ['alpha', 'beta'], names: [{ en: 'One', fr: 'Un' }] },
  languages: ['en', 'fr'],
} satisfies DocExampleDef

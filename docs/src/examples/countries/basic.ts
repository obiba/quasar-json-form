import type { DocExampleDef } from '../types'
import { countryCodes } from 'ui'

export default {
  schema: {
    type: 'object',
    properties: {
      country: { type: 'string', format: 'countries', title: 'Country' },
      countries: { type: 'array', format: 'countries', title: 'Countries', items: { type: 'string' } },
    },
    required: ['country'],
  },
  uischema: {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/country' },
      { type: 'Control', scope: '#/properties/countries', options: { outlined: true } },
    ],
  },
  data: { country: 'CAN', countries: ['CAN', 'FRA'] },
  config: { countries: countryCodes },
  configCode: `import { countryCodes } from '@obiba/quasar-ui-json-form'

// <QJsonForm :config="{ countries: countryCodes }" ... />
// countryCodes = { en: [{ code: 'CAN', name: 'Canada' }, ...], fr: [...] }`,
} satisfies DocExampleDef

import type { DocExampleDef } from '../types'
import './functions'
import source from './functions.ts?raw'

export default {
  schema: {
    type: 'object',
    properties: {
      birthDate: { type: 'string', title: 'Birth date', format: 'date' },
      guardian: {
        type: 'string',
        title: 'Legal guardian',
        description: 'Asked when age(birthDate) < 18',
        rules: { visible: 'age(birthDate) < 18' },
      },
      siren: {
        type: 'string',
        title: 'SIREN number',
        hint: 'Try 732829320',
        rules: { validation: [{ expr: 'isEmpty(siren) || luhn(siren)', message: 'Invalid number (Luhn checksum)' }] },
      },
    },
  },
  data: { birthDate: '2015-06-01', siren: '732829321' },
  code: source.replace("from 'ui'", "from '@obiba/quasar-ui-json-form'"),
} satisfies DocExampleDef

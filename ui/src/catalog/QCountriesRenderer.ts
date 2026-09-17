import type { RendererApi } from './types'

export default {
  name: 'QCountriesRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "string" } + format: "countries" | "obibaCountriesUiSelect"',
      rank: 7,
      desc: 'One country, searchable by name or code.',
    },
    {
      schema: '{ "type": "array", "items": { "type": "string" } } + format: "countries" | "obibaCountriesUiSelect"',
      rank: 7,
      desc: 'Several countries, displayed as chips.',
    },
  ],
  options: {
    countries: {
      type: 'Array | Object',
      desc: 'The `[{ code, name }]` list, or a `{ locale: [...] }` map (the current vue-i18n locale is used). Defaults to `config.countries` of `QJsonForm`, then a `jsonforms-countries` provide of the application. The `countryCodes` export of the library holds the ISO 3166-1 alpha-3 codes with english and french names.',
    },
    '…': {
      type: 'any',
      desc: 'Every other option is passed as a prop to [QSelect](https://quasar.dev/vue-components/select#qselect-api).',
    },
  },
  data: {
    desc: 'A country code, or an array of codes (an emptied selection stores `undefined`).',
    example: '{ "country": "CAN", "countries": ["CAN", "FRA"] }',
  },
  items: [
    {
      name: 'countries',
      label: 'Countries',
      icon: 'public',
      schema: {
        type: 'string',
        format: 'countries',
      },
      uischema: {
        type: 'Control',
      },
    },
  ],
} satisfies RendererApi

import type { RendererApi } from './types'

export default {
  name: 'QLocalizedStringRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "object", "format": "localizedString" }',
      rank: 6,
      desc: 'One input for the current language with a language selector (`localizedstring` is accepted too).',
    },
    {
      schema: '{ "type": "object", "format": "obibaSimpleMde" }',
      rank: 6,
      desc: 'Same, with the markdown editor.',
    },
  ],
  options: {
    rows: {
      type: 'Number',
      desc: 'Textarea with that many rows when greater than 1 (5 rows by default for the markdown editor).',
    },
    marked: {
      type: 'Boolean',
      default: 'false',
      desc: 'Markdown editor with preview instead of a plain input (also `options.format: "markdown"`).',
    },
    languages: {
      type: 'Array | Object',
      desc: 'Languages of this control, `[\'en\', \'fr\']` or `{ en: \'English\' }`; defaults to `config.languages`, then the `languages` prop of `QJsonForm`, then `[\'en\']`.',
    },
    '…': {
      type: 'any',
      desc: 'Every other option is passed as a prop to [QInput](https://quasar.dev/vue-components/input#qinput-api).',
    },
  },
  validation: {
    completed: {
      message: 'localized.completed',
      desc: 'A required localized string must have a value in every language; `validationMessage.completed`.',
    },
  },
  data: {
    desc: 'An object keyed by language code. A value emptied in every language stores `undefined`, so that `required` applies. Switching the language selector switches every localized control of the form; the initial language is the vue-i18n locale when it is one of the languages. Read-only, the markdown variant renders the text.',
    example: '{ "title": { "en": "My study", "fr": "Mon étude" } }',
  },
  items: [
    {
      name: 'localized-string',
      label: 'Localized text',
      icon: 'translate',
      schema: {
        type: 'object',
        format: 'localizedString',
      },
      formats: ['localizedstring', 'obibaSimpleMde'],
      uischema: {
        type: 'Control',
      },
    },
  ],
} satisfies RendererApi

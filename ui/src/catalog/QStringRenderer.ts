import type { RendererApi } from './types'

export default {
  name: 'QStringRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "string" }',
      rank: 3,
      desc: 'Any string property without a more specific renderer (`enum`, `format: date`, `markdown`, `typeahead`, `file`... have their own).',
    },
    {
      schema: '{ "type": "string", "format": "password" }',
      rank: 3,
      desc: '`format` selects the input type: `text`, `textarea`, `password`, `email`, `search`, `tel`, `url` / `uri`.',
    },
  ],
  options: {
    type: {
      type: 'String',
      default: 'text',
      desc: 'Input type of the underlying `QInput`, overriding the schema `format` (`text`, `textarea`, `password`, `email`, `search`, `tel`, `url`, `number`...).',
    },
    rows: {
      type: 'Number',
      desc: 'Number of rows; when greater than 1 the input is a `textarea`.',
    },
    placeholder: {
      type: 'String',
      desc: 'Placeholder of the input.',
    },
    wordLimit: {
      type: 'String | Number',
      desc: 'Word count limit, `"min:max"` or a maximum; a word counter is displayed under the input.',
    },
    wordMin: {
      type: 'Number',
      desc: 'Minimum number of words.',
    },
    wordMax: {
      type: 'Number',
      desc: 'Maximum number of words.',
    },
    '…': {
      type: 'any',
      desc: 'Any other option is passed as a prop to [QInput](https://quasar.dev/vue-components/input#qinput-api): `outlined`, `filled`, `dense`, `clearable`, `autocomplete`, `maxlength`, `prefix`, `suffix`, `mask`...',
    },
  },
  validation: {
    wordLimit: {
      message: 'error.wordLimit',
      desc: '`wordLimit: "min:max"` not satisfied (`{min}`, `{max}` available in the message); `validationMessage.wordLimitError` on the control.',
    },
    wordMin: {
      message: 'error.wordMin',
      desc: 'Fewer than `wordMin` words (`{limit}`); `validationMessage.wordMinError`.',
    },
    wordMax: {
      message: 'error.wordMax',
      desc: 'More than `wordMax` words (`{limit}`); `validationMessage.wordMaxError`.',
    },
  },
  data: {
    desc: 'The text as typed. An emptied input stores `undefined` rather than `""`, so that `required` applies. Schema keywords `minLength`, `maxLength`, `pattern` and `format` (`email`, `uri`...) are validated by AJV.',
    example: '{ "name": "Ada Lovelace" }',
  },
  items: [
    {
      name: 'text',
      label: 'Text',
      icon: 'text_fields',
      schema: {
        type: 'string',
      },
      uischema: {
        type: 'Control',
      },
    },
    {
      name: 'textarea',
      label: 'Text area',
      icon: 'notes',
      schema: {
        type: 'string',
      },
      uischema: {
        type: 'Control',
        options: {
          rows: 3,
        },
      },
    },
    {
      name: 'email',
      label: 'Email',
      icon: 'alternate_email',
      schema: {
        type: 'string',
        format: 'email',
      },
      uischema: {
        type: 'Control',
      },
    },
    {
      name: 'url',
      label: 'URL',
      icon: 'link',
      schema: {
        type: 'string',
        format: 'uri',
      },
      uischema: {
        type: 'Control',
      },
    },
    {
      name: 'password',
      label: 'Password',
      icon: 'password',
      schema: {
        type: 'string',
        format: 'password',
      },
      uischema: {
        type: 'Control',
      },
    },
  ],
} satisfies RendererApi

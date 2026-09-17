import type { RendererApi } from './types'

export default {
  name: 'QLabelRenderer',
  kind: 'layout',
  triggers: [
    {
      schema: '{ "type": "Label", "text": "..." }',
      rank: 3,
      desc: 'Free text: markdown with raw HTML allowed (`<h3>`, alert `<div>`s...), sanitized with DOMPurify. The text is first resolved as a vue-i18n key.',
    },
  ],
  element: {
    text: {
      type: 'String',
      desc: 'The content (JSON Forms convention); `label` is accepted too.',
    },
    labelClass: {
      type: 'String',
      desc: 'CSS classes added to the root element.',
    },
    rules: {
      type: 'Object',
      desc: '`visible` filtrex rule.',
    },
  },
  options: {
    class: {
      type: 'String',
      desc: 'CSS classes of the root element (`q-label-renderer`).',
    },
  },
  items: [
    {
      name: 'label',
      label: 'Label',
      icon: 'label',
      uischema: {
        type: 'Label',
        text: '',
      },
    },
  ],
} satisfies RendererApi

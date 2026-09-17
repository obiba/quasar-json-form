import type { RendererApi } from './types'

export default {
  name: 'QSectionRenderer',
  kind: 'layout',
  triggers: [
    {
      schema: '{ "type": "Section", "label": "..." }',
      rank: 1,
      desc: 'A heading with an optional description, without children: announces the fields that follow.',
    },
  ],
  element: {
    label: {
      type: 'String',
      desc: 'The heading (`q-form-label`), translated with `t()` and rendered as inline markdown; `title` is accepted too.',
    },
    description: {
      type: 'String',
      desc: 'Text under the heading, markdown.',
    },
    labelClass: {
      type: 'String',
      desc: 'CSS classes added to the heading (`q-form-label`).',
    },
    descriptionClass: {
      type: 'String',
      desc: 'CSS classes added to the description (`q-form-description`).',
    },
    rules: {
      type: 'Object',
      desc: '`visible` filtrex rule.',
    },
  },
  options: {
    class: {
      type: 'String',
      desc: 'CSS classes of the root element (`q-section-renderer`).',
    },
  },
  items: [
    {
      name: 'section',
      label: 'Section',
      icon: 'title',
      uischema: {
        type: 'Section',
        label: '',
      },
    },
  ],
} satisfies RendererApi

import type { RendererApi } from './types'

export default {
  name: 'QGroupRenderer',
  kind: 'layout',
  triggers: [
    {
      schema: '{ "type": "Group", "label": "...", "elements": [...] }',
      rank: 3,
      desc: 'A titled block of elements.',
    },
    {
      schema: '{ "type": "Category", "label": "...", "elements": [...] }',
      rank: 3,
      desc: 'The content of a `Categorization` tab (the tab label is `label`).',
    },
  ],
  element: {
    label: {
      type: 'String',
      desc: 'Title of the group (the JSON Forms convention); `title` is accepted too. Translated with `t()` and rendered as markdown.',
    },
    description: {
      type: 'String',
      desc: 'Text under the title, markdown.',
    },
    hint: {
      type: 'String',
      desc: 'Text after the elements, markdown, smaller and grey.',
    },
    elements: {
      type: 'Array',
      desc: 'The child elements.',
    },
    titleClass: {
      type: 'String',
      desc: 'CSS classes added to the title (`q-form-title`).',
    },
    descriptionClass: {
      type: 'String',
      desc: 'CSS classes added to the description (`q-form-description`).',
    },
    hintClass: {
      type: 'String',
      desc: 'CSS classes added to the hint (`q-form-hint`).',
    },
    rules: {
      type: 'Object',
      desc: '`visible` and `enabled` filtrex rules apply to the whole group.',
    },
  },
  options: {
    class: {
      type: 'String',
      desc: 'CSS classes of the root element (`q-group-renderer`).',
    },
  },
  items: [
    {
      name: 'category',
      label: 'Tab',
      icon: 'tab_unselected',
      uischema: {
        type: 'Category',
        label: '',
        elements: [],
      },
    },
    {
      name: 'group',
      label: 'Group',
      icon: 'folder',
      uischema: {
        type: 'Group',
        label: '',
        elements: [],
      },
    },
  ],
} satisfies RendererApi

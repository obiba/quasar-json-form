import type { RendererApi } from './types'

export default {
  name: 'QTabsLayout',
  kind: 'layout',
  triggers: [
    {
      schema: '{ "type": "Categorization", "elements": [{ "type": "Category", "label": "...", "elements": [...] }] }',
      rank: 4,
      desc: 'One tab per `Category`, labelled by its `label` (translated with `t()`); the category itself renders as a group.',
    },
    {
      schema: '{ "type": "TabsLayout", "labels": [...], "elements": [...] }',
      rank: 4,
      desc: 'One tab per element, labelled by `labels` (or numbered).',
    },
  ],
  element: {
    elements: {
      type: 'Array',
      desc: 'The tab contents.',
    },
    labels: {
      type: 'Array',
      desc: '`TabsLayout`: the tab labels, translated with `t()`; `1`, `2`... by default.',
    },
    labelClass: {
      type: 'String',
      desc: 'CSS classes added to every tab.',
    },
    rules: {
      type: 'Object',
      desc: '`visible` and `enabled` filtrex rules apply to every tab.',
    },
  },
  items: [
    {
      name: 'tabs',
      label: 'Tabs',
      icon: 'tab',
      uischema: {
        type: 'Categorization',
        elements: [
          {
            type: 'Category',
            label: '',
            elements: [],
          },
        ],
      },
    },
  ],
} satisfies RendererApi

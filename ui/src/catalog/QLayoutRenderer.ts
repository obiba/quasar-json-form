import type { RendererApi } from './types'

export default {
  name: 'QLayoutRenderer',
  kind: 'layout',
  triggers: [
    {
      schema: '{ "type": "VerticalLayout", "elements": [...] }',
      rank: 2,
      desc: 'Elements stacked vertically (flex column, 10px gap).',
    },
    {
      schema: '{ "type": "HorizontalLayout", "elements": [...] }',
      rank: 2,
      desc: 'Elements side by side, each taking an equal share (flex row, 20px gap).',
    },
  ],
  element: {
    elements: {
      type: 'Array',
      desc: 'The child elements (layouts, groups, labels, controls), rendered as direct children of the layout root.',
    },
    rules: {
      type: 'Object',
      desc: '`visible` and `enabled` filtrex rules apply to the whole layout.',
    },
  },
  options: {
    class: {
      type: 'String',
      desc: 'CSS classes of the root element. When `row`, `column` or `flex` is present, the default flex stacking is not applied, so Quasar grid classes work: `row q-col-gutter-md` on the layout and `col-md-6` on its children.',
    },
  },
  items: [
    {
      name: 'vertical',
      label: 'Vertical layout',
      icon: 'view_agenda',
      uischema: {
        type: 'VerticalLayout',
        elements: [],
      },
    },
    {
      name: 'horizontal',
      label: 'Horizontal layout',
      icon: 'view_column',
      uischema: {
        type: 'HorizontalLayout',
        elements: [],
      },
    },
  ],
} satisfies RendererApi

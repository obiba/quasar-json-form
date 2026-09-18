import type { RendererApi } from './types'

export default {
  name: 'QStepperLayout',
  kind: 'layout',
  triggers: [
    {
      schema: '{ "type": "StepperLayout", "labels": [...], "elements": [...] }',
      rank: 2,
      desc: 'One step per element, with Continue / Back navigation (`continue` and `back` i18n keys).',
    },
  ],
  element: {
    elements: {
      type: 'Array',
      desc: 'The step contents.',
    },
    labels: {
      type: 'Array',
      desc: 'The step titles, translated with `t()`; `1`, `2`... by default.',
    },
    icons: {
      type: 'Array',
      desc: 'One icon name per step (ignored unless there is exactly one per element).',
    },
    labelClass: {
      type: 'String',
      desc: 'CSS classes added to the stepper.',
    },
    rules: {
      type: 'Object',
      desc: '`enabled` rule applies to every step.',
    },
  },
  items: [
    {
      name: 'stepper',
      label: 'Stepper',
      icon: 'stairs',
      uischema: {
        type: 'StepperLayout',
        labels: [],
        elements: [],
      },
    },
  ],
} satisfies RendererApi

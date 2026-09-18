import type { RendererApi } from './types'

export default {
  name: 'QComputedRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: 'format: "computed" (schema or options) + rules.compute',
      rank: 4,
      desc: 'A value computed from the other fields with the `compute` rule, written into the data.',
    },
  ],
  options: {
    show: {
      type: 'Boolean',
      default: 'false',
      desc: 'Display the computed value under the title (the `noValue` i18n key when undefined).',
    },
  },
  data: {
    desc: 'The result of the `compute` rule (`rules.compute` on the schema property or the control), re-evaluated whenever the form data changes; `undefined` while the control is hidden.',
    example: '{ "quantity": 3, "price": 9.99, "total": 29.97 }',
  },
  items: [
    {
      name: 'computed',
      label: 'Computed',
      icon: 'functions',
      schema: {
        type: 'string',
        format: 'computed',
      },
      uischema: {
        type: 'Control',
        rules: {
          compute: '',
        },
      },
    },
  ],
} satisfies RendererApi

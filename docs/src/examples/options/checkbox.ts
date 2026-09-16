import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      toppings: {
        type: 'array',
        title: 'Toppings',
        uniqueItems: true,
        items: { type: 'string', enum: ['cheese', 'olives', 'mushrooms', 'peppers'] },
        maxItems: 3,
      },
      channels: {
        type: 'array',
        title: 'Notification channels',
        uniqueItems: true,
        items: { type: 'string', oneOf: [
          { const: 'email', title: 'Email' },
          { const: 'sms', title: 'SMS' },
          { const: 'push', title: 'Push' },
        ] },
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/toppings', options: { format: 'checkbox', inline: true, color: 'teal' } },
      { type: 'Control', scope: '#/properties/channels', options: { format: 'toggle' } },
    ],
  },
  data: { toppings: ['cheese'], channels: ['email'] },
} satisfies DocExampleDef

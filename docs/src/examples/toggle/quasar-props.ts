import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      dark: { type: 'boolean', title: 'Dark mode' },
      notifications: { type: 'boolean', title: 'Notifications' },
    },
  },
  uischema: {
    type: 'HorizontalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/dark', options: { color: 'purple', checkedIcon: 'dark_mode', uncheckedIcon: 'light_mode', size: 'lg' } },
      { type: 'Control', scope: '#/properties/notifications', label: 'Enabled', hint: 'Push notifications on your *phone*', options: { leftLabel: true, color: 'teal' } },
    ],
  },
  data: { dark: true },
} satisfies DocExampleDef

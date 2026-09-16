import type { DocExampleDef } from '../types'
import { colorRenderer } from './QColorRenderer'
import source from './QColorRenderer.ts?raw'

export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      color: { type: 'string', title: 'Color', description: 'Rendered by the QColorRenderer of the application', hint: 'Pick a swatch' },
    },
    required: ['color'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/name' },
      { type: 'Control', scope: '#/properties/color', options: { format: 'color' } },
    ],
  },
  data: { name: 'Quasar', color: '#1976d2' },
  renderers: [colorRenderer],
  code: `// <QJsonForm :renderers="[colorRenderer]" ... />\n${source.replace("from 'ui'", "from '@obiba/quasar-ui-json-form'")}`,
} satisfies DocExampleDef

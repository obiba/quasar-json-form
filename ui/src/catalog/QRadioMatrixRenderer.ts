import type { RendererApi } from './types'

export default {
  name: 'QRadioMatrixRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "object", "format": "radioGroupCollection" | "radio-matrix" }',
      rank: 6,
      desc: 'A table: one row per item, one radio column per value.',
    },
  ],
  options: {
    items: {
      type: 'Array',
      desc: 'The rows, `[{ key, name }]` (`title`, `label` or `caption` are accepted for the label, which is rendered as inline markdown). Also read from `items` on the schema property, as in the angular-schema-form add-on.',
    },
    values: {
      type: 'Array | Object',
      desc: 'The columns, `[{ key, caption }]` or `{ key: caption }`. Also read from `values` on the schema property.',
    },
    checkboxMode: {
      type: 'Boolean',
      default: 'false',
      desc: 'One checkbox per item instead of radio columns; the data is `{ [item.key]: boolean }`.',
    },
  },
  validation: {
    allItemsSelected: {
      message: 'radioMatrix.allItemsSelected',
      desc: 'A required matrix must have every row answered (at least one checked in checkbox mode), once the data exists; `validationMessage.allItemsSelected`.',
    },
  },
  data: {
    desc: 'An object keyed by item key: the selected value key, or a boolean in checkbox mode. Read-only, a check mark shows the selection.',
    example: '{ "access": { "access_data": "yes", "access_bio_samples": "no" } }',
  },
  items: [
    {
      name: 'radio-matrix',
      label: 'Radio matrix',
      icon: 'grid_on',
      schema: {
        type: 'object',
        format: 'radio-matrix',
      },
      formats: ['radioGroupCollection'],
      uischema: {
        type: 'Control',
        options: {
          items: [
            {
              key: 'a',
              label: 'A',
            },
          ],
          values: [
            {
              key: 'yes',
              label: 'Yes',
            },
            {
              key: 'no',
              label: 'No',
            },
          ],
        },
      },
    },
  ],
} satisfies RendererApi

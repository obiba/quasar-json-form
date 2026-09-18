import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      start: { type: 'integer', title: 'Start' },
      end: {
        type: 'integer',
        title: 'End',
        rules: {
          validation: [
            { expr: 'isEmpty(end) || end > start', message: 'The end must be after the start' },
            { expr: 'isEmpty(end) || end - start <= 10', message: 'At most 10 apart' },
          ],
        },
      },
      picks: {
        type: 'array',
        title: 'Picks',
        uniqueItems: true,
        items: { type: 'string', enum: ['one', 'two', 'three', 'four'] },
        rules: {
          validation: [
            { expr: 'length(picks) <= 2', message: 'Up to two values' },
            { expr: 'contains(picks, "one")', message: 'The value "one" must be selected' },
          ],
        },
      },
      abstract: {
        type: 'string',
        title: 'Abstract',
        rules: { validation: [{ expr: 'wordCount(abstract) <= 20', message: 'At most 20 words' }] },
      },
    },
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'HorizontalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/start' },
          { type: 'Control', scope: '#/properties/end' },
        ],
      },
      { type: 'Control', scope: '#/properties/picks', options: { format: 'checkbox', inline: true } },
      { type: 'Control', scope: '#/properties/abstract', options: { rows: 2 } },
    ],
  },
  data: { start: 5, end: 3, picks: ['two'] },
} satisfies DocExampleDef

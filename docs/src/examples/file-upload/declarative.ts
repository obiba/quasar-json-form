import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      ethics: { type: 'object', format: 'obibaFiles', title: 'Ethics approval', minItems: 1, maxItems: 2 },
    },
    required: ['ethics'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/ethics',
        options: {
          uploadUrl: '/ws/files/temp',
          metadataUrl: '/ws/files/temp/{id}',
          deleteUrl: '/ws/files/temp/{id}',
          downloadUrl: '/ws/data-access-request/x/form/attachments/{fileName}/{id}/_download',
          validationMessage: { missingFiles: 'Please provide the approval', minItems: 'One document is required' },
          emptyMessage: 'No document',
        },
      },
    ],
  },
  data: { ethics: { obibaFiles: [] } },
} satisfies DocExampleDef

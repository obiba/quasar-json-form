import type { DocExampleDef } from '../types'

export default {
  schema: {
    type: 'object',
    properties: {
      protocol: { type: 'object', format: 'obibaFiles', title: 'Research protocol', description: 'PDF documents, *at least one*' },
      attachments: { type: 'array', format: 'files', title: 'Other attachments', items: { type: 'object' }, maxItems: 3 },
      picture: { type: 'string', format: 'file', title: 'Picture', label: 'Choose a picture' },
    },
    required: ['protocol'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/protocol', options: { accept: '.pdf', emptyMessage: 'No document' } },
      { type: 'Control', scope: '#/properties/attachments' },
      { type: 'Control', scope: '#/properties/picture', options: { accept: 'image/*' } },
    ],
  },
  data: { protocol: { obibaFiles: [{ id: 'a1b2', fileName: 'protocol-v2.pdf', size: 245760 }] } },
  config: {
    fileUpload: {
      upload: (file: File) => new Promise((resolve) => {
        setTimeout(() => resolve({ id: `tmp-${Date.now()}`, fileName: file.name, size: file.size }), 800)
      }),
      remove: (item: { id?: string }) => { console.log('removed', item.id) },
      downloadUrl: (item: { id?: string; fileName?: string }) => `/ws/files/${item.id}/${item.fileName}`,
    },
  },
  configCode: `// Uploads are simulated: no server is involved in this example.
const config = {
  fileUpload: {
    // returns the file item to store (or the path, for a string control)
    upload: (file, context) => new Promise((resolve) => {
      setTimeout(() => resolve({ id: 'tmp-' + Date.now(), fileName: file.name, size: file.size }), 800)
    }),
    remove: (item, context) => { console.log('removed', item.id) },
    downloadUrl: (item, context) => '/ws/files/' + item.id + '/' + item.fileName,
  },
}
// <QJsonForm :config="config" ... />`,
} satisfies DocExampleDef

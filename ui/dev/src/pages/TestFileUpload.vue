<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Multiple file upload</div>
    <div class="text-grey-7 q-mb-md">
      Uploads are simulated with the <code>config.fileUpload</code> hooks (no server): each file gets an id after a
      short delay. The Mica declarative flow (<code>uploadUrl</code> / <code>metadataUrl</code> / <code>deleteUrl</code>
      options) is shown in the layout of the second control.
    </div>
    <q-toggle v-model="formReadonly" :label="t('readonly')" class="q-mb-md" />
    <FormPresenter
      :data="formData"
      :schema="schema"
      :uischema="uischema"
      :config="config"
      :form-readonly="formReadonly"
      readonly
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const formReadonly = ref(false);

const formData = ref({
  protocol: { obibaFiles: [{ id: 'a1b2', fileName: 'protocol-v2.pdf', size: 245760 }] },
});

let counter = 0;
const config = {
  fileUpload: {
    upload: (file: File) =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ id: `tmp-${++counter}`, fileName: file.name, size: file.size, md5: 'simulated' }), 800);
      }),
    remove: (item: { id?: string }) => {
      console.log('removed', item.id);
    },
    downloadUrl: (item: { id?: string; fileName?: string }) => `/ws/data-access-request/x/form/attachments/${item.fileName}/${item.id}/_download`,
  },
};

// `obibaFiles` objects (`{ obibaFiles: [...] }`), a `files` array and the
// legacy single path string
const schema = {
  type: 'object',
  properties: {
    protocol: { type: 'object', format: 'obibaFiles', title: 'Research protocol', description: 'PDF documents, at least one' },
    ethics: { type: 'object', format: 'obibaFiles', title: 'Ethics approval', minItems: 1, maxItems: 2 },
    attachments: { type: 'array', format: 'files', title: 'Other attachments', items: { type: 'object' } },
    picture: { type: 'string', format: 'file', title: 'Picture (single path)', label: 'Choose a picture' },
  },
  required: ['protocol'],
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/protocol', options: { accept: '.pdf', emptyMessage: 'No document' } },
    {
      type: 'Control',
      scope: '#/properties/ethics',
      options: {
        // the Mica flow, ignored here because config.fileUpload.upload is defined
        uploadUrl: '/ws/files/temp',
        metadataUrl: '/ws/files/temp/{id}',
        deleteUrl: '/ws/files/temp/{id}',
        downloadUrl: '/ws/data-access-request/x/form/attachments/{fileName}/{id}/_download',
        validationMessage: { missingFiles: 'Please provide the approval', minItems: 'One document is required' },
        emptyMessage: 'No document',
      },
    },
    { type: 'Control', scope: '#/properties/attachments' },
    { type: 'Control', scope: '#/properties/picture', options: { accept: 'image/*' } },
  ],
};
</script>

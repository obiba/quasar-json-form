<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">{{ t('json_form') }}</div>
    <FormPresenter :data="formData" :schema="schema" :uischema="uischema" readonly />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const formData = ref({});

// `options.class` on layouts, groups, labels and controls: the equivalent of
// angular-schema-form `htmlClass: "row"` / `"col-xs-6"` with the Quasar grid.
const schema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', title: 'First name' },
    lastName: { type: 'string', title: 'Last name' },
    street: { type: 'string', title: 'Street' },
    city: { type: 'string', title: 'City' },
    zip: { type: 'string', title: 'Zip' },
    country: { type: 'string', title: 'Country' },
    notes: { type: 'string', title: 'Notes' },
  },
  required: ['firstName', 'lastName'],
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Label', text: '<h3 class="q-my-sm">Identity</h3><div class="bg-blue-1 q-pa-sm rounded-borders">Raw <b>HTML</b> help block</div>' },
    {
      type: 'VerticalLayout',
      options: { class: 'row q-col-gutter-md' },
      elements: [
        {
          type: 'VerticalLayout',
          options: { class: 'col-12 col-md-6' },
          elements: [{ type: 'Control', scope: '#/properties/firstName' }],
        },
        {
          type: 'VerticalLayout',
          options: { class: 'col-12 col-md-6' },
          elements: [{ type: 'Control', scope: '#/properties/lastName' }],
        },
      ],
    },
    {
      type: 'Group',
      label: 'Address',
      options: { class: 'q-mt-md' },
      elements: [
        {
          type: 'VerticalLayout',
          options: { class: 'row q-col-gutter-md' },
          elements: [
            { type: 'Control', scope: '#/properties/street', options: { class: 'col-12' } },
            { type: 'Control', scope: '#/properties/city', options: { class: 'col-12 col-md-6' } },
            { type: 'Control', scope: '#/properties/zip', options: { class: 'col-6 col-md-3' } },
            { type: 'Control', scope: '#/properties/country', options: { class: 'col-6 col-md-3' } },
          ],
        },
      ],
    },
    { type: 'Control', scope: '#/properties/notes', options: { rows: 3, class: 'q-mt-md' } },
  ],
};
</script>

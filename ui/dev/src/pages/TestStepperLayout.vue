<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">{{ t('json_form') }}</div>
    <FormPresenter :data="formData" :schema="schema" :uischema="uischema" readonly />
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';
import { useI18n } from 'vue-i18n';

const formData = ref({
  date: '2024-01-01',
  message: 'Hello World',
  enum: 'foo',
});
const { t } = useI18n();

// Define your JSON Schema
const schema = {
  type: 'object',
  properties: {
    date: {
      type: 'string',
      format: 'date',
    },
    message: {
      type: 'string',
      maxLength: 5,
    },
    enum: {
      type: 'string',
      enum: ['foo', 'bar'],
    },
  },
};

// Optional UI Schema for layout customization
const uischema = {
  type: 'StepperLayout',
  labels: ['date', 'message', 'enum'],
  labelClass: 'text-capitalize',
  icons: ['event', 'message', 'list'],
  elements: [
    {
      type: 'Control',
      scope: '#/properties/date',
    },
    {
      type: 'Control',
      scope: '#/properties/message',
    },
    {
      type: 'Control',
      scope: '#/properties/enum',
    },
  ],
};
</script>

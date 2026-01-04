<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">{{ t('json_form') }}</div>
    <FormPresenter :data="formData" :schema="schema" readonly />
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';
import { useI18n } from 'vue-i18n';

const formData = ref({ integer: 1 });
const { t } = useI18n();

// Define your JSON Schema
const schema = {
  type: 'object',
  properties: {
    string: {
      type: 'string',
      title: 'renderers.string.label',
      description: 'renderers.string.description',
    },
    boolean: {
      type: 'boolean',
      title: 'renderers.boolean.label',
      description: 'renderers.boolean.description',
    },
    integer: {
      type: 'integer',
      title: 'renderers.integer.label',
      description: 'renderers.integer.description',
    },
    date: {
      type: 'string',
      format: 'date',
      title: 'renderers.date.label',
      description: 'renderers.date.description',
    },
    enum: {
      type: 'string',
      enum: ['one', 'two', 'three'],
      title: 'renderers.enum.label',
      description: 'renderers.enum.description',
    },
    address: {
      type: 'object',
      properties: {
        street: {
          type: 'string'
        },
        streetNumber: {
          type: 'string'
        },
        city: {
          type: 'string'
        },
        postalCode: {
          type: 'string',
          maxLength: 5
        }
      },
      rules: {
        visible: 'boolean',
      },
    },
  },
};
</script>

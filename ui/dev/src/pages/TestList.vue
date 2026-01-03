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
import { title } from 'process';

const formData = ref({
  comments: [
    {
      date: '2024-01-01',
      message: 'Hello World',
      enum: 'foo bar',
    },
  ],
});
const { t } = useI18n();

// Define your JSON Schema
const schema = {
  type: 'object',
  properties: {
    comments: {
      type: 'array',
      title: 'Comments (default layout)',
      items: {
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
      },
      rules: {
        min: '1',
        max: '3',
      },
    },
    hcomments: {
      type: 'array',
      title: 'Comments (horizontal layout)',
      items: {
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
      },
    },
  },
};

// Optional UI Schema for layout customization
const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/comments',
      options: {
        ordering: false,
        confirmation: true,
      },
    },
    {
      type: 'Control',
      scope: '#/properties/hcomments',
      options: {
        items: {
          type: 'HorizontalLayout',
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
        },
      },
    },
  ],
};
</script>

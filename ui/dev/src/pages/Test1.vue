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

const formData = ref({ integer: 1 });
const { t } = useI18n();

// Define your JSON Schema
const schema = {
  type: 'object',
  properties: {
    string: {
      type: 'string',
    },
    boolean: {
      type: 'boolean',
      description: 'This toggle is enabled only if "enum" is "One"',
    },
    number: {
      type: 'number',
    },
    integer: {
      type: 'integer',
      description: 'This integer must be between 1 and 10 to show string input',
    },
    date: {
      type: 'string',
      format: 'date',
    },
    enum: {
      type: 'string',
      enum: ['One', 'Two', 'Three'],
    },
    comments: {
      type: 'array',
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
    { type: 'Label', text: 'A simple form example' },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/string',
              options: {
                visibilityRule: 'integer >= 1 and integer < 10',
              },
            },
            {
              type: 'Control',
              scope: '#/properties/date',
            },
            {
              type: 'Control',
              scope: '#/properties/enum',
            },
          ],
        },
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/number',
            },
            {
              type: 'Control',
              scope: '#/properties/integer',
            },
            {
              type: 'Control',
              scope: '#/properties/boolean',
              options: {
                enableRule: `enum == "One"`,
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Control',
      scope: '#/properties/comments',
    },
  ],
};
</script>

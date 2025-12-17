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
      rules: {
        visible: 'integer >= 1 and integer < 10',
      },
    },
    boolean: {
      type: 'boolean',
      description: 'This toggle is enabled only if "enum" is "One"',
      rules: {
        enabled: `enum == "One"`,
      },
    },
    number: {
      type: 'number',
      description: 'A simple number input',
    },
    integer: {
      type: 'integer',
      description: 'This integer must be between 1 and 10 to show string input',
      rules: {
        validation: [
          {
            expr: 'integer % 2 == 0',
            message: 'renderers.integer.number_must_be_even',
          }
        ],
      },
    },
    date: {
      type: 'string',
      format: 'date',
    },
    enum: {
      type: 'string',
      enum: ['One', 'Two', 'Three'],
    },
    enums: {
      type: 'string',
      format: 'array',
      enum: ['one', 'two', 'three'],
      title: 'renderers.enums.label',
      description: 'renderers.enums.description',
      rules: {
        validation: [
          {
            expr: 'length(enums) <= 2',
            message: 'You can select up to two values only',
          },
          {
            expr: 'length(enums) >= 1',
            message: 'Please select at least one value',
          },
          {
            expr: '"one" in enums',
            message: 'The "one" value must be selected',
          },
          {
            expr: 'get(enums, 0) == "one"',
            message: 'The "one" value must be selected first',
          },
        ],
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
              scope: '#/properties/string'
            },
            {
              type: 'Control',
              scope: '#/properties/date',
            },
            {
              type: 'Control',
              scope: '#/properties/enum',
            },
            {
              type: 'Control',
              scope: '#/properties/enums',
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
            },
          ],
        },
      ],
    },
  ],
};
</script>

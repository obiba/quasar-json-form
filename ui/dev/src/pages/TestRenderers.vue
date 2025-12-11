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
      title: 'renderers.string.label',
      description: 'renderers.string.description',
    },
    boolean: {
      type: 'boolean',
      title: 'renderers.boolean.label',
      description: 'renderers.boolean.description',
    },
    number: {
      type: 'number',
      title: 'renderers.number.label',
      description: 'renderers.number.description',
    },
    integer: {
      type: 'integer',
      title: 'renderers.integer.label',
      description: 'renderers.integer.description',
    },
    rating: {
      type: 'integer',
      title: 'renderers.rating.label',
      description: 'renderers.rating.description',
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
      options: [
        {
          label: 'renderers.enum.options.one', value: 'one'
        },
        {
          label: 'renderers.enum.options.two', value: 'two'
        },
        {
          label: 'renderers.enum.options.three', value: 'three'
        }
      ],
      title: 'renderers.enum.label',
      description: 'renderers.enum.description',
    },
    enums: {
      type: 'string',
      format: 'array',
      enum: ['one', 'two', 'three'],
      title: 'renderers.enums.label',
      description: 'renderers.enums.description',
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
              options: {
                maxValues: 2,
                useChips: true,
                clearable: true,
              },
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
              scope: '#/properties/rating',
              options: {
                format: 'rating',
                icon: 'star_border',
                iconSelected: 'star',
                color: 'red',
                size: 'md',
                max: 6,
              },
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

<template>
  <q-page class='q-pa-md'>
    <div class='text-h5 q-mb-md'>{{ t('json_form') }}</div>
    <FormPresenter :data='formData' :schema='schema' :uischema='uischema' readonly />
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';
import { useI18n } from 'vue-i18n';

const formData = ref({});
const { t } = useI18n();

// Define your JSON Schema
const schema = {
  type: 'object',
  properties: {
    firstName: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your first name'
    },
    secondName: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your second name'
    },
    birthDate: {
      type: 'string',
      format: 'date',
      description: 'Please enter your birth date.'
    },
    nationality: {
      type: 'string',
      enum: [
        'DE',
        'IT',
        'JP',
        'US',
        'RU',
        'Other'
      ]
    },
    provideAddress: {
      type: 'boolean'
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
        visible: 'provideAddress',
      },
    },
    vegetarianOptions: {
      type: 'object',
      properties: {
        vegan: {
          type: 'boolean'
        },
        favoriteVegetable: {
          type: 'string',
          enum: [
            'Tomato',
            'Potato',
            'Salad',
            'Aubergine',
            'Cucumber',
            'Other'
          ]
        },
        otherFavoriteVegetable: {
          type: 'string'
        }
      }
    }
  }
}
;

// Optional UI Schema for layout customization
const uischema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'renderers.categories.labels.identification',
      title: 'renderers.categories.titles.identification',
      description: 'renderers.categories.descriptions.identification',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/firstName'
            },
            {
              type: 'Control',
              scope: '#/properties/secondName'
            }
          ]
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/birthDate'
            },
            {
              type: 'Control',
              scope: '#/properties/nationality'
            }
          ]
        }
      ]
    },
    {
      type: 'Category',
      label: 'renderers.categories.labels.address',
      title: 'renderers.categories.titles.address',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/provideAddress'
        },
        {
          type: 'Control',
          scope: '#/properties/address',
          elements: [
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/address/properties/street'
                },
                {
                  type: 'Control',
                  scope: '#/properties/address/properties/streetNumber'
                }
              ]
            },
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/address/properties/city'
                },
                {
                  type: 'Control',
                  scope: '#/properties/address/properties/postalCode'
                }
              ]
            }
          ]
        },
      ],
    },
    {
      type: 'Category',
      label: 'renderers.categories.labels.additional',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/vegetarianOptions/properties/vegan'
        },
        {
          type: 'Control',
          scope: '#/properties/vegetarianOptions/properties/favoriteVegetable'
        },
        {
          type: 'Control',
          scope: '#/properties/vegetarianOptions/properties/otherFavoriteVegetable'
        }
      ]
    }
  ]
};
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">{{ t('json_form') }}</div>
    <FormPresenter :data="formData" :schema="schema" :uischema="uischema" readonly @update:data="onDataUpdate"/>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';
import { useI18n } from 'vue-i18n';

const formData = ref({ country: '', region: '', city: '' });
const { t } = useI18n();

// Define your JSON Schema
const schema = {
  type: 'object',
  properties: {
    country: {
      type: 'string',
      enum: ['Canada', 'France', 'Switzerland'],
      title: 'Country',
      description: '1. Select a country from the list.',
    },
    region: {
      type: 'string',
      enum: [],
      title: 'Region',
      description: '2. Select a region from the selected country.',
    },
    city: {
      type: 'string',
      enum: [],
      title: 'City',
      description: '3. Select a city from the selected region.',
    },
  },
};

// Optional UI Schema for layout customization
const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Control',
      scope: '#/properties/country',
    },
    {
      type: 'Control',
      scope: '#/properties/region',
    },
    {
      type: 'Control',
      scope: '#/properties/city',
    },
  ],
};

const onDataUpdate = (newData) => {
  if (newData.country) {
    if (newData.country === 'Canada') {
      schema.properties.region.enum = ['Ontario', 'Quebec', 'British Columbia'];
    } else if (newData.country === 'France') {
      schema.properties.region.enum = ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes'];
    } else if (newData.country === 'Switzerland') {
      schema.properties.region.enum = ['Zurich', 'Geneva', 'Bern'];
    } else {
      schema.properties.region.enum = [];
    }
  } else {
    schema.properties.region.enum = [];
  }
  if (newData.region) {
    if (newData.region === 'Ontario') {
      schema.properties.city.enum = ['Toronto', 'Ottawa', 'Hamilton'];
    } else if (newData.region === 'Quebec') {
      schema.properties.city.enum = ['Montreal', 'Quebec City', 'Laval'];
    } else if (newData.region === 'British Columbia') {
      schema.properties.city.enum = ['Vancouver', 'Victoria', 'Richmond'];
    } else if (newData.region === 'Île-de-France') {
      schema.properties.city.enum = ['Paris', 'Boulogne-Billancourt', 'Saint-Denis'];
    } else if (newData.region === 'Provence-Alpes-Côte d\'Azur') {
      schema.properties.city.enum = ['Marseille', 'Nice', 'Toulon'];
    } else if (newData.region === 'Auvergne-Rhône-Alpes') {
      schema.properties.city.enum = ['Lyon', 'Grenoble', 'Saint-Étienne'];
    } else if (newData.region === 'Zurich') {
      schema.properties.city.enum = ['Zurich', 'Winterthur', 'Uster'];
    } else if (newData.region === 'Geneva') {
      schema.properties.city.enum = ['Geneva', 'Carouge', 'Lancy'];
    } else if (newData.region === 'Bern') {
      schema.properties.city.enum = ['Bern', 'Thun', 'Biel/Bienne'];
    } else {
      schema.properties.city.enum = [];
    }
  } else {
    schema.properties.city.enum = [];
  }
  formData.value = newData;
  // reset dependent fields
  if (!schema.properties.region.enum.includes(formData.value.region)) {
    formData.value.region = '';
    formData.value.city = '';
    schema.properties.city.enum = [];
  }
  if (!schema.properties.city.enum.includes(formData.value.city)) {
    formData.value.city = '';
  }
};
</script>

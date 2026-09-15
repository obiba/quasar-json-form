<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Radio matrix, dates, word limit, countries, typeahead</div>
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
import { countryCodes } from '../../../src/vue-plugin';

const { t } = useI18n();
const formReadonly = ref(false);

const config = { countries: countryCodes };

const formData = ref({
  access: { access_data: 'yes' },
  startYear: 2020,
  startMonth: 2,
  countriesIso: ['CAN', 'FRA'],
});

const schema = {
  type: 'object',
  properties: {
    access: {
      type: 'object',
      format: 'radioGroupCollection',
      title: 'Access',
      // the angular-schema-form add-on keeps the rows and columns on the schema
      values: [
        { key: 'yes', caption: 'Yes' },
        { key: 'no', caption: 'No' },
        { key: 'na', caption: 'Not applicable' },
      ],
      items: [
        { key: 'access_data', name: 'Access to *data*' },
        { key: 'access_bio_samples', name: 'Access to bio samples' },
        { key: 'access_other', name: 'Access to other material' },
      ],
    },
    consents: { type: 'object', format: 'radio-matrix', title: 'Consents (checkbox mode)' },
    startYear: { type: 'number', title: 'Start year', minimum: 1900, maximum: 2500 },
    startMonth: { type: 'number', title: 'Start month', minimum: 1, maximum: 12 },
    startDay: { type: 'string', format: 'ymdatepicker', title: 'Start day' },
    endDate: { type: 'string', format: 'datepicker', title: 'End date (dd/MM/yyyy, after 2020)' },
    period: { type: 'string', format: 'year-month', title: 'Period (year-month)' },
    abstract: { type: 'string', title: 'Abstract (10 to 50 words)' },
    justification: { type: 'string', title: 'Justification (filtrex wordCount rule)', rules: { validation: [{ expr: 'wordCount(justification) <= 20', message: 'At most 20 words' }] } },
    country: { type: 'string', format: 'countries', title: 'Country' },
    countriesIso: { type: 'array', format: 'obibaCountriesUiSelect', title: 'Countries', items: { type: 'string' } },
    role: { type: 'string', format: 'typeahead', title: 'Role', examples: ['Principal investigator', 'Co-investigator', 'Data manager', 'Statistician'] },
    freeRole: { type: 'string', format: 'typeahead', title: 'Role (editable, Enter to add)' },
  },
  required: ['access', 'startYear', 'country'],
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/access' },
    {
      type: 'Control',
      scope: '#/properties/consents',
      options: {
        checkboxMode: true,
        items: [
          { key: 'data_sharing', name: 'Data sharing' },
          { key: 'recontact', name: 'Re-contact' },
        ],
      },
    },
    {
      type: 'VerticalLayout',
      options: { class: 'row q-col-gutter-md' },
      elements: [
        { type: 'Control', scope: '#/properties/startYear', options: { class: 'col-4' } },
        { type: 'Control', scope: '#/properties/startMonth', options: { class: 'col-4' } },
        {
          type: 'Control',
          scope: '#/properties/startDay',
          options: {
            class: 'col-4',
            dateOptions: { dateFormat: 'yyyy-MM-dd', yearRef: 'startYear', monthRef: 'startMonth', validationMessage: { invalidYMDate: 'Not in the selected month' } },
          },
        },
      ],
    },
    {
      type: 'VerticalLayout',
      options: { class: 'row q-col-gutter-md' },
      elements: [
        { type: 'Control', scope: '#/properties/endDate', options: { class: 'col-6', dateOptions: { dateFormat: 'dd/MM/yyyy', min: '2020-01-01' } } },
        { type: 'Control', scope: '#/properties/period', options: { class: 'col-6' } },
      ],
    },
    { type: 'Control', scope: '#/properties/abstract', options: { rows: 3, wordLimit: '10:50', validationMessage: { wordLimitError: 'The abstract must have between 10 and 50 words' } } },
    { type: 'Control', scope: '#/properties/justification', options: { rows: 2 } },
    {
      type: 'VerticalLayout',
      options: { class: 'row q-col-gutter-md' },
      elements: [
        { type: 'Control', scope: '#/properties/country', options: { class: 'col-6' } },
        { type: 'Control', scope: '#/properties/countriesIso', options: { class: 'col-6' } },
      ],
    },
    {
      type: 'VerticalLayout',
      options: { class: 'row q-col-gutter-md' },
      elements: [
        { type: 'Control', scope: '#/properties/role', options: { class: 'col-6' } },
        { type: 'Control', scope: '#/properties/freeRole', options: { class: 'col-6', editable: true, values: ['Analyst', 'Reviewer'] } },
      ],
    },
  ],
};
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">{{ t('json_form') }}</div>
    <div class="row q-gutter-md q-mb-md items-center">
      <q-toggle v-model="readonly" :label="t('readonly')" />
      <q-btn-toggle
        v-model="validationMode"
        :options="validationModes"
        toggle-color="primary"
        no-caps
        unelevated
        outline
      />
    </div>
    <FormPresenter
      :key="`${readonly}-${validationMode}`"
      :data="formData"
      :schema="schema"
      :uischema="uischema"
      :form-readonly="readonly"
      :validation-mode="validationMode"
      readonly
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const readonly = ref(false);
const validationMode = ref<'ValidateAndShow' | 'ValidateAndHide' | 'NoValidation'>('ValidateAndShow');
const validationModes = [
  { label: 'ValidateAndShow', value: 'ValidateAndShow' },
  { label: 'ValidateAndHide', value: 'ValidateAndHide' },
  { label: 'NoValidation', value: 'NoValidation' },
];

const formData = ref({ name: 'Jo', age: 12, email: 'not-an-email', tags: ['a'] });

// Schema-driven validation (AJV): required, minLength, minimum, pattern, format, minItems...
// Error messages come from the application vue-i18n bundle (`error.<keyword>` keys)
// or from the library defaults, in the current locale.
const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      description: 'Required, at least 3 characters',
      minLength: 3,
    },
    age: {
      type: 'integer',
      title: 'Age',
      description: 'Required, 18 or more',
      minimum: 18,
    },
    email: {
      type: 'string',
      title: 'Email',
      description: 'Optional, must be an email',
      format: 'email',
    },
    code: {
      type: 'string',
      title: 'Code',
      description: 'Optional, pattern ^[A-Z]{3}-[0-9]{3}$',
      pattern: '^[A-Z]{3}-[0-9]{3}$',
    },
    birth: {
      type: 'string',
      format: 'date',
      title: 'Birth date',
    },
    color: {
      type: 'string',
      title: 'Color',
      description: 'Required',
      enum: ['red', 'green', 'blue'],
    },
    tags: {
      type: 'array',
      uniqueItems: true,
      title: 'Tags',
      description: 'At least 2 tags',
      minItems: 2,
      items: { type: 'string', enum: ['a', 'b', 'c', 'd'] },
    },
    even: {
      type: 'integer',
      title: 'Even number',
      description: 'Validation rule, evaluated whatever the validation mode',
      rules: {
        validation: [{ expr: 'even mod 2 == 0', message: 'renderers.integer.number_must_be_even' }],
      },
    },
    contacts: {
      type: 'array',
      title: 'Contacts',
      description: 'Each contact needs a name',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name' },
          phone: { type: 'string', title: 'Phone', pattern: '^[0-9 +]+$' },
        },
        required: ['name'],
      },
    },
  },
  required: ['name', 'age', 'color'],
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'HorizontalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/age' },
      ],
    },
    {
      type: 'HorizontalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/email' },
        { type: 'Control', scope: '#/properties/code' },
      ],
    },
    {
      type: 'HorizontalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/birth' },
        { type: 'Control', scope: '#/properties/color' },
      ],
    },
    { type: 'Control', scope: '#/properties/tags', options: { format: 'checkbox' } },
    { type: 'Control', scope: '#/properties/even' },
    { type: 'Control', scope: '#/properties/contacts' },
  ],
};
</script>

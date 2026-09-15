<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Localized strings and markdown</div>
    <div class="row q-gutter-md q-mb-md">
      <q-toggle v-model="formReadonly" :label="t('readonly')" />
      <q-select
        v-model="languages"
        :options="languageOptions"
        label="Languages"
        emit-value
        map-options
        dense
        style="min-width: 250px"
      />
    </div>
    <FormPresenter
      :key="JSON.stringify(languages)"
      :data="formData"
      :schema="schema"
      :uischema="uischema"
      :languages="languages"
      :form-readonly="formReadonly"
      readonly
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const formReadonly = ref(false);
const languages = ref<string[] | Record<string, string>>({ en: 'English', fr: 'Français' });
const languageOptions = [
  { label: 'en, fr (with labels)', value: { en: 'English', fr: 'Français' } },
  { label: 'en, fr, de', value: ['en', 'fr', 'de'] },
  { label: 'en only', value: ['en'] },
];

const formData = ref({
  name: { en: 'My study', fr: 'Mon étude' },
  objectives: { en: 'Some **markdown** text\n\n- item 1\n- item 2' },
  notes: 'A plain *markdown* string',
});

// The Mica shapes: `localizedString` (single line or textarea) and
// `obibaSimpleMde` (markdown editor), values are `{ en: "...", fr: "..." }`.
const schema = {
  type: 'object',
  properties: {
    name: { type: 'object', format: 'localizedString', title: 'Name', description: 'Required in every language' },
    acronym: { type: 'object', format: 'localizedString', title: 'Acronym' },
    description: { type: 'object', format: 'localizedString', title: 'Description' },
    objectives: { type: 'object', format: 'obibaSimpleMde', title: 'Objectives' },
    notes: { type: 'string', format: 'markdown', title: 'Notes (plain markdown string)' },
  },
  required: ['name'],
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'VerticalLayout',
      options: { class: 'row q-col-gutter-md' },
      elements: [
        { type: 'Control', scope: '#/properties/name', options: { class: 'col-12 col-md-8' } },
        { type: 'Control', scope: '#/properties/acronym', options: { class: 'col-12 col-md-4' } },
      ],
    },
    { type: 'Control', scope: '#/properties/description', options: { rows: 3 } },
    { type: 'Control', scope: '#/properties/objectives', options: { rows: 5, marked: true } },
    { type: 'Control', scope: '#/properties/notes', options: { rows: 4 } },
  ],
};
</script>

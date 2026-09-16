<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">angular-schema-form converter</div>
    <div class="row q-col-gutter-md items-center q-mb-md">
      <div class="col-12 col-md-4">
        <q-select
          v-model="fixtureName"
          :options="fixtureNames"
          label="Mica default form"
          dense
          outlined
          clearable
          @update:model-value="loadFixture"
        />
      </div>
      <div class="col-auto">
        <q-toggle v-model="translate" label="Resolve t() with vue-i18n" />
      </div>
      <div class="col-auto">
        <q-toggle v-model="formReadonly" :label="t('readonly')" />
      </div>
      <div class="col-auto">
        <q-btn color="primary" label="Convert" @click="convertNow" />
      </div>
    </div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-5">
        <q-tabs v-model="tabInput" align="left" dense>
          <q-tab name="schema" label="ASF schema" />
          <q-tab name="definition" label="ASF definition" />
          <q-tab name="uischema" label="UI schema (output)" />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="tabInput" animated>
          <q-tab-panel name="schema" class="q-px-none">
            <q-input v-model="schemaText" filled type="textarea" autogrow input-style="font-family: monospace; font-size: 12px" />
          </q-tab-panel>
          <q-tab-panel name="definition" class="q-px-none">
            <q-input v-model="definitionText" filled type="textarea" autogrow input-style="font-family: monospace; font-size: 12px" />
          </q-tab-panel>
          <q-tab-panel name="uischema" class="q-px-none">
            <pre class="q-ma-none q-pa-md"><code class="language-json" v-prism :key="uischemaText">{{ uischemaText }}</code></pre>
          </q-tab-panel>
        </q-tab-panels>
        <div v-if="parseError" class="text-negative q-mt-sm">{{ parseError }}</div>
        <div v-if="diagnostics.length" class="q-mt-sm">
          <div class="text-bold">Diagnostics</div>
          <ul class="q-mt-none">
            <li v-for="(diagnostic, index) in diagnostics" :key="index" :class="diagnostic.level === 'warn' ? 'text-warning' : 'text-grey-7'">
              <code>{{ diagnostic.level }}</code> {{ diagnostic.message }}
              <span v-if="diagnostic.key">(<code>{{ diagnostic.key }}</code>)</span>
            </li>
          </ul>
        </div>
        <div v-else-if="result" class="text-positive q-mt-sm">No diagnostics</div>
      </div>
      <div class="col-12 col-md-7">
        <QJsonForm
          v-if="result"
          v-model="formData"
          v-model:errors="formErrors"
          :schema="result.schema"
          :uischema="result.uischema"
          :readonly="formReadonly"
          :languages="['en', 'fr']"
          :config="config"
        />
        <pre class="bg-grey-10 text-white q-pa-md q-mt-md"><code>{{ formData }}</code></pre>
        <div v-if="formErrors.length" class="text-negative">
          <div class="text-bold">{{ t('errors') }}</div>
          <ul class="q-mt-none">
            <li v-for="(error, index) in formErrors" :key="index">
              <code>{{ error.instancePath || '/' }}</code> {{ error.keyword }}: {{ error.message }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { QJsonForm, countryCodes } from '../../../src/vue-plugin';
import { convert } from '../../../src/asf';
import type { AsfConvertResult, AsfDiagnostic } from '../../../src/asf';

const { t, te } = useI18n();

// the 13 Mica default forms used as converter fixtures
const fixtures = import.meta.glob('../../../test/fixtures/asf/*.json', { eager: true, import: 'default' }) as Record<string, { schema: any; definition: any }>;
const fixtureNames = Object.keys(fixtures)
  .map((path) => path.replace(/^.*\//, '').replace(/\.json$/, ''))
  .sort();

const sample = {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name' },
      email: { type: 'string', title: 'Email', pattern: '^\\S+@\\S+$' },
      abstract: { type: 'string', title: 'Abstract' },
      hasNoStaff: { type: 'boolean', title: 'No staff involved' },
      staff: {
        type: 'array',
        maxItems: 3,
        items: { type: 'object', properties: { name: { type: 'string', title: 'Name' }, role: { type: 'string', title: 'Role', enum: ['pi', 'student'] } }, required: ['name'] },
      },
      design: { type: 'string', title: 'Design', enum: ['cohort', 'other'] },
      otherDesign: { type: 'object', format: 'localizedString', title: 'Other design' },
    },
    required: ['name'],
  },
  definition: [
    { type: 'help', helpvalue: '<h3>Applicant</h3>' },
    {
      type: 'section',
      htmlClass: 'row',
      items: [
        { type: 'section', htmlClass: 'col-xs-6', items: ['name'] },
        { type: 'section', htmlClass: 'col-xs-6', items: ['email'] },
      ],
    },
    { key: 'abstract', type: 'textarea', wordLimit: '0:20', validationMessage: { wordLimitError: 'The 20 words limit has been exceeded.' } },
    'hasNoStaff',
    {
      key: 'staff',
      add: 'New',
      style: { add: 'btn-info' },
      notitle: true,
      condition: '!model.hasNoStaff',
      items: ['staff[].name', { key: 'staff[].role', type: 'radios', titleMap: [{ value: 'pi', name: 'Principal investigator' }, { value: 'student', name: 'Student' }] }],
    },
    { key: 'design', type: 'radios', titleMap: [{ value: 'cohort', name: 'Cohort' }, { value: 'other', name: 'Other' }] },
    { key: 'otherDesign', type: 'localizedstring', rows: 2, condition: "model.design == 'other'" },
    { key: 'unknownKey' },
  ],
};

const fixtureName = ref<string | null>(null);
const translate = ref(false);
const formReadonly = ref(false);
const tabInput = ref('definition');
const schemaText = ref(JSON.stringify(sample.schema, null, 2));
const definitionText = ref(JSON.stringify(sample.definition, null, 2));
const parseError = ref<string | undefined>(undefined);
const result = ref<AsfConvertResult | undefined>(undefined);
const diagnostics = ref<AsfDiagnostic[]>([]);
const formData = ref<Record<string, any>>({});
const formErrors = ref<any[]>([]);
const config = { countries: countryCodes };

const uischemaText = computed(() => (result.value ? JSON.stringify(result.value.uischema, null, 2) : ''));

function loadFixture(name: string | null) {
  if (!name) return;
  const path = Object.keys(fixtures).find((p) => p.endsWith(`/${name}.json`));
  if (!path) return;
  schemaText.value = JSON.stringify(fixtures[path]!.schema, null, 2);
  definitionText.value = JSON.stringify(fixtures[path]!.definition, null, 2);
  convertNow();
}

function convertNow() {
  parseError.value = undefined;
  try {
    const schema = JSON.parse(schemaText.value);
    const definition = JSON.parse(definitionText.value);
    result.value = convert(schema, definition, {
      translate: translate.value ? (key) => (te(key) ? t(key) : key) : undefined,
      logger: false,
    });
    diagnostics.value = result.value.diagnostics;
    formData.value = {};
  } catch (error) {
    parseError.value = String(error);
  }
}

convertNow();
</script>

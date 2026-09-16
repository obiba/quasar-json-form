<template>
  <div class="doc-wide doc-playground">
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
        <q-toggle v-model="readonly" :label="t('readonly')" />
      </div>
      <div class="col-auto">
        <q-btn color="primary" label="Convert" unelevated @click="convertNow" />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-5">
        <q-tabs v-model="tab" dense align="left" active-color="primary" narrow-indicator no-caps>
          <q-tab name="schema" label="ASF schema" />
          <q-tab name="definition" label="ASF definition" />
          <q-tab name="outSchema" label="Schema" icon="arrow_forward" />
          <q-tab name="outUischema" label="UI schema" icon="arrow_forward" />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="tab" animated class="bg-transparent">
          <q-tab-panel name="schema" class="q-px-none">
            <q-input v-model="schemaText" filled type="textarea" autogrow class="doc-editor" />
          </q-tab-panel>
          <q-tab-panel name="definition" class="q-px-none">
            <q-input v-model="definitionText" filled type="textarea" autogrow class="doc-editor" />
          </q-tab-panel>
          <q-tab-panel name="outSchema" class="q-pa-none">
            <DocCode :code="result ? JSON.stringify(result.schema, null, 2) : ''" />
          </q-tab-panel>
          <q-tab-panel name="outUischema" class="q-pa-none">
            <DocCode :code="result ? JSON.stringify(result.uischema, null, 2) : ''" />
          </q-tab-panel>
        </q-tab-panels>
        <div v-if="parseError" class="text-negative q-mt-sm">{{ parseError }}</div>
        <q-card v-if="result" flat bordered class="q-mt-md">
          <q-card-section class="q-py-sm bg-grey-2 text-subtitle2">
            Diagnostics
            <q-badge :color="diagnostics.length ? 'warning' : 'positive'" class="q-ml-sm">{{ diagnostics.length }}</q-badge>
          </q-card-section>
          <q-separator />
          <q-list v-if="diagnostics.length" dense separator>
            <q-item v-for="(diagnostic, index) in diagnostics" :key="index">
              <q-item-section avatar>
                <q-icon :name="diagnostic.level === 'warn' ? 'warning' : 'info'" :color="diagnostic.level === 'warn' ? 'warning' : 'grey-7'" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ diagnostic.message }}</q-item-label>
                <q-item-label v-if="diagnostic.key" caption><code>{{ diagnostic.key }}</code></q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-card-section v-else class="text-positive">Everything was converted.</q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-7">
        <q-card flat bordered>
          <q-card-section>
            <QJsonForm
              v-if="result"
              :key="formKey"
              v-model="data"
              v-model:errors="errors"
              :schema="result.schema"
              :uischema="result.uischema"
              :readonly="readonly"
              :languages="['en', 'fr']"
              :config="config"
            />
          </q-card-section>
          <q-separator />
          <q-tabs v-model="outputTab" dense align="left" active-color="primary" narrow-indicator>
            <q-tab name="data" :label="t('data')" />
            <q-tab name="errors">
              <div class="row items-center no-wrap q-gutter-x-xs">
                <span>{{ t('errors') }}</span>
                <q-badge v-if="errors.length" rounded color="negative">{{ errors.length }}</q-badge>
              </div>
            </q-tab>
          </q-tabs>
          <q-separator />
          <q-tab-panels v-model="outputTab" animated class="bg-transparent">
            <q-tab-panel name="data" class="q-pa-none">
              <DocCode :code="JSON.stringify(data, null, 2)" />
            </q-tab-panel>
            <q-tab-panel name="errors" class="q-pa-none">
              <DocCode v-if="errors.length" :code="JSON.stringify(errors, null, 2)" />
              <div v-else class="q-pa-md text-grey-7">{{ t('no_errors') }}</div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { QJsonForm, countryCodes, convertAsf } from 'ui'
import type { AsfConvertResult, AsfDiagnostic } from 'ui'
import DocCode from './DocCode.vue'

const { t, te } = useI18n()

// the 13 default Mica forms, the acceptance fixtures of the converter (ui/test/fixtures/asf)
const fixtures = import.meta.glob<{ schema: any; definition: any }>('../../../ui/test/fixtures/asf/*.json', { import: 'default' })
const fixtureNames = Object.keys(fixtures)
  .map((path) => path.replace(/^.*\//, '').replace(/\.json$/, ''))
  .sort()

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
        items: {
          type: 'object',
          properties: { name: { type: 'string', title: 'Name' }, role: { type: 'string', title: 'Role', enum: ['pi', 'student'] } },
          required: ['name'],
        },
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
}

const fixtureName = ref<string | null>(null)
const translate = ref(false)
const readonly = ref(false)
const tab = ref('definition')
const outputTab = ref('data')
const schemaText = ref(JSON.stringify(sample.schema, null, 2))
const definitionText = ref(JSON.stringify(sample.definition, null, 2))
const parseError = ref<string | undefined>(undefined)
const result = ref<AsfConvertResult | undefined>(undefined)
const diagnostics = ref<AsfDiagnostic[]>([])
const data = ref<Record<string, any>>({})
const errors = ref<any[]>([])
const formKey = ref(0)
const config = { countries: countryCodes }

async function loadFixture (name: string | null) {
  if (!name) return
  const path = Object.keys(fixtures).find((p) => p.endsWith(`/${name}.json`))
  if (!path) return
  const fixture = await fixtures[path]!()
  schemaText.value = JSON.stringify(fixture.schema, null, 2)
  definitionText.value = JSON.stringify(fixture.definition, null, 2)
  convertNow()
}

function convertNow () {
  parseError.value = undefined
  try {
    const schema = JSON.parse(schemaText.value)
    const definition = JSON.parse(definitionText.value)
    result.value = convertAsf(schema, definition, {
      translate: translate.value ? (key) => (te(key) ? t(key) : key) : undefined,
      logger: false,
    })
    diagnostics.value = result.value.diagnostics
    data.value = {}
    formKey.value++
  } catch (error) {
    parseError.value = String(error)
  }
}

convertNow()
</script>

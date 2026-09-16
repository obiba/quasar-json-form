<template>
  <div class="doc-wide doc-playground">
    <div class="row q-col-gutter-md items-center q-mb-md">
      <div class="col-12 col-md-4">
        <q-select
          v-model="exampleName"
          :options="exampleNames"
          label="Load an example of this site"
          dense
          outlined
          clearable
          use-input
          input-debounce="0"
          @filter="filterExamples"
          @update:model-value="loadExample"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-select v-model="validationMode" :options="validationModes" label="Validation mode" dense outlined />
      </div>
      <div class="col-12 col-md-3">
        <q-input v-model="languagesText" label="Languages" dense outlined placeholder="en, fr" />
      </div>
      <div class="col-auto">
        <q-toggle v-model="readonly" :label="t('readonly')" />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-5">
        <q-tabs v-model="tab" dense align="left" active-color="primary" narrow-indicator>
          <q-tab name="schema" :label="t('schema')" />
          <q-tab name="uischema" :label="t('uischema')" />
          <q-tab name="data" :label="t('data')" />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="tab" animated class="bg-transparent">
          <q-tab-panel name="schema" class="q-px-none">
            <q-input v-model="schemaText" filled type="textarea" autogrow class="doc-editor" :error="!!schemaError" :error-message="schemaError" />
          </q-tab-panel>
          <q-tab-panel name="uischema" class="q-px-none">
            <div class="text-caption text-grey-7 q-mb-xs">Leave empty to generate one control per property.</div>
            <q-input v-model="uischemaText" filled type="textarea" autogrow class="doc-editor" :error="!!uischemaError" :error-message="uischemaError" />
          </q-tab-panel>
          <q-tab-panel name="data" class="q-px-none">
            <div class="text-caption text-grey-7 q-mb-xs">Initial data, applied with the button (the live data is shown under the form).</div>
            <q-input v-model="dataText" filled type="textarea" autogrow class="doc-editor" :error="!!dataError" :error-message="dataError" />
            <q-btn color="primary" label="Apply data" size="sm" class="q-mt-sm" unelevated @click="applyData" />
          </q-tab-panel>
        </q-tab-panels>
      </div>

      <div class="col-12 col-md-7">
        <q-card flat bordered>
          <q-card-section>
            <QJsonForm
              :key="formKey"
              v-model="data"
              v-model:errors="errors"
              :schema="schema"
              :uischema="uischema"
              :readonly="readonly"
              :validation-mode="validationMode"
              :languages="languages"
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { QJsonForm, countryCodes } from 'ui'
import DocCode from './DocCode.vue'
import type { DocExampleDef } from '../examples/types'

const { t } = useI18n()

const modules = import.meta.glob<{ default: DocExampleDef }>('../examples/**/*.ts', { eager: true })
const allExampleNames = Object.keys(modules)
  .map((path) => path.replace('../examples/', '').replace('.ts', ''))
  .filter((name) => name !== 'types')
  .sort()
const exampleNames = ref(allExampleNames)
const exampleName = ref<string | null>(null)

const validationModes = ['ValidateAndShow', 'ValidateAndHide', 'NoValidation'] as const
const validationMode = ref<(typeof validationModes)[number]>('ValidateAndShow')
const readonly = ref(false)
const languagesText = ref('en, fr')
const languages = computed(() => languagesText.value.split(',').map((s) => s.trim()).filter((s) => s.length > 0))
const config = { countries: countryCodes }

const starter: DocExampleDef = {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Name', minLength: 2 },
      email: { type: 'string', title: 'Email', format: 'email' },
      role: { type: 'string', title: 'Role', enum: ['user', 'editor', 'admin'] },
      notes: { type: 'string', title: 'Notes' },
    },
    required: ['name'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'HorizontalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/name' },
          { type: 'Control', scope: '#/properties/email' },
        ],
      },
      { type: 'Control', scope: '#/properties/role', options: { format: 'radio', inline: true } },
      { type: 'Control', scope: '#/properties/notes', options: { rows: 3 } },
    ],
  },
  data: { name: 'Ada' },
}

const tab = ref('schema')
const outputTab = ref('data')
const schemaText = ref('')
const uischemaText = ref('')
const dataText = ref('')
const schemaError = ref('')
const uischemaError = ref('')
const dataError = ref('')

const schema = ref<Record<string, unknown>>({})
const uischema = ref<Record<string, unknown> | undefined>(undefined)
const data = ref<Record<string, unknown>>({})
const errors = ref<any[]>([])
const formKey = ref(0)

function parse (text: string, error: { value: string }): Record<string, unknown> | undefined | null {
  if (!text.trim()) {
    error.value = ''
    return undefined
  }
  try {
    const parsed = JSON.parse(text)
    error.value = ''
    return parsed
  } catch (e) {
    error.value = `${t('invalid_json')}: ${(e as Error).message}`
    return null
  }
}

function load (example: DocExampleDef) {
  schemaText.value = JSON.stringify(example.schema, null, 2)
  uischemaText.value = example.uischema ? JSON.stringify(example.uischema, null, 2) : ''
  dataText.value = JSON.stringify(example.data ?? {}, null, 2)
  schema.value = example.schema
  uischema.value = example.uischema
  data.value = structuredClone(example.data ?? {})
  readonly.value = example.readonly ?? false
  validationMode.value = example.validationMode ?? 'ValidateAndShow'
  if (example.languages) {
    languagesText.value = (Array.isArray(example.languages) ? example.languages : Object.keys(example.languages)).join(', ')
  }
  formKey.value++
}

function loadExample (name: string | null) {
  if (!name) return
  const example = modules[`../examples/${name}.ts`]?.default
  if (example) load(example)
}

function filterExamples (needle: string, update: (fn: () => void) => void) {
  update(() => {
    const search = needle.toLowerCase()
    exampleNames.value = allExampleNames.filter((name) => name.includes(search))
  })
}

function applyData () {
  const parsed = parse(dataText.value, dataError)
  if (parsed !== null) {
    data.value = parsed ?? {}
    formKey.value++
  }
}

let timer: ReturnType<typeof setTimeout> | undefined
function debounced (fn: () => void) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(fn, 300)
}

watch(schemaText, (text) => debounced(() => {
  const parsed = parse(text, schemaError)
  if (parsed) schema.value = parsed
}))
watch(uischemaText, (text) => debounced(() => {
  const parsed = parse(text, uischemaError)
  if (parsed !== null) uischema.value = parsed
}))

load(starter)
</script>

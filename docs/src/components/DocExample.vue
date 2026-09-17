<template>
  <q-card flat bordered class="doc-example q-my-md">
    <q-card-section v-if="title" class="row items-center q-py-sm doc-card-header">
      <div class="text-subtitle2">{{ title }}</div>
      <q-space />
      <q-btn-toggle
        v-if="formLocales.length"
        v-model="locale"
        :options="formLocales"
        dense
        flat
        toggle-color="primary"
        size="sm"
        class="q-mr-sm"
      />
      <q-btn flat dense round size="sm" :icon="showSource ? 'code_off' : 'code'" @click="showSource = !showSource">
        <q-tooltip>{{ showSource ? t('form') : t('schema') }}</q-tooltip>
      </q-btn>
    </q-card-section>
    <q-separator v-if="title" />

    <q-card-section v-if="example">
      <QJsonForm
        :model-value="data"
        v-model:errors="errors"
        :schema="schema"
        :uischema="uischema"
        :readonly="readonly"
        :validation-mode="example.validationMode"
        :languages="example.languages"
        :translations="example.translations"
        :locale="locale"
        :config="example.config"
        :renderers="example.renderers"
        @update:model-value="onDataUpdate"
      />
    </q-card-section>
    <q-card-section v-else class="text-negative">Example not found: {{ name }}</q-card-section>

    <q-slide-transition>
      <div v-show="showSource">
        <q-separator />
        <q-tabs v-model="tab" dense align="left" active-color="primary" narrow-indicator>
          <q-tab name="schema" :label="t('schema')" />
          <q-tab name="uischema" :label="t('uischema')" />
          <q-tab name="data" :label="t('data')" />
          <q-tab name="errors">
            <div class="row items-center no-wrap q-gutter-x-xs">
              <span>{{ t('errors') }}</span>
              <q-badge v-if="errors.length" rounded color="negative">{{ errors.length }}</q-badge>
            </div>
          </q-tab>
          <q-tab v-if="example?.configCode" name="config" :label="t('config')" />
          <q-tab v-if="example?.code" name="code" :label="t('code')" />
          <q-space />
          <q-toggle v-model="readonly" :label="t('readonly')" dense size="sm" class="q-mr-md" />
          <q-toggle v-model="editing" :label="t('edit')" dense size="sm" class="q-mr-sm" />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="tab" animated class="bg-transparent">
          <q-tab-panel name="schema" class="q-pa-none">
            <q-input v-if="editing" v-model="schemaStr" type="textarea" filled autogrow square :error="!!schemaError" :error-message="schemaError" />
            <DocCode v-else :code="schemaCode" />
          </q-tab-panel>
          <q-tab-panel name="uischema" class="q-pa-none">
            <q-input v-if="editing" v-model="uischemaStr" type="textarea" filled autogrow square :error="!!uischemaError" :error-message="uischemaError" />
            <DocCode v-else :code="uischemaCode" />
          </q-tab-panel>
          <q-tab-panel name="data" class="q-pa-none">
            <DocCode :code="JSON.stringify(data, null, 2)" />
          </q-tab-panel>
          <q-tab-panel name="config" class="q-pa-none">
            <DocCode :code="example?.configCode ?? ''" lang="javascript" />
          </q-tab-panel>
          <q-tab-panel name="code" class="q-pa-none">
            <DocCode :code="example?.code ?? ''" lang="javascript" />
          </q-tab-panel>
          <q-tab-panel name="errors" class="q-pa-none">
            <DocCode v-if="errors.length" :code="JSON.stringify(errors, null, 2)" />
            <div v-else class="q-pa-md text-grey-7">{{ t('no_errors') }}</div>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </q-slide-transition>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { QJsonForm } from 'ui'
import DocCode from './DocCode.vue'
import type { DocExampleDef } from '../examples/types'

const props = defineProps<{ name: string; title?: string; source?: boolean }>()
const { t } = useI18n()

// every example, keyed by `group/name`
const modules = import.meta.glob<{ default: DocExampleDef }>('../examples/**/*.ts', { eager: true })
const example = computed<DocExampleDef | undefined>(() => modules[`../examples/${props.name}.ts`]?.default)

const data = ref<Record<string, unknown>>(structuredClone(example.value?.data ?? {}))
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errors = ref<any[]>([])
const showSource = ref(props.source ?? false)
const readonly = ref(example.value?.readonly ?? false)
// the languages of the embedded translations, switched with the header toggle
const formLocales = computed(() => Object.keys(example.value?.translations ?? {}).map((code) => ({ label: code.toUpperCase(), value: code })))
const locale = ref<string | undefined>(example.value?.locale)
const editing = ref(false)
const tab = ref('schema')

const schema = ref<Record<string, unknown>>(example.value?.schema ?? {})
const uischema = ref<Record<string, unknown> | undefined>(example.value?.uischema)
// displayed sources: live, since the example's `onUpdate` may rewrite the schema
const schemaCode = computed(() => JSON.stringify(schema.value, null, 2))
const uischemaCode = computed(() => uischema.value ? JSON.stringify(uischema.value, null, 2) : '')

// edit buffers, refreshed from the live sources when editing starts
const schemaStr = ref(schemaCode.value)
const uischemaStr = ref(uischemaCode.value)
const schemaError = ref('')
const uischemaError = ref('')
watch(editing, (on) => {
  if (!on) return
  schemaStr.value = schemaCode.value
  uischemaStr.value = uischemaCode.value
})

function onDataUpdate (value: Record<string, unknown>) {
  const onUpdate = example.value?.onUpdate
  if (!onUpdate) {
    data.value = value
    return
  }
  const next = { ...value }
  onUpdate(next, schema.value)
  // the form emits its data on every change of its inputs, including the one
  // caused by this assignment: apply it only when the hook produced new data
  if (JSON.stringify(next) !== JSON.stringify(data.value)) data.value = next
}

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

watch(schemaStr, (text) => {
  const parsed = parse(text, schemaError)
  if (parsed) schema.value = parsed
})
watch(uischemaStr, (text) => {
  const parsed = parse(text, uischemaError)
  if (parsed !== null) uischema.value = parsed
})
</script>

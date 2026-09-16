<template>
  <q-card flat bordered class="q-my-md">
    <q-card-section>
      <q-input v-model="condition" label="angular-schema-form condition" dense outlined class="doc-editor" :error="!!error" :error-message="error">
        <template #prepend><q-icon name="code" /></template>
      </q-input>
      <div class="q-mt-sm row q-gutter-xs">
        <q-chip v-for="sample in samples" :key="sample" clickable dense size="sm" @click="condition = sample">{{ sample }}</q-chip>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section class="q-py-sm doc-card-header text-subtitle2">filtrex rule</q-card-section>
    <DocCode :code="output" lang="javascript" />
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { transpileAsfCondition } from 'ui'
import DocCode from './DocCode.vue'

const samples = [
  "model.design == 'other'",
  '!model.hasNoStaff',
  'model.a.b === true && model.count > 2',
  "model.list.indexOf('x') >= 0",
  'model.list.length > 0 || model.other == null',
  'model.value === undefined',
]

const condition = ref(samples[0]!)
const error = ref('')

const output = computed(() => {
  try {
    const rule = transpileAsfCondition(condition.value)
    error.value = ''
    return rule
  } catch (e) {
    error.value = (e as Error).message
    return ''
  }
})
</script>

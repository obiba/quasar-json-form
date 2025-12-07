<template>
  <div class="row q-col-gutter-md">
    <div class="col">
      <q-tabs v-model="tabDesign" align="left">
        <q-tab name="schema" label="Schema" />
        <q-tab name="layout" label="Layout" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="tabDesign" animated>
        <q-tab-panel name="schema" class="q-pl-none q-pr-none">
          <pre
            v-if="readonly"
            class="q-ma-none q-pa-md"
          ><code class="language-json" v-prism>{{ formSchemaStr }}</code></pre>
          <q-input
            v-else
            filled
            v-model="formSchemaStr"
            type="textarea"
            color="black"
            autogrow
            style="min-height: 300px"
          />
        </q-tab-panel>
        <q-tab-panel name="layout" class="q-pl-none q-pr-none">
          <pre
            v-if="readonly"
            class="q-ma-none q-pa-md"
          ><code class="language-json" v-prism>{{ formUischemaStr }}</code></pre>
          <q-input
            v-else
            filled
            v-model="formUischemaStr"
            type="textarea"
            color="black"
            autogrow
            style="min-height: 300px"
          />
        </q-tab-panel>
      </q-tab-panels>
    </div>
    <div class="col">
      <q-tabs v-model="tabPreview" align="left">
        <q-tab name="form" label="Form" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="tabPreview" animated>
        <q-tab-panel name="form" class="q-pl-none q-pr-none">
          <QJsonForm v-model="formData" :schema="formSchema" :uischema="formUischema" />
          <pre class="bg-grey-10 text-white q-pa-md"><code>{{ formData }}</code></pre>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import QJsonForm from '../../../src/components/QJsonForm.js';

const props = defineProps({
  data: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  schema: {
    type: Object,
    required: true,
  },
  uischema: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  readonly: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const formData = ref(props.data);
const formSchemaStr = ref(JSON.stringify(props.schema, null, 2));
const formUischemaStr = ref(JSON.stringify(props.uischema, null, 2));
const tabDesign = ref('schema');
const tabPreview = ref('form');

const formSchema = computed(() => JSON.parse(formSchemaStr.value));
const formUischema = computed(() => JSON.parse(formUischemaStr.value));
</script>

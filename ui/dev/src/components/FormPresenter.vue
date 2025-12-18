<template>
  <div class="row q-col-gutter-md">
    <div class="col">
      <q-tabs v-model="tabDesign" align="left">
        <q-tab name="schema" :label="t('schema')" />
        <q-tab name="layout" :label="t('layout')" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="tabDesign" animated>
        <q-tab-panel name="schema" class="q-pl-none q-pr-none">
          <pre
            v-if="readonly"
            class="q-ma-none q-pa-md"
          ><code class="language-json" v-prism :key="formSchemaStr">{{ formSchemaStr }}</code></pre>
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
          ><code class="language-json" v-prism :key="formUischemaStr">{{ formUischemaStr }}</code></pre>
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
        <q-tab name="form" :label="t('form')" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="tabPreview" animated>
        <q-tab-panel name="form" class="q-pl-none q-pr-none">
          <QJsonForm v-model="formData" :schema="props.schema" :uischema="props.uischema" @update:modelValue="onDataUpdate" />
          <pre class="bg-grey-10 text-white q-pa-md"><code>{{ formData }}</code></pre>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { QJsonForm } from 'ui';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

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

const emit = defineEmits(['update:data']);

const formData = ref(props.data);
const formSchemaStr = ref(JSON.stringify(props.schema, null, 2));
const formUischemaStr = ref(JSON.stringify(props.uischema, null, 2));
const tabDesign = ref('schema');
const tabPreview = ref('form');

const onDataUpdate = (newData) => {
  formData.value = newData;
  emit('update:data', newData);
  formSchemaStr.value = JSON.stringify(props.schema, null, 2);
  formUischemaStr.value = JSON.stringify(props.uischema, null, 2);
};
</script>

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
            v-if="props.readonly"
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
            v-if="props.readonly"
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
          <QJsonForm
            v-model="formData"
            v-model:errors="formErrors"
            :schema="props.schema"
            :uischema="props.uischema"
            :readonly="props.formReadonly"
            :validation-mode="props.validationMode"
            :languages="props.languages"
            :config="props.config"
            @update:modelValue="onDataUpdate"
          />
          <pre class="bg-grey-10 text-white q-pa-md"><code>{{ formData }}</code></pre>
          <div v-if="formErrors.length" class="text-negative">
            <div class="text-bold">{{ t('errors') }}</div>
            <ul class="q-mt-none">
              <li v-for="(error, index) in formErrors" :key="index">
                <code>{{ error.instancePath || '/' }}</code> {{ error.keyword }}: {{ error.message }}
              </li>
            </ul>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QJsonForm } from '../../../src/vue-plugin';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface FormPresenterProps {
  data?: Record<string, unknown>;
  schema: Record<string, unknown>;
  uischema?: Record<string, unknown>;
  readonly?: boolean;
  formReadonly?: boolean;
  validationMode?: 'ValidateAndShow' | 'ValidateAndHide' | 'NoValidation';
  languages?: string[] | Record<string, string>;
  config?: Record<string, unknown>;
}

const props = withDefaults(defineProps<FormPresenterProps>(), {
  data: () => ({}),
  uischema: () => ({}),
  readonly: false,
  formReadonly: false,
  validationMode: 'ValidateAndShow',
  languages: undefined,
  config: undefined,
});

const emit = defineEmits<{
  (e: 'update:data', data: Record<string, unknown>): void;
}>();

const formData = ref<Record<string, unknown>>(props.data);
const formErrors = ref<Array<{ instancePath: string; keyword: string; message?: string }>>([]);
const formSchemaStr = ref(JSON.stringify(props.schema, null, 2));
const formUischemaStr = ref(JSON.stringify(props.uischema, null, 2));
const tabDesign = ref('schema');
const tabPreview = ref('form');

const onDataUpdate = (newData: Record<string, unknown>) => {
  formData.value = newData;
  emit('update:data', newData);
  formSchemaStr.value = JSON.stringify(props.schema, null, 2);
  formUischemaStr.value = JSON.stringify(props.uischema, null, 2);
};
</script>

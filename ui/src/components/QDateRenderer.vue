<template>
  <q-input
    v-if="isVisible"
    :model-value="control.data"
    @update:model-value="onChange"
    :label="control.label"
    :error="hasError"
    :error-message="errorMessage"
    :required="control.required"
    :disable="!isEnabled"
    :hint="control.description || hint"
    v-bind="componentProps"
  >
    <template v-slot:append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date :model-value="control.data" mask="YYYY-MM-DD" @update:model-value="onChange">
            <div class="row items-center justify-end">
              <q-btn v-close-popup :label="t('close')" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { useControlRules } from '../composables/useControlRules';

const { t } = useI18n();

const props = defineProps(rendererProps());
import { ControlElement } from '@jsonforms/core';

const controlResult = useJsonFormsControl({
  ...props,
  uischema: props.uischema as ControlElement,
});

const control = controlResult.control;

// Use the generic control rules composable
const { isVisible, isEnabled, hasError, errorMessage, hint, componentProps } =
  useControlRules(control);

watch(
  () => isVisible.value,
  (newValue: boolean) => {
    if (newValue === false) {
      onChange(undefined);
    }
  },
);

const onChange = (value: string | number | null | undefined) => {
  controlResult.handleChange(control.value.path, value);
};
</script>

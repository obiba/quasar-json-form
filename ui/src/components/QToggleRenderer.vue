<template>
  <q-toggle
    v-if="isVisible"
    :model-value="control.data"
    @update:model-value="onChange"
    :label="control.label"
    :error="hasError"
    :error-message="errorMessage"
    :required="control.required"
    :disable="!isEnabled"
    v-bind="componentProps"
  />
  <div v-if="control.description" class="text-caption text-grey-7">{{ control.description }}</div>
  <div v-if="hint" class="text-caption text-grey-7">{{ hint }}</div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { useControlRules } from '../composables/useControlRules';

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

const onChange = (value: boolean | null | undefined) => {
  controlResult.handleChange(control.value.path, value);
};
</script>

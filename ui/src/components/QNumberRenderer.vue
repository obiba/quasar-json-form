<template>
  <q-input
    v-if="isVisible"
    :model-value="control.data"
    type="number"
    @update:model-value="onChange"
    :label="control.label"
    :error="hasError"
    :error-message="errorMessage"
    :required="control.required"
    :disable="!isEnabled"
    :hint="control.description || hint"
    v-bind="componentProps"
  />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { ControlElement } from '@jsonforms/core';
import { useControlRules } from '../composables/useControlRules';

const props = defineProps(rendererProps());

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
  controlResult.handleChange(control.value.path, Number(value));
};
</script>

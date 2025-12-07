<template>
  <div class="q-mb-md">
    <q-select
      v-if="isVisible"
      :model-value="control.data"
      @update:model-value="onChange"
      :options="options"
      :label="control.label"
      :error="hasError"
      :error-message="errorMessage"
      :required="control.required"
      :disable="!isEnabled"
      :hint="control.description || hint"
      emit-value
      map-options
      v-bind="componentProps"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
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

// Transform enum values into q-select options
const options = computed(() => {
  const schema = controlResult.control.value.schema;

  if (!schema.enum) {
    return [];
  }

  return schema.enum.map((value: string | number) => ({
    label: String(value),
    value: value,
  }));
});

watch(
  () => isVisible.value,
  (newValue: boolean) => {
    if (newValue === false) {
      onChange(undefined);
    }
  },
);

const onChange = (value: string | number | null | undefined) => {
  controlResult.handleChange(controlResult.control.value.path, value);
};
</script>

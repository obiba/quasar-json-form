<template>
  <div class="json-form-wrapper">
    <json-forms
      :data="modelValue"
      :schema="schema"
      :uischema="uischema"
      :renderers="renderers"
      @change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
import { provide, toRef } from 'vue';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import {
  rankWith,
  isStringControl,
  type UISchemaElement,
  isIntegerControl,
  isNumberControl,
  isBooleanControl,
  isEnumControl,
  isDateControl,
} from '@jsonforms/core';
import QStringRenderer from './QStringRenderer.vue';
import QNumRenderer from './QNumberRenderer.vue';
import QToggleRenderer from './QToggleRenderer.vue';
import QEnumRenderer from './QEnumRenderer.vue';
import QDateRenderer from './QDateRenderer.vue';

// Define your custom renderers
// Priority 3 - higher than default (usually 1-2)
const customRenderers = [
  {
    renderer: QStringRenderer,
    tester: rankWith(3, isStringControl),
  },
  {
    renderer: QNumRenderer,
    tester: rankWith(3, isIntegerControl),
  },
  {
    renderer: QNumRenderer,
    tester: rankWith(3, isNumberControl),
  },
  {
    renderer: QToggleRenderer,
    tester: rankWith(3, isBooleanControl),
  },
  {
    renderer: QEnumRenderer,
    tester: rankWith(4, isEnumControl), // Higher priority than String control
  },
  {
    renderer: QDateRenderer,
    tester: rankWith(4, isDateControl),
  },
];

// Combine custom renderers with default vanilla renderers
const renderers = Object.freeze([...vanillaRenderers, ...customRenderers]);

const props = defineProps({
  modelValue: {
    type: Object,
    required: false,
    default: () => ({}),
  },
  schema: {
    type: Object,
    required: true,
  },
  uischema: {
    type: Object as () => UISchemaElement,
    required: false,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:modelValue']);

// Provide form data to all child renderers
provide('jsonforms-data', toRef(props, 'modelValue'));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onChange = (event: any) => {
  emit('update:modelValue', event.data);
};
</script>

<style>
@import '@jsonforms/vue-vanilla/vanilla.css';
</style>

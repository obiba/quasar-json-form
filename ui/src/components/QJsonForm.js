import { h, provide, toRef, defineComponent } from 'vue';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import {
  rankWith,
  isStringControl,
  isIntegerControl,
  isNumberControl,
  isBooleanControl,
  isEnumControl,
  isDateControl,
  optionIs,
  and,
  // isArrayObjectControl,
} from '@jsonforms/core';
import QStringRenderer from './QStringRenderer.js';
import QNumRenderer from './QNumberRenderer.js';
import QRatingRenderer from './QRatingRenderer.js';
import QToggleRenderer from './QToggleRenderer.js';
import QEnumRenderer from './QEnumRenderer.js';
import QDateRenderer from './QDateRenderer.js';
// import QListRenderer from './QListRenderer.js';

// Define your custom renderers
// Priority 3 - higher than default (usually 1-2)
const customRenderers = [
  {
    renderer: QStringRenderer,
    tester: rankWith(3, isStringControl),
  },
  {
    renderer: QRatingRenderer,
    tester: rankWith(3, and(isIntegerControl, optionIs('format', 'rating'))),
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
  // {
  //   renderer: QListRenderer,
  //   tester: rankWith(3, isArrayObjectControl),
  // },
];

// Combine custom renderers with default vanilla renderers
const renderers = Object.freeze([...vanillaRenderers, ...customRenderers]);

export default defineComponent({
  name: 'QJsonForm',
  props: {
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
      type: Object,
      required: false,
      default: () => ({}),
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // Provide form data to all child renderers
    provide('jsonforms-data', toRef(props, 'modelValue'));

    const onChange = (event) => {
      emit('update:modelValue', event.data);
    };

    return () => h('div', {
      class: 'json-form-wrapper',
    }, [
      h(JsonForms, {
        data: props.modelValue,
        schema: props.schema,
        uischema: props.uischema,
        renderers,
        onChange,
      }),
    ]);
  },
});

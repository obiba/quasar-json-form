import { h, provide, toRef, defineComponent, computed } from 'vue';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import '@jsonforms/vue-vanilla/vanilla.css';
import {
  rankWith,
  schemaMatches,
  schemaSubPathMatches,
  hasType,
  formatIs,
  optionIs,
  uiTypeIs,
  isStringControl,
  isIntegerControl,
  isNumberControl,
  isBooleanControl,
  isEnumControl,
  isOneOfEnumControl,
  isDateControl,
  isTimeControl,
  isDateTimeControl,
  and,
  or,
  // isArrayObjectControl,
} from '@jsonforms/core';
import QStringRenderer from './QStringRenderer.js';
import QNumRenderer from './QNumberRenderer.js';
import QRatingRenderer from './QRatingRenderer.js';
import QToggleRenderer from './QToggleRenderer.js';
import QSelectRenderer from './QSelectRenderer.js';
import QOptionsRenderer from './QOptionsRenderer.js';
import QDateRenderer from './QDateRenderer.js';
import QTimeRenderer from './QTimeRenderer.js';
import QDateTimeRenderer from './QDateTimeRenderer.js';
import QSectionRenderer from './QSectionRenderer.js';
import QLabelRenderer from './QLabelRenderer.js';
// import QListRenderer from './QListRenderer.js';

const hasOneOfItems = (schema) =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf).every((entry) => {
    return entry.const !== undefined;
  });
 
const hasEnumItems = (schema) =>
  schema.type === 'string' && schema.enum !== undefined;

const isFulltimeControl = and(
  uiTypeIs('Control'),
  or(formatIs('fulltime'), optionIs('format', 'fulltime'))
);

const isDateFulltimeControl = and(
  uiTypeIs('Control'),
  or(formatIs('date-fulltime'), optionIs('format', 'date-fulltime'))
);

const isMultiEnumControl = and(
  uiTypeIs('Control'),
  and(
    schemaMatches(
      (schema) =>
        hasType(schema, 'array') &&
        !Array.isArray(schema.items) &&
        schema.uniqueItems === true
    ),
    schemaSubPathMatches('items', (schema) => {
      return hasOneOfItems(schema) || hasEnumItems(schema);
    })
  )
);

// Define your custom renderers
// Priority 3 - higher than default (usually 1-2)
const customRenderers = [
  {
    renderer: QLabelRenderer,
    tester: rankWith(3, uiTypeIs('Label')),
  },
  {
    renderer: QSectionRenderer,
    tester: rankWith(1, uiTypeIs('Section')),
  },
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
    renderer: QOptionsRenderer,
    tester: rankWith(4, and(isEnumControl, optionIs('format', 'radio'))),
  },
  {
    renderer: QOptionsRenderer,
    tester: rankWith(6, and(isOneOfEnumControl, optionIs('format', 'radio'))),
  },
  {
    renderer: QOptionsRenderer,
    tester: rankWith(6, and(isMultiEnumControl, or(optionIs('format', 'checkbox'), optionIs('format', 'toggle')))),
  },
  {
    renderer: QSelectRenderer,
    tester: rankWith(4, isEnumControl),
  },
  {
    renderer: QSelectRenderer,
    tester: rankWith(6, isOneOfEnumControl),
  },
  {
    renderer: QSelectRenderer,
    tester: rankWith(6, isMultiEnumControl),
  },
  {
    renderer: QDateRenderer,
    tester: rankWith(4, isDateControl),
  },
  {
    renderer: QTimeRenderer,
    tester: rankWith(4, or(isTimeControl, isFulltimeControl)),
  },
  {
    renderer: QDateTimeRenderer,
    tester: rankWith(4, or(isDateTimeControl, isDateFulltimeControl)),
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

    const generateDefaultUISchema = (schema) => {
      if (!schema || !schema.properties) return { type: 'VerticalLayout', elements: [] };
      return {
        type: 'VerticalLayout',
        elements: Object.keys(schema.properties || {}).map((key) => ({
          type: 'Control',
          scope: `#/properties/${key}`,
        })),
      };
    };

    // if uiSchema is not provided, generate a default one
    const generatedUischema = computed(() => {
      return props.uischema && Object.keys(props.uischema).length > 0
        ? props.uischema
        : generateDefaultUISchema(props.schema);
    });

    return () => h('div', {
      class: 'json-form-wrapper',
    }, [
      h(JsonForms, {
        data: props.modelValue,
        schema: props.schema,
        uischema: generatedUischema.value,
        renderers,
        validationMode: 'NoValidation', // do not use built-in validation
        onChange,
      }),
    ]);
  },
});

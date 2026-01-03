import { h, provide, toRef, defineComponent, computed } from 'vue';
import { JsonForms } from '@jsonforms/vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';
import '@jsonforms/vue-vanilla/vanilla.css';
import qRenderers from '../utils/renderers.js';

// Combine custom renderers with default vanilla renderers
const renderers = Object.freeze([...vanillaRenderers, ...qRenderers]);

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

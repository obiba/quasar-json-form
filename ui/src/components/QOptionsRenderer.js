import { h, computed, watch, defineComponent, onMounted } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QOptionGroup } from 'quasar';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QOptionsRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();

    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    // Use the generic control rules composable
    const { isVisible, isEnabled, uiOptions } =
      useControlProperties(control);

    // Transform enum values into q-select options
    const options = computed(() => {
      const schema = controlResult.control.value.schema;

      if (schema.type === 'array' && schema.items) {
        const itemsSchema = schema.items;
        if (itemsSchema.oneOf && Array.isArray(itemsSchema.oneOf) && itemsSchema.oneOf.length > 0) {
          // for each enum option, check if it's an object with label and same value
          return itemsSchema.oneOf.map((val) => {
            return { label: t(String(val.title || val.const)), value: val.const };
          });
        }

        if (itemsSchema.enum) {
          return itemsSchema.enum.map((value) => ({
            label: t(String(value)),
            value: value,
          }));
        }
      }

      if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
        // for each enum option, check if it's an object with label and same value
        return schema.oneOf.map((val) => {
          return { label: t(String(val.title || val.const)), value: val.const };
        });
      }

      if (schema.enum) {
        return schema.enum.map((value) => ({
          label: t(String(value)),
          value: value,
        }));
      }

      return [];
    });

    const isMultiple = computed(() => {
      const schema = controlResult.control.value.schema;
      return schema.type === 'array';
    });

    onMounted(() => {
      // Ensure that for multiple selection, the value is always an array
      if (isMultiple.value && isVisible.value && !Array.isArray(control.value.data)) {
        onChange([]);
      }
    });

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined);
        }
      },
    );

    watch (
      () => control.value.data,
      (newValue) => {
        // Ensure that for multiple selection, the value is always an array
        if (isMultiple.value && isVisible.value && !Array.isArray(newValue)) {
          onChange([]);
        }
      }
    );

    const onChange = (value) => {
      controlResult.handleChange(controlResult.control.value.path, value);
    };

    return () => {
      if (!isVisible.value) {
        return null;
      }

      const children = [];

      if (control.value.label) {
        children.push(h('div', {
          class: 'text-label text-grey-7 q-mb-xs',
        }, t(control.value.label)));
      }

      if (control.value.description) {
        children.push(h('div', {
          class: 'text-description text-caption text-grey-7',
        }, t(control.value.description)));
      }

      children.push(
        h(QOptionGroup, {
          modelValue: control.value.data,
          options: options.value,
          type: isMultiple.value
            ? (uiOptions.value && uiOptions.value.format) || 'checkbox'
            : 'radio',
          disable: !isEnabled.value,
          'onUpdate:modelValue': onChange,
          ...uiOptions.value,
        }),
      );

      return h('div', { class: 'q-options-renderer' }, children);
    };
  },
});

import { h, computed, watch, defineComponent, onMounted, onUnmounted } from 'vue';
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
    const { isVisible, isEnabled, options, selectOptions, clearInvalidSelection, title, description } =
      useControlProperties(control);

    const isMultiple = computed(() => {
      const schema = controlResult.control.value.schema;
      return schema.type === 'array';
    });

    const onChange = (value) => {
      controlResult.handleChange(controlResult.control.value.path, value);
    };

    // Set up watch to clear invalid selections when options change
    const stopClearInvalidSelection = clearInvalidSelection(controlResult.handleChange);

    // Cleanup watchers on unmount
    onUnmounted(() => {
      stopClearInvalidSelection();
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

    return () => {
      if (!isVisible.value) {
        return null;
      }

      const children = [];

      if (title.value) {
        children.push(h('div', {
          class: 'text-label text-grey-7 q-mb-xs',
        }, t(title.value)));
      }

      if (description.value) {
        children.push(h('div', {
          class: 'text-description text-caption text-grey-7',
        }, t(description.value)));
      }

      const type = isMultiple.value
            ? (options.value && options.value.format) || 'checkbox'
            : 'radio';

      children.push(
        h(QOptionGroup, {
          modelValue: control.value.data,
          options: selectOptions.value,
          type: type,
          disable: !isEnabled.value,
          'onUpdate:modelValue': onChange,
          ...options.value,
        }),
      );

      return h('div', { class: 'q-options-renderer' }, children);
    };
  },
});

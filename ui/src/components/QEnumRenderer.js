import { h, computed, watch, defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QSelect } from 'quasar';
import { useControlRules } from '../composables/useControlRules';

export default defineComponent({
  name: 'QEnumRenderer',
  props: rendererProps(),
  setup(props) {
    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
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

      return schema.enum.map((value) => ({
        label: String(value),
        value: value,
      }));
    });

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined);
        }
      },
    );

    const onChange = (value) => {
      controlResult.handleChange(controlResult.control.value.path, value);
    };

    return () => {
      if (!isVisible.value) {
        return null;
      }

      return h('div', {
        class: 'q-mb-md',
      }, [
        h(QSelect, {
          modelValue: control.value.data,
          'onUpdate:modelValue': onChange,
          options: options.value,
          label: control.value.label,
          error: hasError.value,
          errorMessage: errorMessage.value,
          required: control.value.required,
          disable: !isEnabled.value,
          hint: control.value.description || hint.value,
          emitValue: true,
          mapOptions: true,
          ...componentProps.value,
        }),
      ]);
    };
  },
});

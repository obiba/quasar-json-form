import { h, watch, defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QInput } from 'quasar';
import { useControlRules } from '../composables/useControlRules';

export default defineComponent({
  name: 'QNumberRenderer',
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

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined);
        }
      },
    );

    const onChange = (value) => {
      controlResult.handleChange(control.value.path, Number(value));
    };

    return () => {
      if (!isVisible.value) {
        return null;
      }

      return h(QInput, {
        modelValue: control.value.data,
        type: 'number',
        'onUpdate:modelValue': onChange,
        label: control.value.label,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value,
        hint: control.value.description || hint.value,
        ...componentProps.value,
      });
    };
  },
});

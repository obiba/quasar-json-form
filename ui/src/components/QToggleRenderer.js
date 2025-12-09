import { h, watch, defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QToggle } from 'quasar';
import { useControlRules } from '../composables/useControlRules';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QToggleRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();

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
      controlResult.handleChange(control.value.path, value);
    };

    return () => {
      if (!isVisible.value) {
        return null;
      }

      const children = [];

      children.push(h(QToggle, {
        modelValue: control.value.data,
        'onUpdate:modelValue': onChange,
        label: control.value.label ? t(control.value.label) : undefined,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value,
        ...componentProps.value,
      }));

      if (control.value.description) {
        children.push(h('div', {
          class: 'text-caption text-grey-7',
        }, t(control.value.description)));
      }

      if (hint.value) {
        children.push(h('div', {
          class: 'text-caption text-grey-7',
        }, t(hint.value)));
      }

      return h('div', children);
    };
  },
});

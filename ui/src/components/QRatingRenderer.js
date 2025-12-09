import { h, watch, defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QRating } from 'quasar';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QRatingRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();

    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    // Use the generic control rules composable
    const { isVisible, isEnabled, hasError, errorMessage, uiOptions } =
      useControlProperties(control);

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

      const children = [];

      if (control.value.label) {
        children.push(h('div', {
          class: 'text-grey-7 q-mb-xs',
        }, t(control.value.label)));
      }

      children.push(h(QRating, {
        modelValue: control.value.data,
        type: 'number',
        'onUpdate:modelValue': onChange,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value,
        ...uiOptions.value,
      }));

      if (control.value.description) {
        children.push(h('div', {
          class: 'text-caption text-grey-7 q-mt-sm',
        }, t(control.value.description)));
      }

      return h('div',  {class: 'q-mt-md'}, children);
    };
  },
});

import { h, watch, defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QSlider } from 'quasar';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QSliderRenderer',
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
          class: 'text-label text-grey-7 q-mb-xs',
        }, t(control.value.label)));
      }

      if (control.value.description) {
        children.push(h('div', {
          class: 'text-description text-caption text-grey-7 q-mb-sm',
        }, t(control.value.description)));
      }

      children.push(h(QSlider, {
        modelValue: control.value.data,
        'onUpdate:modelValue': onChange,
        disable: !isEnabled.value,
        ...uiOptions.value,
      }));

      if (hasError.value && errorMessage.value) {
        children.push(h('div', {
          class: 'text-error text-caption text-negative q-mb-sm',
        }, errorMessage.value));
      } else if (control.value.hint) {
        children.push(h('div', {
          class: 'text-hint text-caption text-grey-7 q-mb-sm',
        }, t(control.value.hint)));
      }

      return h('div', {class: 'q-mt-md'}, children);
    };
  },
});

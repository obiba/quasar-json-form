import { h, computed, watch, defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QSelect } from 'quasar';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QSelectRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();

    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    // Use the generic control rules composable
    const { isVisible, isEnabled, hasError, errorMessage, uiOptions, selectOptions } =
      useControlProperties(control);

    const isMultiple = computed(() => {
      const schema = controlResult.control.value.schema;
      return schema.type === 'array';
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

      return h(QSelect, {
        modelValue: control.value.data,
        'onUpdate:modelValue': onChange,
        label: control.value.label ? t(control.value.label) : undefined,
        options: selectOptions.value,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value,
        hint: control.value.description ? t(control.value.description) : undefined,
        emitValue: true,
        mapOptions: true,
        multiple: isMultiple.value,
        ...uiOptions.value,
      });
    };
  },
});

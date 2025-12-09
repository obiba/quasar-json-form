import { h, computed, watch, defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QSelect } from 'quasar';
import { useControlRules } from '../composables/useControlRules';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QEnumRenderer',
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

    // Transform enum values into q-select options
    const options = computed(() => {
      const schema = controlResult.control.value.schema;

      if (!schema.enum) {
        return [];
      }

      if (schema.options && Array.isArray(schema.options)) {
        // for each enum option, check if it's an object with label and same value
        return schema.enum.map((val) => {
          const foundOption = schema.options.find((option) => {
            if (typeof option === 'object' && option !== null && 'value' in option) {
              return option.value === val;
            }
            return option === val;
          });
          return foundOption ? { label: t(String(foundOption.label)), value: foundOption.value } : { label: t(String(val)), value: val };
        });
      }

      return schema.enum.map((value) => ({
          label: t(String(value)),
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
          label: control.value.label ? t(control.value.label) : undefined,
          options: options.value,
          error: hasError.value,
          errorMessage: errorMessage.value,
          required: control.value.required,
          disable: !isEnabled.value,
          hint: control.value.description ? t(control.value.description) : hint.value ? t(hint.value) : undefined,
          emitValue: true,
          mapOptions: true,
          ...componentProps.value,
        }),
      ]);
    };
  },
});

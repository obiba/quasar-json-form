import { h, computed, watch, defineComponent, onUnmounted } from 'vue';
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
    const { isVisible, isEnabled, hasError, errorMessage, uiOptions, selectOptions, clearInvalidSelection } =
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

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined);
        }
      },
    );

    // Cleanup watchers on unmount
    onUnmounted(() => {
      if (stopClearInvalidSelection) {
        stopClearInvalidSelection();
      }
    });

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

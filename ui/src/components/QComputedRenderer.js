import { h, watch, defineComponent, onMounted } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';
import { renderMarkdown } from '../utils/markdown';


export default defineComponent({
  name: 'QComputedRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();
    
    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    // Use the generic control rules composable
    const { isVisible, computeValue } = useControlProperties(control);

    onMounted(() => {
      // Initialize computed value on mount
      const computedVal = computeValue.value;
      onChange(isVisible.value ? computedVal : undefined);
    });

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined);
        } else {
          // Recompute value when becoming visible
          const computedVal = computeValue.value;
          onChange(computedVal);
        }
      },
    );

    watch(
      () => computeValue.value,
      (newValue) => {
        onChange(isVisible.value ? newValue : undefined);
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

      if (control.value.label || control.value.uischema.label) {
        let label = t(control.value.label || control.value.uischema.label);
        label = renderMarkdown(label);
        children.push(h('div', {
          class: control.value.uischema.labelClass || 'text-bold q-mb-sm',
          innerHTML: label,
        }));
      }

      if (control.value.description || control.value.uischema.description) {
        let hint = t(control.value.description || control.value.uischema.description);
        hint = renderMarkdown(hint);
        children.push(h('div', {
          class: control.value.uischema.descriptionClass || 'text-grey-7',
          innerHTML: hint,
        }));
      }

      // show computed value
      if (control.value.uischema.options?.show === true) {
        children.push(h('div', {
          class: 'q-computed-value q-pa-md q-mt-sm bg-grey-2 border-radius',
        }, computeValue.value !== undefined && computeValue.value !== null
          ? String(computeValue.value)
          : t('noValue')));
      }

      return h('div', {
        class: 'q-computed-renderer',
      }, children);
    };
  },
});

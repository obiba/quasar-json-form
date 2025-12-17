import { h, watch, defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';
import { renderMarkdown } from '../utils/mardown';


export default defineComponent({
  name: 'QSectionRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();
    
    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    // Use the generic control rules composable
    const { isVisible } =
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
          class: control.value.uischema.labelClass || 'text-h6 q-mb-sm',
          innerHTML: label,
        }));
      }

      if (control.value.uischema.description) {
        let hint = t(control.value.uischema.description);
        hint = renderMarkdown(hint);
        children.push(h('div', {
          class: control.value.uischema.descriptionClass || 'text-grey-7',
          innerHTML: hint,
        }));
      }

      return h('div', {
        class: 'q-section-renderer',
      }, children);
    };
  },
});

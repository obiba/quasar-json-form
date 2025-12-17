import { h, watch, computed, defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';
import MarkdownIt from 'markdown-it';


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
    const { isVisible, isEnabled, hasError, errorMessage, uiOptions } =
      useControlProperties(control);

    const inputType = computed(() => {
      const schema = control.value.schema;
      return schema.format || 'text';
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
      controlResult.handleChange(control.value.path, value);
    };

    return () => {
      if (!isVisible.value) {
        return null;
      }
      const md = new MarkdownIt();

      const children = [];

      if (control.value.label || control.value.uischema.label) {
        let label = t(control.value.label || control.value.uischema.label);
        label = md.render(label);
        
        children.push(h('div', {
          class: control.value.uischema.labelClass || 'text-h6 q-mb-sm',
          innerHTML: label,
        }));
      }

      if (control.value.uischema.description) {
        let hint = t(control.value.uischema.description);
        hint = md.render(hint);

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

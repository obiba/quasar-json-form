import { h, watch, defineComponent } from 'vue';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';
import MarkdownIt from 'markdown-it';


export default defineComponent({
  name: 'QLabelRenderer',
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
      const md = new MarkdownIt();

      let label = '';
      if (control.value.label || control.value.uischema.label) {
        label = t(control.value.label || control.value.uischema.label);
        label = md.render(label);
      }

      return h('div', {
        class: 'q-label-renderer ' + (control.value.uischema.labelClass || ''),
        innerHTML: label,
      });
    };
  },
});

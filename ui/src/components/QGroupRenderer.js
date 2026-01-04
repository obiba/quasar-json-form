import { h, watch, defineComponent } from 'vue';
import { DispatchRenderer, rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { useControlProperties } from '../composables/useControlProperties';
import { useI18n } from 'vue-i18n';
import { renderMarkdown } from '../utils/mardown';


export default defineComponent({
  name: 'QGroupRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();
    
    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    // Use the generic control rules composable
    const { isVisible } = useControlProperties(control);

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

      if (control.value.title || control.value.uischema.title) {
        let title = t(control.value.title || control.value.uischema.title);
        children.push(h('div', {
          class: 'q-form-title' + (control.value.uischema.titleClass ? ` ${control.value.uischema.titleClass}` : ''),
          innerHTML: title,
        }));
      }

      if (control.value.description || control.value.uischema.description) {
        let description = t(control.value.description || control.value.uischema.description);
        description = renderMarkdown(description);
        children.push(h('div', {
          class: 'q-form-description' + (control.value.uischema.descriptionClass ? ` ${control.value.uischema.descriptionClass}` : ''),
          innerHTML: description,
        }));
      }

      control.value.uischema.elements.forEach((element) => {
        children.push(h(DispatchRenderer, {
          schema: props.schema,
          uischema: element,
          path: control.value.path,
          enabled: props.enabled,
          visible: props.visible,
          cells: props.cells,
          renderers: props.renderers,
          config: props.config,
        }));
      });

      if (control.value.hint || control.value.uischema.hint) {
        let hint = t(control.value.hint || control.value.uischema.hint);
        hint = renderMarkdown(hint);
        children.push(h('div', {
          class: 'q-form-hint' + (control.value.uischema.hintClass ? ` ${control.value.uischema.hintClass}` : ''),
          innerHTML: hint,
        }));
      }
      
      return h('div', {
        class: 'q-group-renderer',
      }, children);
    };
  },
});

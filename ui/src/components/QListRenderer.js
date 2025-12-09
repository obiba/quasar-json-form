import { h, computed, watch, defineComponent } from 'vue';
import { createDefaultValue } from '@jsonforms/core';
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QList, QItem, QItemSection, QItemLabel, QIcon, QBtn } from 'quasar';
import { useControlProperties } from '../composables/useControlProperties';

export default defineComponent({
  name: 'QListRenderer',
  props: rendererProps(),
  setup(props) {
    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    // Use the generic control rules composable
    const { isVisible, isEnabled, hasError, errorMessage, uiOptions } =
      useControlProperties(control);

    const items = computed(() => {
      return Array.isArray(control.value.data) ? control.value.data : [];
    });

    const addItem = () => {
      const newItem = createDefaultValue(controlResult.control.value.schema.items, controlResult.control.value.rootSchema);
      //controlResult.control.value.addItem(controlResult.control.value.path, newItem);
      const updatedItems = [...items.value, newItem];
      controlResult.handleChange(controlResult.control.value.path, updatedItems);
    };

    const removeItem = (index) => {
      const updatedItems = items.value.filter((_, i) => i !== index);
      controlResult.handleChange(controlResult.control.value.path, updatedItems);
    };

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          controlResult.handleChange(controlResult.control.value.path, []);
        }
      },
    );

    return () => {
      if (!isVisible.value) {
        return null;
      }

      return h('div', {
        class: 'q-mb-md',
      }, [
        h(QList, {
          bordered: true,
          ...uiOptions.value,
        }, items.value.map((item, index) =>
          h(QItem, { key: index }, [
            h(QItemSection, { class: 'q-pa-sm' }, [
              h(QItemLabel, item ? JSON.stringify(item) : '<empty>'),
            ]),
            h(QItemSection, { side: true }, [
              h(QBtn, {
                dense: true,
                flat: true,
                color: 'negative',
                label: control.value.deleteLabel || '',
                icon: control.value.deleteIcon || 'delete',
                onClick: () => removeItem(index),
                disabled: !isEnabled.value,
              }),
            ]),
          ]),
        )),
        h(QBtn, {
          class: 'q-mt-sm',
          label: control.value.addLabel || 'Add Item',
          color: 'primary',
          icon: control.value.addIcon || 'add',
          size: control.value.addSize || 'sm',
          onClick: addItem,
          disabled: !isEnabled.value,
        }),
        hasError.value ? h('div', { class: 'text-negative q-mt-sm' }, errorMessage.value) : null,
        hint.value ? h('div', { class: 'text-caption q-mt-sm' }, hint.value) : null,
      ]);
    };
  },
});

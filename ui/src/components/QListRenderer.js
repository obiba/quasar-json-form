import { h, computed, watch, defineComponent, ref } from 'vue';
import { createDefaultValue, composePaths } from '@jsonforms/core';
import { DispatchRenderer, rendererProps, useJsonFormsControl } from '@jsonforms/vue';
import { QList, QItem, QItemSection, QBtn, QDialog, QCard, QCardSection, QCardActions } from 'quasar';
import { useControlProperties } from '../composables/useControlProperties';
import { renderMarkdown } from '../utils/markdown';
import { useI18n } from 'vue-i18n';

export default defineComponent({
  name: 'QListRenderer',
  props: rendererProps(),
  setup(props) {
    const { t } = useI18n();
    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    });

    const control = controlResult.control;

    // Use the generic control rules composable
    const { isVisible, isEnabled, maxValue, minValue, hasError, errorMessage, uiOptions } =
      useControlProperties(control);

    // Dialog state for confirming item removal
    const showConfirmDialog = ref(false);
    const itemToRemove = ref(null);

    const items = computed(() => {
      return Array.isArray(control.value.data) ? control.value.data : [];
    });

    const withOrdering = computed(() => {
      return control.value.uischema.options?.ordering ?? true;
    });

    const withConfirmation = computed(() => {
      return control.value.uischema.options?.confirmation ?? false;
    });

    const canAddItem = computed(() => {
      if (maxValue.value === undefined) return true;
      return items.value.length < maxValue.value;
    });

    const addItem = () => {
      if (!canAddItem.value) {
        return;
      }
      const newItem = createDefaultValue(controlResult.control.value.schema.items, controlResult.control.value.rootSchema);
      const updatedItems = [...items.value, newItem];
      controlResult.handleChange(controlResult.control.value.path, updatedItems);
    };

    const canRemoveItem = computed(() => {
      if (minValue.value === undefined) return true;
      return items.value.length > minValue.value;
    });

    const confirmRemoveItem = (index) => {
      if (withConfirmation.value) {
        itemToRemove.value = index;
        showConfirmDialog.value = true;
      } else {
        removeItemDirect(index);
      }
    };

    const removeItemDirect = (index) => {
      if (!canRemoveItem.value) {
        return;
      }
      const updatedItems = items.value.filter((_, i) => i !== index);
      controlResult.handleChange(controlResult.control.value.path, updatedItems);
    };

    const removeItem = () => {
      if (!canRemoveItem.value || itemToRemove.value === null) {
        return;
      }
      const updatedItems = items.value.filter((_, i) => i !== itemToRemove.value);
      controlResult.handleChange(controlResult.control.value.path, updatedItems);
      showConfirmDialog.value = false;
      itemToRemove.value = null;
    };

    const moveUpItem = (index) => {
      if (index <= 0) {
        return;
      }
      const updatedItems = [...items.value];
      const temp = updatedItems[index - 1];
      updatedItems[index - 1] = updatedItems[index];
      updatedItems[index] = temp;
      controlResult.handleChange(controlResult.control.value.path, updatedItems);
    };

    const moveDownItem = (index) => {
      if (index >= items.value.length - 1) {
        return;
      }
      const updatedItems = [...items.value];
      const temp = updatedItems[index + 1];
      updatedItems[index + 1] = updatedItems[index];
      updatedItems[index] = temp;
      controlResult.handleChange(controlResult.control.value.path, updatedItems);
    };

    const itemsSchema = computed(() => control.value.schema.items);
    const itemsUiSchema = computed(() => {
      return control.value.uischema.options?.items || {
        type: 'VerticalLayout',
        elements: Object.keys(itemsSchema.value.properties || {}).map((key) => ({
          type: 'Control',
          scope: `#/properties/${key}`,
        }))};
    });

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

      const label = (control.value.label || control.value.uischema.label) ? t(control.value.label || control.value.uischema.label) : undefined;
      const hint = control.value.uischema.description ? renderMarkdown(t(control.value.uischema.description)) : undefined;

      // Confirmation dialog
      const confirmDialog = withConfirmation.value ? h(QDialog, {
        modelValue: showConfirmDialog.value,
        'onUpdate:modelValue': (val) => { showConfirmDialog.value = val; },
      }, () => h(QCard, { style: 'min-width: 300px' }, () => [
        h(QCardSection, { class: 'row items-center q-pb-none' }, () => t('confirm-remove-item') || 'Remove this item?'),
        h(QCardActions, { align: 'right' }, () => [
          h(QBtn, {
            flat: true,
            label: t('cancel') || 'Cancel',
            color: 'primary',
            onClick: () => { showConfirmDialog.value = false; itemToRemove.value = null; },
          }),
          h(QBtn, {
            flat: true,
            label: t('remove') || 'Remove',
            color: 'negative',
            onClick: removeItem,
          }),
        ]),
      ])) : null;

      let listItems = null;
      if (items.value.length > 0) {
        listItems = h(QList, {
          bordered: true,
          separator: true,
          ...uiOptions.value,
        }, () => items.value.map((item, index) =>
          h(QItem, { key: index }, () => [
            h(QItemSection, { class: 'q-pa-sm' }, () => [
              h(DispatchRenderer, {
                schema: itemsSchema.value,
                uischema: itemsUiSchema.value,
                path: composePaths(control.value.path, `${index}`)
              }),
            ]),
            h(QItemSection, { side: true, style: 'padding: 0' }, () => [
              h(QBtn, {
                dense: true,
                flat: true,
                color: 'negative',
                label: control.value.deleteLabel ? t(control.value.deleteLabel) : '',
                icon: control.value.deleteIcon || 'delete',
                onClick: () => confirmRemoveItem(index),
                disabled: !isEnabled.value || !canRemoveItem.value,
              }),
            ]),
            withOrdering.value ? h(QItemSection, { side: true, style: 'padding: 0' }, () => [
              h(QBtn, {
                dense: true,
                flat: true,
                color: 'primary',
                label: control.value.moveUpLabel ? t(control.value.moveUpLabel) : '',
                icon: control.value.moveUpIcon || 'arrow_upward',
                onClick: () => moveUpItem(index),
                disabled: !isEnabled.value || index <= 0,
              }),
            ]) : null,
            withOrdering.value ? h(QItemSection, { side: true, style: 'padding: 0' }, () => [
              h(QBtn, {
                dense: true,
                flat: true,
                color: 'primary',
                label: control.value.moveDownLabel ? t(control.value.moveDownLabel) : '',
                icon: control.value.moveDownIcon || 'arrow_downward',
                onClick: () => moveDownItem(index),
                disabled: !isEnabled.value || index >= items.value.length - 1,
              }),
            ]) : null,
          ]),
        ));
      } else {
        listItems = h('div', {
          class: 'text-grey-6',
        }, t(control.value.emptyLabel || 'no-items'));
      }

      return h('div', {
        class: 'q-mb-md',
      }, [
        label ? h('div', {
          class: control.value.uischema.labelClass || 'text-bold q-mb-sm',
          innerHTML: label
        }) : null,
        hint ? h('div', {
          class: control.value.uischema.descriptionClass || 'text-grey-7',
          innerHTML: hint
        }) : null,
        listItems,
        confirmDialog,
        h(QBtn, {
          class: 'q-mt-md',
          label: t(control.value.addLabel || 'add-item'),
          color: 'primary',
          icon: control.value.addIcon || 'add',
          size: control.value.addSize || 'sm',
          disabled: !isEnabled.value || !canAddItem.value,
          onClick: addItem,
        }),
        hasError.value ? h('div', { class: 'text-negative q-mt-sm' }, errorMessage.value) : null,
      ]);
    };
  },
});

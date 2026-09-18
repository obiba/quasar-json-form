import { h, computed, watch, defineComponent, ref } from 'vue'
import { createDefaultValue, composePaths } from '@jsonforms/core'
import { DispatchRenderer, rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QList, QItem, QItemSection, QBtn, QDialog, QCard, QCardSection, QCardActions } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { omitOptions, RENDERER_OPTION_KEYS } from '../utils/options'

/** options interpreted by the list renderer, not passed to QList */
const LIST_OPTION_KEYS = [...RENDERER_OPTION_KEYS, 'addLabel', 'addIcon', 'class']

export default defineComponent({
  name: 'QListRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useFormI18n()
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled, isReadonly, rootClass, maxValue, minValue, hasError, errorMessage, options, renderHeader, renderHint } =
      useControlProperties(control)

    // Dialog state for confirming item removal
    const showConfirmDialog = ref(false)
    const itemToRemove = ref(null)

    const items = computed(() => {
      return Array.isArray(control.value.data) ? control.value.data : []
    })

    const withOrdering = computed(() => {
      return control.value.uischema.options?.ordering ?? true
    })

    const withConfirmation = computed(() => {
      return control.value.uischema.options?.confirmation ?? false
    })

    // bounds: `max` / `min` rules, else the schema `maxItems` / `minItems`
    const maxItems = computed<number | undefined>(() => {
      const value = maxValue.value ?? control.value.schema.maxItems
      return typeof value === 'number' ? value : undefined
    })

    const minItems = computed<number | undefined>(() => {
      const value = minValue.value ?? control.value.schema.minItems
      return typeof value === 'number' ? value : undefined
    })

    const canAddItem = computed(() => {
      if (maxItems.value === undefined) return true
      return items.value.length < maxItems.value
    })

    const addItem = () => {
      if (!canAddItem.value) {
        return
      }
      const newItem = createDefaultValue(controlResult.control.value.schema.items as any, controlResult.control.value.rootSchema)
      const updatedItems = [...items.value, newItem]
      controlResult.handleChange(controlResult.control.value.path, updatedItems)
    }

    const canRemoveItem = computed(() => {
      if (minItems.value === undefined) return true
      return items.value.length > minItems.value
    })

    const confirmRemoveItem = (index: number) => {
      if (withConfirmation.value) {
        itemToRemove.value = index as any
        showConfirmDialog.value = true
      } else {
        removeItemDirect(index)
      }
    }

    const removeItemDirect = (index: number) => {
      if (!canRemoveItem.value) {
        return
      }
      const updatedItems = items.value.filter((_, i) => i !== index)
      controlResult.handleChange(controlResult.control.value.path, updatedItems)
    }

    const removeItem = () => {
      if (!canRemoveItem.value || itemToRemove.value === null) {
        return
      }
      const updatedItems = items.value.filter((_, i) => i !== itemToRemove.value)
      controlResult.handleChange(controlResult.control.value.path, updatedItems)
      showConfirmDialog.value = false
      itemToRemove.value = null
    }

    const moveUpItem = (index: number) => {
      if (index <= 0) {
        return
      }
      const updatedItems = [...items.value]
      const temp = updatedItems[index - 1]
      updatedItems[index - 1] = updatedItems[index]
      updatedItems[index] = temp
      controlResult.handleChange(controlResult.control.value.path, updatedItems)
    }

    const moveDownItem = (index: number) => {
      if (index >= items.value.length - 1) {
        return
      }
      const updatedItems = [...items.value]
      const temp = updatedItems[index + 1]
      updatedItems[index + 1] = updatedItems[index]
      updatedItems[index] = temp
      controlResult.handleChange(controlResult.control.value.path, updatedItems)
    }

    const itemsSchema = computed(() => control.value.schema.items)
    // UI schema of one item (`options.items`, scopes relative to the item schema): by
    // default one control per property of an object item, or the item itself
    const itemsUiSchema = computed(() => {
      if (control.value.uischema.options?.items) return control.value.uischema.options.items
      const properties = (itemsSchema.value as any)?.properties
      if (properties && typeof properties === 'object' && !(itemsSchema.value as any)?.format) {
        return {
          type: 'VerticalLayout',
          elements: Object.keys(properties).map((key) => ({
            type: 'Control',
            scope: `#/properties/${key}`,
          }))
        }
      }
      return { type: 'Control', scope: '#', label: false }
    })

    const addLabel = computed(() => {
      const label = options.value.addLabel || (control.value as any).addLabel
      return label ? t(String(label)) : t('add-item')
    })

    // a hidden list is removed from the data, like the other hidden controls
    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          controlResult.handleChange(controlResult.control.value.path, undefined)
        }
      },
    )

    return () => {
      if (!isVisible.value) {
        return null
      }

      // Confirmation dialog
      const confirmDialog = withConfirmation.value ? h(QDialog, {
        modelValue: showConfirmDialog.value,
        'onUpdate:modelValue': (val: boolean) => { showConfirmDialog.value = val },
      }, () => h(QCard, { style: 'min-width: 300px' }, () => [
        h(QCardSection, { class: 'row items-center q-pb-none' }, () => t('confirm-remove-item') || 'Remove this item?'),
        h(QCardActions, { align: 'right' }, () => [
          h(QBtn, {
            flat: true,
            label: t('cancel') || 'Cancel',
            color: 'primary',
            onClick: () => { showConfirmDialog.value = false; itemToRemove.value = null },
          }),
          h(QBtn, {
            flat: true,
            label: t('remove') || 'Remove',
            color: 'negative',
            onClick: removeItem,
          }),
        ]),
      ])) : null

      let listItems = null
      if (items.value.length > 0) {
        listItems = h(QList, {
          class: 'q-mb-sm',
          bordered: true,
          separator: true,
          ...omitOptions(options.value, LIST_OPTION_KEYS),
        }, () => items.value.map((_item: any, index: number) =>
          h(QItem, { key: index }, () => [
            h(QItemSection, { class: 'q-pa-sm' }, () => [
              h(DispatchRenderer, {
                schema: itemsSchema.value as any,
                uischema: itemsUiSchema.value,
                path: composePaths(control.value.path, `${index}`),
                enabled: props.enabled !== false && isEnabled.value,
                renderers: props.renderers,
                cells: props.cells,
                config: props.config,
              }),
            ]),
            isReadonly.value ? null : h(QItemSection, { side: true, style: 'padding: 0' }, () => [
              h(QBtn, {
                dense: true,
                flat: true,
                color: 'negative',
                size: 'sm',
                label: (control.value as any).deleteLabel ? t((control.value as any).deleteLabel) : '',
                icon: (control.value as any).deleteIcon || 'delete',
                onClick: () => confirmRemoveItem(index),
                disabled: !isEnabled.value || !canRemoveItem.value,
              }),
            ]),
            withOrdering.value && !isReadonly.value && items.value.length > 1 ? h(QItemSection, { side: true, style: 'padding: 0' }, () => [
              h(QBtn, {
                dense: true,
                flat: true,
                color: 'primary',
                size: 'sm',
                label: (control.value as any).moveUpLabel ? t((control.value as any).moveUpLabel) : '',
                icon: (control.value as any).moveUpIcon || 'arrow_upward',
                onClick: () => moveUpItem(index),
                disabled: !isEnabled.value || index <= 0,
              }),
            ]) : null,
            withOrdering.value && !isReadonly.value && items.value.length > 1 ? h(QItemSection, { side: true, style: 'padding: 0' }, () => [
              h(QBtn, {
                dense: true,
                flat: true,
                color: 'primary',
                size: 'sm',
                label: (control.value as any).moveDownLabel ? t((control.value as any).moveDownLabel) : '',
                icon: (control.value as any).moveDownIcon || 'arrow_downward',
                onClick: () => moveDownItem(index),
                disabled: !isEnabled.value || index >= items.value.length - 1,
              }),
            ]) : null,
          ]),
        ))
      }

      return h('div', {
        class: ['q-list-renderer', rootClass.value],
      }, [
        ...renderHeader(),
        listItems,
        confirmDialog,
        isReadonly.value ? null : h(QBtn, {
          label: addLabel.value,
          color: 'primary',
          icon: options.value.addIcon || (control.value as any).addIcon || 'add',
          size: (control.value as any).addSize || 'sm',
          disabled: !isEnabled.value || !canAddItem.value,
          onClick: addItem,
        }),
        hasError.value ? h('div', { class: 'text-negative q-mt-sm' }, errorMessage.value) : renderHint(),
      ])
    }
  },
})

import { h, computed, watch, defineComponent, ref } from 'vue'
import { createDefaultValue, composePaths } from '@jsonforms/core'
import { DispatchRenderer, rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QList, QItem, QItemSection, QBtn, QDialog, QCard, QCardSection, QCardActions } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { renderMarkdown } from '../utils/markdown'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'QListRenderer',
  props: rendererProps(),
  setup(props: any) {
    const { t } = useI18n()
    const controlResult = useJsonFormsControl({
      ...props,
      uischema: props.uischema,
    })

    const control = controlResult.control

    // Use the generic control rules composable
    const { isVisible, isEnabled, maxValue, minValue, hasError, errorMessage, options, title, description } =
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

    const canAddItem = computed(() => {
      if (maxValue.value === undefined) return true
      return items.value.length < maxValue.value
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
      if (minValue.value === undefined) return true
      return items.value.length > minValue.value
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
    const itemsUiSchema = computed(() => {
      return control.value.uischema.options?.items || {
        type: 'VerticalLayout',
        elements: Object.keys((itemsSchema.value as any)?.properties || {}).map((key) => ({
          type: 'Control',
          scope: `#/properties/${key}`,
        }))
      }
    })

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          controlResult.handleChange(controlResult.control.value.path, [])
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
          ...options.value,
        }, () => items.value.map((_item: any, index: number) =>
          h(QItem, { key: index }, () => [
            h(QItemSection, { class: 'q-pa-sm' }, () => [
              h(DispatchRenderer, {
                schema: itemsSchema.value as any,
                uischema: itemsUiSchema.value,
                path: composePaths(control.value.path, `${index}`)
              }),
            ]),
            h(QItemSection, { side: true, style: 'padding: 0' }, () => [
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
            withOrdering.value && items.value.length > 1 ? h(QItemSection, { side: true, style: 'padding: 0' }, () => [
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
            withOrdering.value && items.value.length > 1 ? h(QItemSection, { side: true, style: 'padding: 0' }, () => [
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
        class: 'q-list-renderer',
      }, [
        title.value ? h('div', {
          class: (control.value.uischema as any).titleClass || 'text-bold q-mb-sm',
          innerHTML: t(title.value)
        }) : null,
        description.value ? h('div', {
          class: ((control.value.uischema as any).descriptionClass || 'text-grey-7') + ' text-markdown q-mb-sm',
          innerHTML: renderMarkdown(t(description.value))
        }) : null,
        listItems,
        confirmDialog,
        h(QBtn, {
          label: (control.value as any).addLabel ? t((control.value as any).addLabel) : t('add-item'),
          color: 'primary',
          icon: (control.value as any).addIcon || 'add',
          size: (control.value as any).addSize || 'sm',
          disabled: !isEnabled.value || !canAddItem.value,
          onClick: addItem,
        }),
        hasError.value ? h('div', { class: 'text-negative q-mt-sm' }, errorMessage.value) : null,
      ])
    }
  },
})

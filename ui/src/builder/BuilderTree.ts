/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The outline of the form: one row per node, nested under its layout, with
 * the palette to add nodes to a layout, drag and drop (sortablejs) to reorder
 * and reparent, and the removal of a node.
 */
import { h, defineComponent, computed, onMounted, onUpdated, onBeforeUnmount, ref } from 'vue'
import type { PropType, VNode } from 'vue'
import { QBtn, QIcon, QMenu, QList, QItem, QItemSection, QItemLabel, QSeparator, QSpace, QTooltip } from 'quasar'
import Sortable from 'sortablejs'
import { useFormI18n } from '../vue-plugin'
import type { FormModel, FormNode } from './model'
import { locate, propertySchema, descendants } from './model'
import { addNode, removeNode, moveNode, canMove } from './operations'
import { textSlots, getText } from './texts'
import { matchItem, nodeIcon, itemKey, dropIndex } from './items'
import type { BuilderCatalog } from './items'

export default defineComponent({
  name: 'QJsonFormBuilderTree',
  props: {
    model: { type: Object as PropType<FormModel>, required: true },
    catalog: { type: Object as PropType<BuilderCatalog>, required: true },
    selected: { type: String, default: undefined },
    locale: { type: String, required: true },
  },
  emits: ['select', 'change'],
  setup(props, { emit }) {
    const { translate } = useFormI18n()
    const tr = (key: string, named?: Record<string, unknown>) => translate(`builder.${key}`, named)
    const root = ref<HTMLElement | null>(null)
    const dragging = ref(false)

    const controls = computed(() => props.catalog.items.filter((item) => props.catalog.renderers[item.renderer]?.kind === 'control'))
    const layouts = computed(() => props.catalog.items.filter((item) => props.catalog.renderers[item.renderer]?.kind !== 'control'))

    /** the text displayed for a node: its title or label in the builder language, else its key or type */
    const labelOf = (node: FormNode, isDetail: boolean): string => {
      if (isDetail) return tr('items')
      if (node === props.model.root) return tr('root')
      for (const slot of textSlots(props.model, node)) {
        if (!['title', 'label', 'text'].includes(slot.name)) continue
        const text = getText(props.model, node, slot, props.locale)
        if (text) return text.length > 60 ? text.slice(0, 57) + '…' : text
      }
      if (node.path) return node.path.join('.')
      return String(node.element.type ?? tr('element'))
    }

    const select = (node: FormNode) => emit('select', node.id)

    const add = (parent: FormNode, item: { schema?: Record<string, any>; uischema: Record<string, any>; name: string }) => {
      const node = addNode(props.model, parent.id, item, undefined, itemKey(item as any))
      if (node) {
        emit('change')
        emit('select', node.id)
      }
    }

    const remove = (node: FormNode) => {
      const location = locate(props.model, node.id)
      const removed = removeNode(props.model, node.id)
      if (removed) {
        emit('change')
        // the selection was in the removed subtree: select the parent
        if (location?.parent && descendants(removed).some((n) => n.id === props.selected)) emit('select', location.parent.id)
      }
    }

    const renderPalette = (parent: FormNode): VNode =>
      h(QBtn, { flat: true, dense: true, round: true, size: 'sm', icon: 'add', onClick: (e: Event) => e.stopPropagation() }, () => [
        h(QTooltip, () => tr('add')),
        h(QMenu, { autoClose: true }, () => [
          h(QList, { dense: true, style: 'min-width: 220px; max-height: 60vh' }, () => [
            h(QItemLabel, { header: true }, () => tr('controls')),
            ...controls.value.map((item) => h(QItem, { clickable: true, onClick: () => add(parent, item) }, () => [
              h(QItemSection, { avatar: true }, () => h(QIcon, { name: item.icon, size: 'xs' })),
              h(QItemSection, () => item.label),
            ])),
            h(QSeparator),
            h(QItemLabel, { header: true }, () => tr('layouts')),
            ...layouts.value.map((item) => h(QItem, { clickable: true, onClick: () => add(parent, item) }, () => [
              h(QItemSection, { avatar: true }, () => h(QIcon, { name: item.icon, size: 'xs' })),
              h(QItemSection, () => item.label),
            ])),
          ]),
        ]),
      ])

    const renderRow = (node: FormNode, isDetail: boolean): VNode => {
      const isRoot = node === props.model.root
      const schema = node.kind === 'control' ? propertySchema(props.model, node.id) : undefined
      const item = matchItem(node, schema, props.catalog.items)
      const children: VNode[] = []
      if (!isRoot && !isDetail) children.push(h(QIcon, { name: 'drag_indicator', size: 'xs', class: 'q-builder-handle q-mr-xs' }))
      children.push(h(QIcon, { name: nodeIcon(node, item, isDetail), size: 'xs', class: 'q-mr-sm text-grey-7' }))
      children.push(h('span', { class: 'q-builder-label ellipsis' }, labelOf(node, isDetail)))
      if (node.kind === 'control' && node.path) children.push(h('span', { class: 'text-caption text-grey-6 q-ml-sm ellipsis' }, node.path.join('.')))
      children.push(h(QSpace))
      if (node.kind === 'layout') children.push(renderPalette(node))
      if (!isRoot && !isDetail) {
        children.push(h(QBtn, { flat: true, dense: true, round: true, size: 'sm', icon: 'delete', onClick: (e: Event) => { e.stopPropagation(); remove(node) } }, () => h(QTooltip, () => tr('remove'))))
      }
      return h('div', {
        class: ['row items-center no-wrap q-builder-row', { 'q-builder-selected': props.selected === node.id }],
        onClick: () => select(node),
      }, children)
    }

    const renderNode = (node: FormNode, isDetail = false): VNode => {
      const parts: VNode[] = [renderRow(node, isDetail)]
      if (node.kind === 'layout') {
        parts.push(h('ul', { class: 'q-builder-children', 'data-parent': node.id }, node.children.map((child) => renderNode(child))))
      } else if (node.detail) {
        parts.push(h('ul', {}, [renderNode(node.detail, true)]))
      }
      return h('li', { key: node.id, 'data-id': node.id }, parts)
    }

    // --- drag and drop: one sortable per layout list, refreshed on every render

    const sortables = new Map<HTMLElement, Sortable>()

    const onEnd = (evt: Sortable.SortableEvent) => {
      dragging.value = false
      const { item, from, to, oldIndex, newIndex } = evt
      if (oldIndex === undefined || newIndex === undefined) return
      // put the element back where Vue rendered it, then move the node
      to.removeChild(item)
      from.insertBefore(item, from.children[oldIndex] ?? null)
      const id = item.getAttribute('data-id')
      const parentId = to.getAttribute('data-parent')
      if (!id || !parentId) return
      if (moveNode(props.model, id, parentId, dropIndex(from === to, oldIndex, newIndex))) emit('change')
    }

    const syncSortables = () => {
      if (!root.value) return
      const lists = new Set<HTMLElement>(Array.from(root.value.querySelectorAll<HTMLElement>('ul.q-builder-children')))
      for (const [el, sortable] of sortables) {
        if (!lists.has(el)) {
          sortable.destroy()
          sortables.delete(el)
        }
      }
      for (const el of lists) {
        if (sortables.has(el)) continue
        try {
          sortables.set(el, Sortable.create(el, {
            group: 'q-json-form-builder',
            handle: '.q-builder-handle',
            animation: 150,
            fallbackOnBody: true,
            swapThreshold: 0.65,
            emptyInsertThreshold: 8,
            onStart: () => { dragging.value = true },
            onMove: (evt) => {
              const id = evt.dragged.getAttribute('data-id')
              const parentId = evt.to.getAttribute('data-parent')
              return !!id && !!parentId && canMove(props.model, id, parentId)
            },
            onEnd,
          }))
        } catch {
          // no drag and drop outside a browser
        }
      }
    }

    onMounted(syncSortables)
    onUpdated(syncSortables)
    onBeforeUnmount(() => {
      sortables.forEach((sortable) => sortable.destroy())
      sortables.clear()
    })

    return () => h('div', { ref: root, class: ['q-builder-tree', { 'q-builder-dragging': dragging.value }] }, [
      h('ul', {}, [renderNode(props.model.root)]),
    ])
  },
})

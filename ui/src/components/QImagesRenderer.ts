/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, computed, watch, defineComponent, onMounted, onUnmounted } from 'vue'
import type { VNode } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QImg, QIcon, QBtn, useQuasar } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { gridContainerStyle, gridCellStyle } from '../utils/grid'
import type { Breakpoint, GridPlacement } from '../utils/grid'

/** MIME types of the images a tile can display, when given as a data URI */
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const DATA_URI = /^data:([^;,]+)[;,]/i

/**
 * Whether the image source can be displayed: a non empty URL (not checked, a
 * server URL often has no extension), or a data URI of a supported MIME type.
 */
export function isSupportedImage(src: unknown): src is string {
  if (typeof src !== 'string' || src.trim().length === 0) return false
  const match = DATA_URI.exec(src)
  return match === null || IMAGE_MIME_TYPES.includes(match[1]!.toLowerCase())
}

/** An entry of the `images` option map: a source, or a source with a placement and a caption */
export interface ImageEntry {
  src?: string
  grid?: GridPlacement
  title?: string
}

/** A tile of the control: an option of the selection with its image */
export interface ImageTile {
  value: any
  label: string
  src?: string
  grid?: GridPlacement
}

const DEFAULT_MIN_WIDTH = '120px'

/**
 * Images control: a single choice (`enum` / `oneOf` string) or multiple
 * choices (`uniqueItems` array of them) among images laid out on a CSS grid.
 * The image of a value comes from the `image` key of its `oneOf` entry, or
 * from the `options.images` map (`{ value: url | { src, grid, title } }`).
 */
export default defineComponent({
  name: 'QImagesRenderer',
  props: rendererProps(),
  setup(props: any) {
    const $q = useQuasar()

    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const {
      isVisible, isEnabled, isReadonly, rootClass, hasError, errorMessage, options, selectOptions,
      maxValue, clearInvalidSelection, renderHeader, renderHint,
    } = useControlProperties(control)

    const { t, translate } = useFormI18n()

    const screen = computed<Breakpoint>(() => ($q?.screen?.name as Breakpoint) || 'xs')

    const isMultiple = computed(() => control.value.schema.type === 'array')

    const withOrdering = computed(() => isMultiple.value && options.value.ordering === true)

    const withCaptions = computed(() => options.value.captions !== false)

    const color = computed<string>(() => (typeof options.value.color === 'string' && options.value.color.length > 0 ? options.value.color : 'primary'))

    /** `options.images` entries, keyed by the string form of the value */
    const imageEntries = computed<Record<string, ImageEntry>>(() => {
      const map = options.value.images
      const entries: Record<string, ImageEntry> = {}
      if (!map || typeof map !== 'object' || Array.isArray(map)) return entries
      Object.keys(map).forEach((key) => {
        const entry = map[key]
        if (typeof entry === 'string') entries[key] = { src: entry }
        else if (entry && typeof entry === 'object') entries[key] = entry
      })
      return entries
    })

    const tiles = computed<ImageTile[]>(() =>
      selectOptions.value.map((option) => {
        const entry = imageEntries.value[String(option.value)] || {}
        const tile: ImageTile = {
          value: option.value,
          label: typeof entry.title === 'string' && entry.title.length > 0 ? t(entry.title) : option.label,
        }
        const src = entry.src ?? option.image
        if (typeof src === 'string') tile.src = src
        const grid = entry.grid ?? option.grid
        if (grid && typeof grid === 'object') tile.grid = grid
        return tile
      }),
    )

    // bounds of a multiple choice: schema `maxItems`, else the filtrex `max` rule
    const maxItems = computed<number | undefined>(() => {
      const value = control.value.schema.maxItems ?? maxValue.value
      return typeof value === 'number' && !isNaN(value) ? value : undefined
    })

    const selection = computed<any[]>(() => {
      const data = control.value.data
      if (isMultiple.value) return Array.isArray(data) ? data : []
      return data === undefined || data === null ? [] : [data]
    })

    const isSelected = (value: any): boolean => selection.value.includes(value)

    const isFull = computed(() => isMultiple.value && maxItems.value !== undefined && selection.value.length >= maxItems.value)

    const onChange = (value: any) => {
      controlResult.handleChange(control.value.path, value)
    }

    /** the values in the order of the tiles, unless the click order matters */
    const normalize = (values: any[]): any[] => {
      if (withOrdering.value) return values
      const set = new Set(values)
      return tiles.value.map((tile) => tile.value).filter((value) => set.has(value))
    }

    const toggle = (tile: ImageTile) => {
      if (!isEnabled.value || isReadonly.value) return
      if (!isMultiple.value) {
        // a second click clears an optional single choice
        onChange(isSelected(tile.value) && !control.value.required ? undefined : tile.value)
        return
      }
      if (isSelected(tile.value)) {
        onChange(selection.value.filter((value) => value !== tile.value))
      } else if (!isFull.value) {
        onChange(normalize([...selection.value, tile.value]))
      }
    }

    const move = (value: any, delta: number) => {
      const values = [...selection.value]
      const index = values.indexOf(value)
      const target = index + delta
      if (index < 0 || target < 0 || target >= values.length) return
      values[index] = values[target]
      values[target] = value
      onChange(values)
    }

    const onKeydown = (event: KeyboardEvent, tile: ImageTile) => {
      if (event.key === ' ' || event.key === 'Enter' || event.key === 'Spacebar') {
        event.preventDefault()
        toggle(tile)
      }
    }

    // Set up watch to clear invalid selections when options change
    const stopClearInvalidSelection = clearInvalidSelection(controlResult.handleChange)

    onUnmounted(() => {
      stopClearInvalidSelection()
    })

    onMounted(() => {
      // Ensure that for multiple selection, the value is always an array
      if (isMultiple.value && isVisible.value && !Array.isArray(control.value.data)) {
        onChange([])
      }
    })

    watch(
      () => isVisible.value,
      (newValue) => {
        if (newValue === false) {
          onChange(undefined)
        }
      },
    )

    watch(
      () => control.value.data,
      (newValue) => {
        if (isMultiple.value && isVisible.value && !Array.isArray(newValue)) {
          onChange([])
        }
      },
    )

    const containerStyle = computed(() => {
      const opts = options.value
      const style = gridContainerStyle({
        columns: opts.columns,
        gap: opts.gap ?? 10,
        rowGap: opts.rowGap,
        columnGap: opts.columnGap,
      }, screen.value)
      if (!style.gridTemplateColumns) {
        const minWidth = typeof opts.minWidth === 'number' ? `${opts.minWidth}px` : (opts.minWidth || DEFAULT_MIN_WIDTH)
        style.gridTemplateColumns = `repeat(auto-fill, minmax(${minWidth}, 1fr))`
      }
      return style
    })

    const renderPlaceholder = (): VNode =>
      h('div', { class: 'q-images__placeholder absolute-full flex flex-center' }, [
        h(QIcon, { name: 'broken_image', size: '2em' }),
      ])

    const renderImage = (tile: ImageTile): VNode => {
      if (!isSupportedImage(tile.src)) {
        return h('div', { class: 'q-images__image q-images__image--missing' }, [renderPlaceholder()])
      }
      return h(QImg, {
        class: 'q-images__image',
        src: tile.src,
        alt: tile.label,
        ratio: options.value.ratio ?? 1,
        fit: options.value.fit ?? 'cover',
        loading: options.value.loading ?? 'lazy',
        noSpinner: true,
        noTransition: true,
      }, {
        error: renderPlaceholder,
      })
    }

    const renderBadge = (tile: ImageTile): VNode | null => {
      if (!isSelected(tile.value)) return null
      const rank = withOrdering.value ? selection.value.indexOf(tile.value) + 1 : undefined
      return h('div', { class: 'q-images__badge' }, [
        rank !== undefined ? h('span', String(rank)) : h(QIcon, { name: 'check', size: '16px' }),
      ])
    }

    const renderMoveButton = (tile: ImageTile, delta: number): VNode => {
      const index = selection.value.indexOf(tile.value)
      const target = index + delta
      return h(QBtn, {
        dense: true,
        flat: true,
        round: true,
        size: 'xs',
        color: color.value,
        icon: delta < 0 ? 'chevron_left' : 'chevron_right',
        'aria-label': `${tile.label}: ${translate(delta < 0 ? 'images.moveBefore' : 'images.moveAfter')}`,
        disable: !isEnabled.value || target < 0 || target >= selection.value.length,
        onClick: (event: Event) => {
          event.stopPropagation()
          move(tile.value, delta)
        },
      })
    }

    const renderCaption = (tile: ImageTile): VNode | null => {
      if (!withCaptions.value) return null
      const withMoves = withOrdering.value && !isReadonly.value && isSelected(tile.value) && selection.value.length > 1
      return h('div', { class: 'q-images__caption' }, [
        withMoves ? renderMoveButton(tile, -1) : null,
        h('span', { class: 'q-images__label' }, tile.label),
        withMoves ? renderMoveButton(tile, 1) : null,
      ])
    }

    const renderTile = (tile: ImageTile): VNode => {
      const selected = isSelected(tile.value)
      const disabled = !isEnabled.value || (!selected && isFull.value)
      return h('div', {
        key: String(tile.value),
        class: 'q-images__cell',
        style: gridCellStyle(tile.grid, screen.value),
      }, [
        h('div', {
          class: [
            'q-images__tile',
            `text-${color.value}`,
            {
              'q-images__tile--selected': selected,
              'q-images__tile--readonly': isReadonly.value,
              disabled,
            },
          ],
          role: isMultiple.value ? 'checkbox' : 'radio',
          'aria-checked': selected ? 'true' : 'false',
          'aria-disabled': disabled ? 'true' : undefined,
          'aria-label': tile.label,
          tabindex: disabled || isReadonly.value ? -1 : 0,
          onClick: () => toggle(tile),
          onKeydown: (event: KeyboardEvent) => onKeydown(event, tile),
        }, [
          renderImage(tile),
          renderBadge(tile),
        ]),
        renderCaption(tile),
      ])
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      const children: (VNode | null)[] = [...renderHeader()]

      children.push(h('div', {
        class: ['q-images', { 'q-form-readonly': isReadonly.value }],
        style: containerStyle.value,
        role: isMultiple.value ? 'group' : 'radiogroup',
      }, tiles.value.map(renderTile)))

      children.push(
        hasError.value && errorMessage.value
          ? h('div', { class: 'q-form-error text-caption' }, errorMessage.value)
          : renderHint(),
      )

      return h('div', { class: ['q-images-renderer', rootClass.value] }, children)
    }
  },
})

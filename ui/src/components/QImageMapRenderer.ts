/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, ref, computed, watch, defineComponent, onMounted, onUnmounted } from 'vue'
import type { VNode } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QIcon, QSelect } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { omitOptions, RENDERER_OPTION_KEYS } from '../utils/options'
import { isSupportedImage } from './QImagesRenderer'

/** A clickable area of the image, in the pixels of the image */
export type ImageArea =
  | { shape: 'rect'; x: number; y: number; width: number; height: number }
  | { shape: 'circle'; cx: number; cy: number; r: number }
  | { shape: 'poly'; points: number[] }

/** The `image` option: a source, or a source with its natural size */
export interface ImageMapImage {
  src?: string
  width?: number
  height?: number
}

/** A region of the control: an option of the selection with its area */
export interface ImageRegion {
  value: any
  label: string
  area: ImageArea
}

const SHAPES: Record<string, ImageArea['shape']> = {
  rect: 'rect',
  rectangle: 'rect',
  circle: 'circle',
  circ: 'circle',
  poly: 'poly',
  polygon: 'poly',
}

/**
 * Parse an area definition, `{ shape, coords }` in the HTML `<area>`
 * convention: `rect` is `x1, y1, x2, y2`, `circle` is `cx, cy, r`, `poly` is
 * `x1, y1, x2, y2, ...`; the coords are an array of numbers or a comma / space
 * separated string. Returns `undefined` for a malformed definition.
 */
export function parseArea(input: unknown): ImageArea | undefined {
  if (!input || typeof input !== 'object') return undefined
  const { shape, coords } = input as { shape?: unknown; coords?: unknown }
  const kind = typeof shape === 'string' ? SHAPES[shape.trim().toLowerCase()] : undefined
  if (!kind) return undefined
  let values: number[]
  const toNumber = (value: unknown): number =>
    typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0) ? Number(value) : NaN
  if (Array.isArray(coords)) values = coords.map(toNumber)
  else if (typeof coords === 'string') values = coords.split(/[\s,]+/).filter((part) => part.length > 0).map((part) => Number(part))
  else return undefined
  if (values.some((value) => !isFinite(value))) return undefined
  if (kind === 'rect') {
    if (values.length !== 4) return undefined
    const [x1, y1, x2, y2] = values as [number, number, number, number]
    return { shape: 'rect', x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) }
  }
  if (kind === 'circle') {
    if (values.length !== 3 || values[2]! < 0) return undefined
    return { shape: 'circle', cx: values[0]!, cy: values[1]!, r: values[2]! }
  }
  if (values.length < 6 || values.length % 2 !== 0) return undefined
  return { shape: 'poly', points: values }
}

/**
 * Image map control: a single choice (`enum` / `oneOf` string) or multiple
 * choices (`uniqueItems` array of them) among the areas of one image. The area
 * of a value comes from the `area` key of its `oneOf` entry, or from the
 * `options.areas` map (`{ value: { shape, coords } }`). The areas are drawn as
 * an SVG overlay scaled to the image, and a QSelect below the image shows the
 * same selection.
 */
export default defineComponent({
  name: 'QImageMapRenderer',
  props: rendererProps(),
  setup(props: any) {
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const {
      isVisible, isEnabled, isReadonly, inputLabel, title, rootClass, hasError, errorMessage, options, selectOptions,
      maxValue, clearInvalidSelection, renderHeader, renderHint, hintSlot,
    } = useControlProperties(control)

    const { t } = useFormI18n()

    /** accessible name of the image and the overlay: the label, else the title */
    const name = computed<string | undefined>(() => inputLabel.value ?? (title.value ? t(title.value) : undefined))

    const isMultiple = computed(() => control.value.schema.type === 'array')

    const withSelect = computed(() => options.value.select !== false)

    const withOutline = computed(() => options.value.outline === true)

    const color = computed<string>(() => (typeof options.value.color === 'string' && options.value.color.length > 0 ? options.value.color : 'primary'))

    const image = computed<ImageMapImage>(() => {
      const value = options.value.image
      if (typeof value === 'string') return { src: value }
      if (value && typeof value === 'object') return value
      return {}
    })

    /** natural size of the loaded image, when the `image` option does not give it */
    const loadedSize = ref<{ width: number; height: number } | undefined>()

    const failed = ref(false)

    watch(() => image.value.src, () => {
      loadedSize.value = undefined
      failed.value = false
    })

    const size = computed<{ width: number; height: number } | undefined>(() => {
      const { width, height } = image.value
      if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) return { width, height }
      return loadedSize.value
    })

    /** `options.areas` entries, keyed by the string form of the value */
    const areaEntries = computed<Record<string, ImageArea>>(() => {
      const map = options.value.areas
      // no prototype: a value such as `toString` must not resolve to an inherited property
      const entries: Record<string, ImageArea> = Object.create(null)
      if (!map || typeof map !== 'object' || Array.isArray(map)) return entries
      Object.keys(map).forEach((key) => {
        const area = parseArea(map[key])
        if (area) entries[key] = area
      })
      return entries
    })

    const regions = computed<ImageRegion[]>(() =>
      selectOptions.value.flatMap((option) => {
        const area = areaEntries.value[String(option.value)] ?? parseArea(option.area)
        return area ? [{ value: option.value, label: option.label, area }] : []
      }),
    )

    // bound of a multiple choice: the filtrex `max` rule, else the schema `maxItems`
    const maxItems = computed<number | undefined>(() => {
      const value = maxValue.value ?? control.value.schema.maxItems
      return typeof value === 'number' && !isNaN(value) ? value : undefined
    })

    const selection = computed<any[]>(() => {
      const data = control.value.data
      if (isMultiple.value) return Array.isArray(data) ? data : []
      return data === undefined || data === null ? [] : [data]
    })

    const isSelected = (value: any): boolean => selection.value.includes(value)

    const isFull = computed(() => isMultiple.value && maxItems.value !== undefined && selection.value.length >= maxItems.value)

    /** the values in the order of the options */
    const normalize = (values: any[]): any[] => {
      const set = new Set(values)
      return selectOptions.value.map((option) => option.value).filter((value) => set.has(value))
    }

    const onChange = (value: any) => {
      // a cleared selection means "no value", so that `required` applies; an
      // array (the select emits the click order) follows the option order
      controlResult.handleChange(control.value.path, value === null ? undefined : (Array.isArray(value) ? normalize(value) : value))
    }

    const toggle = (region: ImageRegion) => {
      if (!isEnabled.value || isReadonly.value) return
      if (!isMultiple.value) {
        // a second click clears an optional single choice
        onChange(isSelected(region.value) && !control.value.required ? undefined : region.value)
        return
      }
      if (isSelected(region.value)) {
        onChange(selection.value.filter((value) => value !== region.value))
      } else if (!isFull.value) {
        onChange([...selection.value, region.value])
      }
    }

    const onKeydown = (event: KeyboardEvent, region: ImageRegion) => {
      if (event.key === ' ' || event.key === 'Enter' || event.key === 'Spacebar') {
        event.preventDefault()
        toggle(region)
      }
    }

    const onLoad = (event: Event) => {
      const target = event.target as HTMLImageElement | null
      if (target && target.naturalWidth > 0 && target.naturalHeight > 0) {
        loadedSize.value = { width: target.naturalWidth, height: target.naturalHeight }
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

    const frameStyle = computed(() => {
      const maxWidth = options.value.maxWidth
      return typeof maxWidth === 'number' ? { maxWidth: `${maxWidth}px` } : (typeof maxWidth === 'string' ? { maxWidth } : undefined)
    })

    const renderShape = (region: ImageRegion): VNode => {
      const selected = isSelected(region.value)
      const disabled = !isEnabled.value || (!selected && isFull.value)
      const area = region.area
      const attrs: Record<string, any> = {
        key: String(region.value),
        class: [
          'q-image-map__area',
          {
            'q-image-map__area--selected': selected,
            'q-image-map__area--outlined': withOutline.value,
            'q-image-map__area--readonly': isReadonly.value,
            disabled,
          },
        ],
        role: isMultiple.value ? 'checkbox' : 'radio',
        'aria-checked': selected ? 'true' : 'false',
        'aria-disabled': disabled ? 'true' : undefined,
        'aria-label': region.label,
        tabindex: disabled || isReadonly.value ? -1 : 0,
        onClick: () => toggle(region),
        onKeydown: (event: KeyboardEvent) => onKeydown(event, region),
      }
      const title = h('title', region.label)
      if (area.shape === 'rect') {
        return h('rect', { ...attrs, x: area.x, y: area.y, width: area.width, height: area.height }, [title])
      }
      if (area.shape === 'circle') {
        return h('circle', { ...attrs, cx: area.cx, cy: area.cy, r: area.r }, [title])
      }
      return h('polygon', { ...attrs, points: area.points.join(' ') }, [title])
    }

    const renderOverlay = (): VNode | null => {
      if (!size.value) return null
      return h('svg', {
        class: ['q-image-map__overlay', 'absolute-full', `text-${color.value}`],
        viewBox: `0 0 ${size.value.width} ${size.value.height}`,
        preserveAspectRatio: 'none',
        role: isMultiple.value ? 'group' : 'radiogroup',
        'aria-label': name.value,
      }, regions.value.map(renderShape))
    }

    const renderPlaceholder = (): VNode =>
      h('div', { class: 'q-image-map__placeholder flex flex-center' }, [
        h(QIcon, { name: 'broken_image', size: '2em' }),
      ])

    const renderFrame = (): VNode => {
      const src = image.value.src
      const children: (VNode | null)[] = []
      if (!isSupportedImage(src) || failed.value) {
        children.push(renderPlaceholder())
      } else {
        children.push(h('img', {
          class: 'q-image-map__image',
          src,
          alt: name.value ?? '',
          draggable: false,
          onLoad,
          onError: () => { failed.value = true },
        }))
        children.push(renderOverlay())
      }
      return h('div', {
        class: ['q-image-map', { 'q-form-readonly': isReadonly.value, disabled: !isEnabled.value }],
        style: frameStyle.value,
      }, children)
    }

    const renderSelect = (): VNode =>
      h(QSelect, {
        ...omitOptions(options.value, [...RENDERER_OPTION_KEYS, 'class']),
        class: 'q-image-map__select',
        modelValue: control.value.data,
        'onUpdate:modelValue': onChange,
        label: inputLabel.value,
        options: selectOptions.value,
        error: hasError.value,
        errorMessage: errorMessage.value,
        required: control.value.required,
        disable: !isEnabled.value && !isReadonly.value,
        readonly: isReadonly.value,
        emitValue: true,
        mapOptions: true,
        multiple: isMultiple.value,
        useChips: isMultiple.value,
        clearable: !control.value.required,
      }, {
        ...hintSlot.value,
      })

    return () => {
      if (!isVisible.value) {
        return null
      }

      const children: (VNode | null)[] = [...renderHeader(), renderFrame()]

      if (withSelect.value) {
        children.push(renderSelect())
      } else {
        children.push(
          hasError.value && errorMessage.value
            ? h('div', { class: 'q-form-error text-caption' }, errorMessage.value)
            : renderHint(),
        )
      }

      return h('div', { class: ['q-image-map-renderer', rootClass.value] }, children)
    }
  },
})

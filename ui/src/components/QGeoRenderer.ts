/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, ref, computed, watch, defineComponent, onBeforeUnmount } from 'vue'
import type { VNode } from 'vue'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { QBtn, QBtnToggle, QIcon, QInput, QSpinner, colors } from 'quasar'
import { useControlProperties } from '../composables/useControlProperties'
import { useFormI18n } from '../composables/useFormI18n'
import { renderMarkdownInline } from '../utils/markdown'
import {
  GEO_KINDS, GEO_PRECISION, GEO_TYPES, OSM_TILES, countPositions, geoKindOf, parseGeoKind, parseGeoKinds, parseGeometry, parseGeoTiles, parsePosition, roundCoordinate,
} from '../utils/geo'
import type { GeoGeometry, GeoKind, GeoPosition, GeoTiles } from '../utils/geo'
import type { GeoMap } from '../utils/geo-map'

export type { GeoGeometry, GeoKind, GeoPosition, GeoTiles, GeoType } from '../utils/geo'
export type { GeoMap, GeoMapOptions, GeoDrawOptions } from '../utils/geo-map'

const ICONS: Record<GeoKind, string> = { point: 'place', linestring: 'timeline', polygon: 'pentagon' }

const LOCATE_ZOOM = 15

/** `[lon, lat]` from a `center` option or config entry */
const parseCenter = (input: unknown): GeoPosition | undefined => parsePosition(input, 6)

/** A CSS color from a Quasar palette name (`primary`, `teal`...) or any CSS color */
const resolveColor = (name: string): string => {
  try {
    const palette = colors.getPaletteColor(name)
    if (palette) return palette
  } catch {
    // no document (SSR) or unknown name
  }
  return name
}

/** OpenLayers is loaded on demand, once, the first time a geo control is mounted */
let mapModule: Promise<typeof import('../utils/geo-map')> | undefined
const loadMapModule = () => {
  if (!mapModule) {
    mapModule = import('../utils/geo-map').catch((error) => {
      mapModule = undefined
      throw error
    })
  }
  return mapModule
}

/**
 * Geo control: a GeoJSON geometry (`Point`, `LineString` or `Polygon`, in
 * WGS84 longitude / latitude) drawn on a map. `options.geometries` restricts
 * the kinds, the toolbar picks the one to draw, locates the user and clears
 * the value. A point can also be typed as a latitude and a longitude.
 */
export default defineComponent({
  name: 'QGeoRenderer',
  props: rendererProps(),
  setup(props: any) {
    const controlResult = useJsonFormsControl(props)

    const control = controlResult.control

    const {
      isVisible, isEnabled, isReadonly, title, inputLabel, rootClass, hasError, errorMessage, options, config,
      renderHeader, renderHint,
    } = useControlProperties(control)

    const { t, translate } = useFormI18n()

    const name = computed<string | undefined>(() => inputLabel.value ?? (title.value ? t(title.value) : undefined))

    const isEditable = computed(() => isEnabled.value && !isReadonly.value)

    const geoConfig = computed<Record<string, any>>(() => (config.value.geo && typeof config.value.geo === 'object' ? config.value.geo : {}))

    const precision = computed<number>(() => {
      const value = options.value.precision ?? geoConfig.value.precision
      return typeof value === 'number' && isFinite(value) && value >= 0 ? Math.floor(value) : GEO_PRECISION
    })

    /** the kinds of geometry the control accepts: `options.geometries`, restricted by a `type` enum in the schema */
    const kinds = computed<GeoKind[]>(() => {
      const fromOptions = parseGeoKinds(options.value.geometries)
      const typeEnum = control.value.schema.properties?.type?.enum
      const fromSchema = parseGeoKinds(Array.isArray(typeEnum) ? typeEnum : undefined)
      const allowed = fromOptions.length > 0 ? fromOptions : GEO_KINDS
      const restricted = fromSchema.length > 0 ? allowed.filter((kind) => fromSchema.includes(kind)) : allowed
      return restricted.length > 0 ? restricted : allowed
    })

    const geometry = computed<GeoGeometry | undefined>(() => parseGeometry(control.value.data, precision.value))

    const serialized = computed<string | undefined>(() => (geometry.value ? JSON.stringify(geometry.value) : undefined))

    /** the kind being drawn: that of the value when allowed, else the first allowed kind */
    const mode = ref<GeoKind>(kinds.value[0]!)
    const alignMode = () => {
      const kind = geometry.value ? geoKindOf(geometry.value) : undefined
      if (kind && kinds.value.includes(kind)) mode.value = kind
      else if (!kinds.value.includes(mode.value)) mode.value = kinds.value[0]!
    }
    alignMode()

    const tiles = computed<GeoTiles>(() => parseGeoTiles(options.value.tiles) ?? parseGeoTiles(geoConfig.value.tiles) ?? OSM_TILES)

    const center = computed<GeoPosition | undefined>(() => parseCenter(options.value.center) ?? parseCenter(geoConfig.value.center))

    const zoom = computed<number | undefined>(() => {
      const value = options.value.zoom ?? geoConfig.value.zoom
      return typeof value === 'number' && isFinite(value) ? value : undefined
    })

    const color = computed<string>(() => (typeof options.value.color === 'string' && options.value.color.length > 0 ? options.value.color : 'primary'))

    const height = computed<string>(() => {
      const value = options.value.height ?? geoConfig.value.height
      return typeof value === 'number' ? `${value}px` : (typeof value === 'string' && value.length > 0 ? value : '320px')
    })

    const drawOptions = computed(() => {
      const bound = (value: unknown) => (typeof value === 'number' && isFinite(value) && value > 0 ? Math.floor(value) : undefined)
      return { minPoints: bound(options.value.minPoints), maxPoints: bound(options.value.maxPoints) }
    })

    /** the tiles in a scale of greys (inverted in dark mode), unless `grayscale: false` */
    const isGrayscale = computed(() => (options.value.grayscale ?? geoConfig.value.grayscale) !== false)

    const withInputs = computed(() => options.value.inputs !== false && kinds.value.includes('point'))

    const canLocate = computed(() =>
      options.value.locate !== false && typeof navigator !== 'undefined' && !!navigator.geolocation)

    const onChange = (value: GeoGeometry | undefined) => {
      controlResult.handleChange(control.value.path, value)
    }

    // --- map -----------------------------------------------------------------

    const mapEl = ref<HTMLElement | undefined>()
    const loading = ref(false)
    const loadFailed = ref(false)
    let map: GeoMap | undefined
    /** the last geometry written by the map, not to be sent back to it */
    let lastEmitted: string | undefined

    const applyMode = () => {
      map?.setMode(isEditable.value ? mode.value : undefined, drawOptions.value)
    }

    const destroyMap = () => {
      map?.destroy()
      map = undefined
    }

    const initMap = async (target: HTMLElement) => {
      loading.value = true
      loadFailed.value = false
      let createGeoMap: typeof import('../utils/geo-map').createGeoMap
      try {
        createGeoMap = (await loadMapModule()).createGeoMap
      } catch (error) {
        console.error('[quasar-json-form] the map of the geo control could not be loaded', error)
        loading.value = false
        loadFailed.value = true
        return
      }
      loading.value = false
      // unmounted or hidden while loading
      if (mapEl.value !== target || map) return
      map = createGeoMap(target, {
        tiles: tiles.value,
        color: resolveColor(color.value),
        precision: precision.value,
        onChange: (value) => {
          lastEmitted = value ? JSON.stringify(value) : undefined
          locateError.value = undefined
          onChange(value)
        },
      })
      lastEmitted = serialized.value
      map.setGeometry(geometry.value, true)
      if (!geometry.value && center.value) map.setCenter(center.value, zoom.value ?? 12)
      else if (!geometry.value && zoom.value !== undefined) map.setCenter([0, 0], zoom.value)
      applyMode()
    }

    watch(mapEl, (target) => {
      destroyMap()
      if (target) initMap(target)
    }, { flush: 'post' })

    watch(serialized, (value) => {
      alignMode()
      if (!map || value === lastEmitted) return
      lastEmitted = value
      map.setGeometry(geometry.value, true)
    })

    watch([mode, isEditable, drawOptions], applyMode)

    watch(tiles, () => {
      // a new tile source: rebuild the map
      if (mapEl.value) {
        destroyMap()
        initMap(mapEl.value)
      }
    })

    watch(isVisible, (visible) => {
      if (visible === false) onChange(undefined)
    })

    onBeforeUnmount(destroyMap)

    // --- locate --------------------------------------------------------------

    const locating = ref(false)
    const locateError = ref<string | undefined>()

    const locate = () => {
      if (!canLocate.value || locating.value || !isEditable.value) return
      locating.value = true
      locateError.value = undefined
      navigator.geolocation.getCurrentPosition(
        (result) => {
          locating.value = false
          const position: GeoPosition = [roundCoordinate(result.coords.longitude, precision.value), roundCoordinate(result.coords.latitude, precision.value)]
          if (mode.value === 'point') {
            onChange({ type: 'Point', coordinates: position })
          } else {
            map?.setCenter(position, LOCATE_ZOOM)
          }
        },
        () => {
          locating.value = false
          locateError.value = translate('geo.locateError')
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      )
    }

    const clear = () => {
      if (!isEditable.value) return
      locateError.value = undefined
      onChange(undefined)
    }

    // --- point inputs --------------------------------------------------------

    const point = computed<GeoPosition | undefined>(() => (geometry.value?.type === 'Point' ? geometry.value.coordinates : undefined))

    const latInput = ref<string>('')
    const lonInput = ref<string>('')

    watch(point, (value) => {
      latInput.value = value ? String(value[1]) : ''
      lonInput.value = value ? String(value[0]) : ''
    }, { immediate: true })

    const onInput = () => {
      if (latInput.value.trim() === '' && lonInput.value.trim() === '') {
        if (point.value) onChange(undefined)
        return
      }
      const position = parsePosition([lonInput.value, latInput.value], precision.value)
      if (position && (!point.value || position[0] !== point.value[0] || position[1] !== point.value[1])) {
        locateError.value = undefined
        onChange({ type: 'Point', coordinates: position })
      }
    }

    // --- rendering -----------------------------------------------------------

    const renderToolbar = (): VNode | null => {
      if (isReadonly.value) return null
      const children: VNode[] = []
      if (kinds.value.length > 1) {
        children.push(h(QBtnToggle, {
          class: 'q-geo__modes',
          modelValue: mode.value,
          'onUpdate:modelValue': (value: GeoKind) => { mode.value = value },
          options: kinds.value.map((kind) => ({ value: kind, icon: ICONS[kind], label: translate(`geo.${kind}`), slot: kind })),
          disable: !isEnabled.value,
          dense: true,
          unelevated: true,
          noCaps: true,
          toggleColor: color.value,
          size: 'sm',
        }))
      }
      if (canLocate.value) {
        children.push(h(QBtn, {
          class: 'q-geo__locate',
          icon: 'my_location',
          label: translate('geo.locate'),
          loading: locating.value,
          disable: !isEnabled.value,
          dense: true,
          flat: true,
          noCaps: true,
          size: 'sm',
          onClick: locate,
        }))
      }
      children.push(h(QBtn, {
        class: 'q-geo__clear',
        icon: 'clear',
        label: translate('geo.clear'),
        disable: !isEnabled.value || !geometry.value,
        dense: true,
        flat: true,
        noCaps: true,
        size: 'sm',
        onClick: clear,
      }))
      return h('div', { class: 'q-geo__toolbar row items-center q-gutter-x-sm' }, children)
    }

    const renderMap = (): VNode => {
      const children: VNode[] = []
      if (loadFailed.value) {
        children.push(h('div', { class: 'q-geo__placeholder absolute-full flex flex-center column' }, [
          h(QIcon, { name: 'map', size: '2em' }),
          h('div', { class: 'text-caption' }, translate('geo.loadError')),
        ]))
      } else if (loading.value) {
        children.push(h('div', { class: 'q-geo__placeholder absolute-full flex flex-center' }, [h(QSpinner, { size: '2em' })]))
      }
      return h('div', {
        class: 'q-geo__map',
        style: { height: height.value },
        role: 'application',
        'aria-label': name.value,
        ref: mapEl,
      }, children)
    }

    const renderAttribution = (): VNode | null => {
      const text = tiles.value.attributions
      if (!text) return null
      return h('div', { class: 'q-geo__attribution text-caption', innerHTML: renderMarkdownInline(text) })
    }

    const renderInputs = (): VNode => {
      const shared = {
        type: 'number',
        step: 'any',
        dense: true,
        outlined: true,
        hideBottomSpace: true,
        disable: !isEnabled.value && !isReadonly.value,
        readonly: isReadonly.value,
        error: hasError.value,
      }
      return h('div', { class: 'q-geo__inputs row q-col-gutter-sm' }, [
        h('div', { class: 'col-6' }, [h(QInput, {
          ...shared,
          class: 'q-geo__latitude',
          modelValue: latInput.value,
          'onUpdate:modelValue': (value: string | number | null) => { latInput.value = value === null ? '' : String(value); onInput() },
          label: translate('geo.latitude'),
          min: -90,
          max: 90,
        })]),
        h('div', { class: 'col-6' }, [h(QInput, {
          ...shared,
          class: 'q-geo__longitude',
          modelValue: lonInput.value,
          'onUpdate:modelValue': (value: string | number | null) => { lonInput.value = value === null ? '' : String(value); onInput() },
          label: translate('geo.longitude'),
          min: -180,
          max: 180,
        })]),
      ])
    }

    const renderSummary = (): VNode | null => {
      if (!geometry.value || geometry.value.type === 'Point') return null
      return h('div', { class: 'q-geo__summary text-caption' }, translate(`geo.${geoKindOf(geometry.value)}`) + ': ' + translate('geo.points', { count: countPositions(geometry.value) }))
    }

    return () => {
      if (!isVisible.value) {
        return null
      }

      const frame = h('div', {
        class: ['q-geo', `text-${color.value}`, { 'q-geo--grayscale': isGrayscale.value, 'q-form-readonly': isReadonly.value, disabled: !isEnabled.value }],
      }, [renderToolbar(), renderMap(), renderAttribution()])

      const children: (VNode | null)[] = [...renderHeader(), frame]
      // the inputs of a point: while drawing one, or to display the value (only the value when read-only)
      if (withInputs.value && (point.value || (mode.value === 'point' && !isReadonly.value))) children.push(renderInputs())
      children.push(renderSummary())
      if (locateError.value) children.push(h('div', { class: 'q-geo__locate-error q-form-error text-caption' }, locateError.value))
      children.push(
        hasError.value && errorMessage.value
          ? h('div', { class: 'q-form-error text-caption' }, errorMessage.value)
          : renderHint(),
      )

      return h('div', { class: ['q-geo-renderer', rootClass.value] }, children)
    }
  },
})

/** exported for applications building their own geo renderer */
export { parseGeometry, parseGeoKind, parseGeoKinds, parseGeoTiles, parsePosition, roundCoordinate, countPositions, geoKindOf, GEO_KINDS, GEO_TYPES, GEO_PRECISION, OSM_TILES }

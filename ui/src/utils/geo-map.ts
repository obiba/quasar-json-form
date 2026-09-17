/**
 * OpenLayers adapter of the geo control: the only module of the library that
 * imports the mapping library. It is loaded on demand by the renderer
 * (dynamic import), so applications that render no geo control do not load
 * OpenLayers. The renderer only relies on the `GeoMap` interface, which the
 * tests mock.
 */
import Map from 'ol/Map.js'
import View from 'ol/View.js'
import Feature from 'ol/Feature.js'
import TileLayer from 'ol/layer/Tile.js'
import VectorLayer from 'ol/layer/Vector.js'
import XYZ from 'ol/source/XYZ.js'
import VectorSource from 'ol/source/Vector.js'
import GeoJSON from 'ol/format/GeoJSON.js'
import Draw from 'ol/interaction/Draw.js'
import Modify from 'ol/interaction/Modify.js'
import { fromLonLat } from 'ol/proj.js'
import { asArray } from 'ol/color.js'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js'
import type { Geometry } from 'ol/geom.js'
import { GEO_PRECISION, GEO_TYPES, parseGeometry } from './geo'
import type { GeoGeometry, GeoKind, GeoPosition, GeoTiles } from './geo'

export interface GeoMapOptions {
  tiles: GeoTiles
  /** CSS color of the drawn geometry */
  color?: string
  /** number of decimals of the emitted coordinates */
  precision?: number
  /** called with the geometry drawn or modified on the map */
  onChange: (geometry: GeoGeometry | undefined) => void
}

export interface GeoDrawOptions {
  minPoints?: number
  maxPoints?: number
}

/** What the renderer needs from the map */
export interface GeoMap {
  /** display a geometry (or none), fitting the view to it when asked */
  setGeometry(geometry: GeoGeometry | undefined, fit?: boolean): void
  /** enable the drawing of the given kind (a new geometry replaces the current one) and the editing of the vertices, or disable both */
  setMode(kind: GeoKind | undefined, options?: GeoDrawOptions): void
  /** center the view on a position, at the given zoom when any */
  setCenter(position: GeoPosition, zoom?: number): void
  /** fit the view to the current geometry; false when there is none */
  fit(): boolean
  /** notify a size change of the target element */
  updateSize(): void
  destroy(): void
}

const FIT_OPTIONS = { padding: [40, 40, 40, 40], maxZoom: 16, duration: 0 }

/** `rgba` of a CSS color with the given alpha */
const withAlpha = (color: string, alpha: number): string => {
  try {
    const [r, g, b] = asArray(color)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } catch {
    return color
  }
}

const createStyle = (color: string): Style => {
  const stroke = new Stroke({ color, width: 3 })
  return new Style({
    stroke,
    fill: new Fill({ color: withAlpha(color, 0.25) }),
    image: new CircleStyle({ radius: 7, fill: new Fill({ color }), stroke: new Stroke({ color: '#fff', width: 2 }) }),
  })
}

/**
 * Create a map on the element: one tile layer, one vector layer holding the
 * geometry of the control, in the Web Mercator projection of the tiles while
 * the geometries exchanged with the renderer are GeoJSON in WGS84.
 */
export function createGeoMap(target: HTMLElement, options: GeoMapOptions): GeoMap {
  const color = options.color || '#1976d2'
  const format = new GeoJSON()
  const projections = { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' }
  const decimals = options.precision ?? GEO_PRECISION

  const source = new VectorSource<Feature<Geometry>>()
  const style = createStyle(color)
  const view = new View({ center: fromLonLat([0, 0]), zoom: 1 })
  const map = new Map({
    target,
    controls: [],
    layers: [
      // its own element, so that the renderer can filter the tiles (grayscale) without the geometry
      new TileLayer({ className: 'q-geo__tiles', source: new XYZ({ url: options.tiles.url, crossOrigin: 'anonymous' }) }),
      new VectorLayer({ source, style }),
    ],
    view,
  })

  let draw: Draw | undefined
  let modify: Modify | undefined

  const current = (): Feature<Geometry> | undefined => source.getFeatures()[0]

  const emit = () => {
    const feature = current()
    const geometry = feature?.getGeometry()
    if (!geometry) {
      options.onChange(undefined)
      return
    }
    const object = format.writeGeometryObject(geometry, { ...projections, decimals })
    options.onChange(parseGeometry(object, decimals))
  }

  const fit = (): boolean => {
    const geometry = current()?.getGeometry()
    if (!geometry) return false
    view.fit(geometry.getExtent(), FIT_OPTIONS)
    return true
  }

  const removeInteractions = () => {
    if (draw) {
      map.removeInteraction(draw)
      draw = undefined
    }
    if (modify) {
      map.removeInteraction(modify)
      modify = undefined
    }
  }

  return {
    setGeometry(geometry, fitView = false) {
      source.clear()
      if (geometry) {
        const feature = new Feature(format.readGeometry(geometry, projections))
        source.addFeature(feature)
        if (fitView) fit()
      }
    },

    setMode(kind, drawOptions = {}) {
      removeInteractions()
      if (!kind) return
      modify = new Modify({ source, style })
      modify.on('modifyend', emit)
      map.addInteraction(modify)
      draw = new Draw({
        type: GEO_TYPES[kind],
        style,
        minPoints: drawOptions.minPoints,
        maxPoints: drawOptions.maxPoints,
      })
      draw.on('drawend', (event) => {
        // one geometry per control: the new one replaces the current one
        source.clear()
        source.addFeature(event.feature as Feature<Geometry>)
        emit()
      })
      map.addInteraction(draw)
    },

    setCenter(position, zoom) {
      view.setCenter(fromLonLat(position))
      if (typeof zoom === 'number') view.setZoom(zoom)
    },

    fit,

    updateSize() {
      map.updateSize()
    },

    destroy() {
      removeInteractions()
      map.setTarget(undefined)
      map.dispose()
    },
  }
}

export default createGeoMap

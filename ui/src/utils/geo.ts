/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Geometry helpers of the geo control, free of any mapping library: the data
 * of the control is a GeoJSON geometry (RFC 7946) in WGS84 longitude /
 * latitude, one of `Point`, `LineString` and `Polygon`.
 */

/** The kinds of geometry a geo control can hold, as written in `options.geometries` */
export type GeoKind = 'point' | 'linestring' | 'polygon'

/** A `[longitude, latitude]` position */
export type GeoPosition = [number, number]

export type GeoGeometry =
  | { type: 'Point'; coordinates: GeoPosition }
  | { type: 'LineString'; coordinates: GeoPosition[] }
  | { type: 'Polygon'; coordinates: GeoPosition[][] }

export type GeoType = GeoGeometry['type']

/** The kinds in the order of the toolbar */
export const GEO_KINDS: GeoKind[] = ['point', 'linestring', 'polygon']

/** GeoJSON `type` of each kind */
export const GEO_TYPES: Record<GeoKind, GeoType> = { point: 'Point', linestring: 'LineString', polygon: 'Polygon' }

/** Default number of decimals of the coordinates (about 10 cm) */
export const GEO_PRECISION = 6

const KIND_ALIASES: Record<string, GeoKind> = {
  point: 'point',
  marker: 'point',
  linestring: 'linestring',
  line: 'linestring',
  polyline: 'linestring',
  polygon: 'polygon',
  poly: 'polygon',
  area: 'polygon',
}

/** The kind named by `point`, `line` / `linestring`, `polygon`, or a GeoJSON type, case-insensitive */
export function parseGeoKind(input: unknown): GeoKind | undefined {
  return typeof input === 'string' ? KIND_ALIASES[input.trim().toLowerCase()] : undefined
}

/** The kinds of a `geometries` option (an array or a comma separated string), in the toolbar order, without duplicates */
export function parseGeoKinds(input: unknown): GeoKind[] {
  const values = Array.isArray(input) ? input : (typeof input === 'string' ? input.split(/[\s,]+/) : [])
  const kinds = new Set(values.map(parseGeoKind).filter((kind): kind is GeoKind => kind !== undefined))
  return GEO_KINDS.filter((kind) => kinds.has(kind))
}

export function geoKindOf(geometry: GeoGeometry): GeoKind {
  return geometry.type === 'Point' ? 'point' : (geometry.type === 'LineString' ? 'linestring' : 'polygon')
}

/** Round to `precision` decimals (a negative or non-finite precision leaves the value as is) */
export function roundCoordinate(value: number, precision: number = GEO_PRECISION): number {
  if (!isFinite(precision) || precision < 0) return value
  const factor = Math.pow(10, Math.floor(precision))
  return Math.round(value * factor) / factor
}

const toNumber = (value: unknown): number =>
  typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0) ? Number(value) : NaN

/**
 * A `[longitude, latitude]` position from an array of numbers or numeric
 * strings (an altitude or any further element is dropped), rounded to
 * `precision` decimals; `undefined` when malformed or out of range.
 */
export function parsePosition(input: unknown, precision: number = GEO_PRECISION): GeoPosition | undefined {
  if (!Array.isArray(input) || input.length < 2) return undefined
  const lon = toNumber(input[0])
  const lat = toNumber(input[1])
  if (!isFinite(lon) || !isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) return undefined
  return [roundCoordinate(lon, precision), roundCoordinate(lat, precision)]
}

const samePosition = (a: GeoPosition, b: GeoPosition): boolean => a[0] === b[0] && a[1] === b[1]

const parsePositions = (input: unknown, precision: number): GeoPosition[] | undefined => {
  if (!Array.isArray(input)) return undefined
  const positions = input.map((item) => parsePosition(item, precision))
  return positions.every((position): position is GeoPosition => position !== undefined) ? positions : undefined
}

/**
 * A GeoJSON geometry from any input: `Point`, `LineString` (2 positions or
 * more) or `Polygon` (rings of 3 positions or more, closed when needed), the
 * coordinates rounded to `precision` decimals. `undefined` for anything else
 * (a `Feature` is unwrapped to its geometry).
 */
export function parseGeometry(input: unknown, precision: number = GEO_PRECISION): GeoGeometry | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined
  const value = input as { type?: unknown; coordinates?: unknown; geometry?: unknown }
  if (value.type === 'Feature') return parseGeometry(value.geometry, precision)
  if (value.type === 'Point') {
    const position = parsePosition(value.coordinates, precision)
    return position ? { type: 'Point', coordinates: position } : undefined
  }
  if (value.type === 'LineString') {
    const positions = parsePositions(value.coordinates, precision)
    return positions && positions.length >= 2 ? { type: 'LineString', coordinates: positions } : undefined
  }
  if (value.type === 'Polygon') {
    if (!Array.isArray(value.coordinates) || value.coordinates.length === 0) return undefined
    const rings: GeoPosition[][] = []
    for (const item of value.coordinates) {
      const ring = parsePositions(item, precision)
      if (!ring || ring.length < 3) return undefined
      if (!samePosition(ring[0]!, ring[ring.length - 1]!)) ring.push([...ring[0]!] as GeoPosition)
      if (ring.length < 4) return undefined
      rings.push(ring)
    }
    return { type: 'Polygon', coordinates: rings }
  }
  return undefined
}

/** Number of distinct positions of a geometry (the closing position of a ring is not counted) */
export function countPositions(geometry: GeoGeometry): number {
  if (geometry.type === 'Point') return 1
  if (geometry.type === 'LineString') return geometry.coordinates.length
  return geometry.coordinates.reduce((total, ring) => total + ring.length - 1, 0)
}

/** The tile layer of the map: an XYZ URL template and its attributions (markdown) */
export interface GeoTiles {
  url: string
  attributions?: string
}

/** OpenStreetMap standard tiles, the default */
export const OSM_TILES: GeoTiles = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attributions: '© [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors',
}

/** A `tiles` option or config entry: a URL template, or `{ url, attributions }` */
export function parseGeoTiles(input: unknown): GeoTiles | undefined {
  if (typeof input === 'string') return input.trim().length > 0 ? { url: input.trim() } : undefined
  if (!input || typeof input !== 'object') return undefined
  const { url, attributions } = input as { url?: unknown; attributions?: unknown }
  if (typeof url !== 'string' || url.trim().length === 0) return undefined
  return { url: url.trim(), attributions: typeof attributions === 'string' ? attributions : undefined }
}

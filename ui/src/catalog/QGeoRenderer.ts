import type { RendererApi } from './types'

export default {
  name: 'QGeoRenderer',
  kind: 'control',
  inherits: 'control',
  triggers: [
    {
      schema: '{ "type": "object", "format": "geo" }',
      rank: 6,
      desc: 'A GeoJSON geometry drawn on a map; `geojson` is accepted too, in the schema or as `options.format`.',
    },
  ],
  options: {
    format: {
      type: 'String',
      desc: '`geo` (or `geojson`), also accepted as the schema `format`.',
    },
    geometries: {
      type: 'Array | String',
      default: 'all',
      desc: 'Kinds of geometry the control accepts, among `point`, `linestring` (or `line`) and `polygon`, as an array or a comma separated string. A `type` property with an `enum` of GeoJSON types in the schema restricts them too. With several kinds, the toolbar selects the one to draw.',
    },
    tiles: {
      type: 'String | Object',
      default: 'OpenStreetMap',
      desc: 'Tile source of the map: a `{z}/{x}/{y}` URL template, or `{ url, attributions }` with the attributions (markdown) displayed under the map. Defaults to `config.geo.tiles`, then the OpenStreetMap standard tiles.',
    },
    center: {
      type: 'Array',
      desc: '`[lon, lat]` center of the initial view when there is no value (defaults to `config.geo.center`, then a world view).',
    },
    zoom: {
      type: 'Number',
      desc: 'Zoom of the initial view when there is no value (defaults to `config.geo.zoom`, then 12 with a `center`); without a `center`, the zoom of the world view.',
    },
    height: {
      type: 'Number | String',
      default: '320',
      desc: 'Height of the map, in px when a number (defaults to `config.geo.height`).',
    },
    color: {
      type: 'String',
      default: 'primary',
      desc: 'Quasar color (or any CSS color) of the drawn geometry and of the selected draw mode.',
    },
    precision: {
      type: 'Number',
      default: '6',
      desc: 'Number of decimals of the coordinates (defaults to `config.geo.precision`).',
    },
    minPoints: {
      type: 'Number',
      desc: 'Minimum number of points of a line or a polygon being drawn.',
    },
    maxPoints: {
      type: 'Number',
      desc: 'Maximum number of points of a line or a polygon being drawn (the drawing finishes when reached).',
    },
    inputs: {
      type: 'Boolean',
      default: 'true',
      desc: 'Show latitude and longitude inputs under the map when a point is allowed, to display and type the value.',
    },
    grayscale: {
      type: 'Boolean',
      default: 'true',
      desc: 'Display the tiles in a scale of greys (inverted in dark mode), the geometry keeping its color; `false` keeps the colors of the tiles (defaults to `config.geo.grayscale`).',
    },
    locate: {
      type: 'Boolean',
      default: 'true',
      desc: 'Show the **My position** button (only when the Geolocation API is available): for a point it writes the current position, for a line or a polygon it centers the map on it.',
    },
  },
  validation: {
    required: {
      message: 'error.required',
      desc: 'A required control with no value (AJV).',
    },
  },
  data: {
    desc: 'A GeoJSON geometry in WGS84 longitude / latitude: `Point`, `LineString` or `Polygon` (rings closed on their first position), or no value. Drawing replaces the current geometry, **Clear** removes it. Read-only, the map can be browsed but not edited; a hidden control (`rules.visible`) loses its value; a value that is not a valid geometry is displayed as nothing and left untouched until the user acts.',
    example: '{ "location": { "type": "Point", "coordinates": [-73.5673, 45.5017] } }',
  },
  items: [
    {
      name: 'geo',
      label: 'Map location',
      icon: 'place',
      schema: {
        type: 'object',
        format: 'geo',
      },
      formats: ['geojson'],
      uischema: {
        type: 'Control',
      },
    },
  ],
} satisfies RendererApi

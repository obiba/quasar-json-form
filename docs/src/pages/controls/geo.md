---
title: Geo
---

# Geo

<p class="doc-lead">The <code>geo</code> format renders a map on which a point, a line or a polygon is drawn: the value is a <a href="https://datatracker.ietf.org/doc/html/rfc7946" target="_blank">GeoJSON</a> geometry.</p>

`format: "geo"` (or `geojson`) on an object property, in the schema or in the `options` of the
control, displays a map. The data is a GeoJSON geometry in WGS84 longitude / latitude:
`{ "type": "Point", "coordinates": [lon, lat] }`, a `LineString` (an array of positions) or a
`Polygon` (an array of rings, each closed on its first position). The coordinates are rounded to
`options.precision` decimals (6 by default, about 10 cm).

The kinds of geometry the control accepts come from `options.geometries`, any subset of `point`,
`linestring` (or `line`) and `polygon`, all three by default; a `type` property with an `enum` of
GeoJSON types in the schema restricts them too. When several kinds are allowed, the toolbar
selects the one to draw. Click the map to place a point, or to add the points of a line or a
polygon, double click to finish; a vertex can then be dragged, and drawing again replaces the
value. **My position** uses the Geolocation API of the browser: for a point it writes the current
position, for a line or a polygon it centers the map on it (the button is not displayed when the
API is unavailable, `options.locate: false` hides it). **Clear** removes the value.

The map is built with [OpenLayers](https://openlayers.org/), loaded on demand the first time a geo
control is displayed. The tiles are those of OpenStreetMap by default, with their attribution under
the map: `options.tiles` (a `{z}/{x}/{y}` URL template, or `{ url, attributions }`) selects another
source. The tiles are displayed in a scale of greys (inverted in dark mode) so that the geometry stands out,
`options.grayscale: false` keeps their colors. The initial view fits the value, else `options.center`
(`[lon, lat]`) and `options.zoom`. The form `config.geo` gives defaults for `tiles`, `center`, `zoom`,
`height`, `precision` and `grayscale`:
`<QJsonForm :config="{ geo: { tiles: { url, attributions }, center: [lon, lat], zoom: 6 } }" />`.

## Point

When a point is allowed, latitude and longitude inputs under the map show the value and accept
one typed in (`options.inputs: false` hides them). The map fits the point once both are valid.

<DocExample name="geo/point" title="One point" source />

## Line and polygon

`options.minPoints` and `options.maxPoints` bound the number of points of a line or a polygon while
drawing. The number of points of the value is displayed under the map.

<DocExample name="geo/shapes" title="A line or a polygon" />

## API

<DocApi name="QGeoRenderer" />

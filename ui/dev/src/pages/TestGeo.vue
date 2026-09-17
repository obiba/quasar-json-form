<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Geo</div>
    <FormPresenter :data="formData" :schema="schema" :uischema="uischema" :config="config" />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';

const formData = ref({
  location: { type: 'Point', coordinates: [-73.5673, 45.5017] },
  area: { type: 'Polygon', coordinates: [[[-73.58, 45.49], [-73.55, 45.49], [-73.55, 45.51], [-73.58, 45.51], [-73.58, 45.49]]] },
});

const schema = {
  type: 'object',
  properties: {
    location: {
      type: 'object',
      title: 'Location (required point)',
      description: 'Click the map, use your position or type the coordinates',
      format: 'geo',
    },
    area: {
      type: 'object',
      title: 'Area (polygon, 3 to 8 points)',
      format: 'geo',
    },
    route: {
      type: 'object',
      title: 'Route or area (line or polygon, schema type enum)',
      properties: {
        type: { type: 'string', enum: ['LineString', 'Polygon'] },
        coordinates: { type: 'array' },
      },
    },
    any: {
      type: 'object',
      title: 'Any geometry (custom tiles in color, view and color, no inputs)',
    },
    readonly: {
      type: 'object',
      title: 'Read-only',
      readOnly: true,
    },
    show: { type: 'boolean', title: 'Enable the disabled one' },
    disabled: {
      type: 'object',
      title: 'Disabled unless enabled',
    },
  },
  required: ['location'],
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/location', options: { geometries: ['point'], height: 280 }, hint: 'A point, in WGS84 longitude / latitude' },
    { type: 'Control', scope: '#/properties/area', options: { geometries: 'polygon', minPoints: 3, maxPoints: 8, color: 'deep-orange' } },
    { type: 'Control', scope: '#/properties/route', options: { format: 'geo' } },
    {
      type: 'Control',
      scope: '#/properties/any',
      options: {
        format: 'geo',
        inputs: false,
        grayscale: false,
        color: 'teal',
        center: [2.3522, 48.8566],
        zoom: 11,
        tiles: {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          attributions: 'Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors',
        },
      },
    },
    { type: 'Control', scope: '#/properties/readonly', options: { format: 'geo' } },
    { type: 'Control', scope: '#/properties/show' },
    { type: 'Control', scope: '#/properties/disabled', options: { format: 'geo' }, rules: { enabled: 'truthy(show)' } },
  ],
};

const config = {
  geo: { center: [-73.5673, 45.5017], zoom: 12, height: 240 },
};
</script>

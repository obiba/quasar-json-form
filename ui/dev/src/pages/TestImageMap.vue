<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Image map</div>
    <FormPresenter :data="formData" :schema="schema" :uischema="uischema" />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';

const formData = ref({ room: 'kitchen', rooms: ['kitchen', 'pool'] });

const entries = [
  { const: 'kitchen', title: 'Kitchen', area: { shape: 'rect', coords: [20, 20, 220, 180] } },
  { const: 'living', title: 'Living room', area: { shape: 'rect', coords: [240, 20, 580, 180] } },
  { const: 'bedroom', title: 'Bedroom', area: { shape: 'rect', coords: [20, 200, 220, 380] } },
  { const: 'bathroom', title: 'Bathroom', area: { shape: 'rect', coords: [240, 200, 360, 380] } },
  { const: 'patio', title: 'Patio', area: { shape: 'poly', coords: [380, 200, 580, 200, 380, 380] } },
  { const: 'pool', title: 'Pool', area: { shape: 'circle', coords: [520, 330, 40] } },
  { const: 'garage', title: 'Garage (no area)' },
];

const schema = {
  type: 'object',
  properties: {
    room: {
      type: 'string',
      title: 'Room (required)',
      description: 'A second click does not clear a required choice',
      oneOf: entries,
    },
    side: {
      type: 'string',
      title: 'Side (enum, areas map, no select, outlined)',
      enum: ['left', 'right', 'other'],
    },
    rooms: {
      type: 'array',
      title: 'Rooms (max 3)',
      uniqueItems: true,
      maxItems: 3,
      items: { type: 'string', oneOf: entries },
    },
    missing: {
      type: 'string',
      title: 'Missing image',
      oneOf: entries.slice(0, 2),
    },
    readonly: {
      type: 'string',
      title: 'Read-only',
      oneOf: entries.slice(0, 4),
      readOnly: true,
    },
    show: { type: 'boolean', title: 'Enable the disabled one' },
    disabled: {
      type: 'string',
      title: 'Disabled unless enabled',
      oneOf: entries.slice(0, 4),
    },
  },
  required: ['room'],
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/room', options: { format: 'image-map', image: 'images/floor-plan.png', maxWidth: 480, color: 'teal', dense: true }, hint: 'Teal, dense select' },
    {
      type: 'Control',
      scope: '#/properties/side',
      options: {
        format: 'image-map',
        image: { src: 'images/floor-plan.png', width: 600, height: 400 },
        maxWidth: 360,
        select: false,
        outline: true,
        areas: {
          left: { shape: 'rect', coords: '0, 0, 230, 400' },
          right: { shape: 'rect', coords: '230, 0, 600, 400' },
        },
      },
      hint: 'Left or right',
    },
    { type: 'Control', scope: '#/properties/rooms', options: { format: 'image-map', image: 'images/floor-plan.png', maxWidth: 480, color: 'deep-orange' } },
    { type: 'Control', scope: '#/properties/missing', options: { format: 'image-map', image: 'images/nope.png', maxWidth: 480 } },
    { type: 'Control', scope: '#/properties/readonly', options: { format: 'image-map', image: 'images/floor-plan.png', maxWidth: 360 } },
    { type: 'Control', scope: '#/properties/show' },
    { type: 'Control', scope: '#/properties/disabled', options: { format: 'image-map', image: 'images/floor-plan.png', maxWidth: 360 }, rules: { enabled: 'truthy(show)' } },
  ],
};
</script>

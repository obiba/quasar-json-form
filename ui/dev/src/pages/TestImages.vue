<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Images</div>
    <FormPresenter :data="formData" :schema="schema" :uischema="uischema" />
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';

const formData = ref({ landscape: 'forest', places: ['forest', 'lake'], ranked: ['city', 'sunset'] });

const entries = [
  { const: 'sunset', title: 'Sunset', image: 'images/sunset.webp' },
  { const: 'mountains', title: 'Mountains', image: 'images/mountains.jpg' },
  { const: 'forest', title: 'Forest', image: 'images/forest.png' },
  { const: 'desert', title: 'Desert', image: 'images/desert.webp' },
  { const: 'city', title: 'City', image: 'images/city.jpg' },
  { const: 'lake', title: 'Lake', image: 'images/lake.png' },
];

const schema = {
  type: 'object',
  properties: {
    landscape: {
      type: 'string',
      title: 'Favorite landscape (required)',
      description: 'A second click does not clear a required choice',
      oneOf: entries,
    },
    size: {
      type: 'string',
      title: 'Format (enum, images map, missing image)',
      enum: ['small', 'large', 'other'],
    },
    places: {
      type: 'array',
      title: 'Places to visit (max 3)',
      uniqueItems: true,
      maxItems: 3,
      items: { type: 'string', oneOf: entries },
    },
    ranked: {
      type: 'array',
      title: 'Ranked preferences (ordering)',
      uniqueItems: true,
      items: { type: 'string', oneOf: entries.slice(0, 4) },
    },
    cover: {
      type: 'string',
      title: 'Cover (placement, no captions)',
      oneOf: [
        { const: 'city', title: 'City', image: 'images/city.jpg', grid: { colSpan: 2, rowSpan: 2 } },
        ...entries.slice(0, 4),
      ],
    },
    readonly: {
      type: 'string',
      title: 'Read-only',
      oneOf: entries.slice(0, 3),
      readOnly: true,
    },
    show: { type: 'boolean', title: 'Enable the disabled one' },
    disabled: {
      type: 'string',
      title: 'Disabled unless enabled',
      oneOf: entries.slice(0, 3),
    },
  },
  required: ['landscape'],
};

const uischema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/landscape', options: { format: 'images', color: 'teal', columns: { xs: 3, md: 6 } }, hint: 'Teal, responsive columns' },
    {
      type: 'Control',
      scope: '#/properties/size',
      options: {
        format: 'images',
        columns: 4,
        images: {
          small: { src: 'images/lake.png', title: 'Small' },
          large: { src: 'images/city.jpg', title: 'Large' },
        },
      },
    },
    { type: 'Control', scope: '#/properties/places', options: { format: 'images', minWidth: 100 } },
    { type: 'Control', scope: '#/properties/ranked', options: { format: 'images', ordering: true, columns: 4, color: 'deep-orange' } },
    { type: 'Control', scope: '#/properties/cover', options: { format: 'images', columns: 4, gap: 6, captions: false } },
    { type: 'Control', scope: '#/properties/readonly', options: { format: 'images', columns: 6 } },
    { type: 'Control', scope: '#/properties/show' },
    { type: 'Control', scope: '#/properties/disabled', options: { format: 'images', columns: 6 }, rules: { enabled: 'truthy(show)' } },
  ],
};
</script>

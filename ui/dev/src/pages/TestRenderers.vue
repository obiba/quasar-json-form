<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">{{ t('json_form') }}</div>
    <FormPresenter :data="formData" :schema="schema" :uischema="uischema" readonly />
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import FormPresenter from '../components/FormPresenter.vue';
import { useI18n } from 'vue-i18n';

const formData = ref({ integer: 1 });
const { t } = useI18n();

// Define your JSON Schema
const schema = {
  type: 'object',
  properties: {
    string: {
      type: 'string',
      title: 'renderers.string.label',
      description: 'renderers.string.description',
    },
    password: {
      type: 'string',
      format: 'password',
      title: 'renderers.password.label',
      description: 'renderers.password.description',
    },
    multiLineString: {
      type: 'string',
      title: 'renderers.multiLineString.label',
      description: 'renderers.multiLineString.description',
    },
    boolean: {
      type: 'boolean',
      title: 'renderers.boolean.label',
      description: 'renderers.boolean.description',
    },
    number: {
      type: 'number',
      title: 'renderers.number.label',
      description: 'renderers.number.description',
    },
    integer: {
      type: 'integer',
      title: 'renderers.integer.label',
      description: 'renderers.integer.description',
    },
    computed: {
      type: 'number',
      rules: {
        compute: 'integer * 2 + ifElse(isNumber(number), number, 0)',
      },
      title: 'renderers.computed.label',
      description: 'renderers.computed.description',
    },
    rating: {
      type: 'integer',
      title: 'renderers.rating.label',
      description: 'renderers.rating.description',
    },
    slider: {
      type: 'integer',
      title: 'renderers.slider.label',
      description: 'renderers.slider.description',
    },
    date: {
      type: 'string',
      format: 'date',
      title: 'renderers.date.label',
      description: 'renderers.date.description',
    },
    time: {
      type: 'string',
      format: 'time',
      title: 'renderers.time.label',
      description: 'renderers.time.description',
    },
    fulltime: {
      type: 'string',
      format: 'fulltime',
      title: 'renderers.fulltime.label',
      description: 'renderers.fulltime.description',
    },
    datetime: {
      type: 'string',
      format: 'date-time',
      title: 'renderers.datetime.label',
      description: 'renderers.datetime.description',
    },
    datefulltime: {
      type: 'string',
      format: 'date-fulltime',
      title: 'renderers.datefulltime.label',
      description: 'renderers.datefulltime.description',
    },
    file: {
      type: 'string',
      format: 'file',
      title: 'renderers.file.title',
      description: 'renderers.file.description',
      label: 'renderers.file.label',
      hint: 'renderers.file.hint',
    },
    files: {
      type: 'array',
      title: 'renderers.files.title',
      description: 'renderers.files.description',
      items: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'file',
            options: {
              uploadUrl: 'https://httpbin.org/post',
              uploadMethod: 'POST',
              uploadHeaders: {},
              pathKey: 'files.file',
            },
          },
        },
      },
    },
    enum: {
      type: 'string',
      enum: ['one', 'two', 'three'],
      title: 'renderers.enum.label',
      description: 'renderers.enum.description',
    },
    oneOfEnum: {
      type: 'string',
      oneOf: [
        {
          const: 'one',
          title: 'renderers.enum.options.one',
        },
        {
          const: 'two',
          title: 'renderers.enum.options.two',
        },
        {
          const: 'three',
          title: 'renderers.enum.options.three',
        },
      ],
      title: 'renderers.oneOfEnum.label',
      description: 'renderers.oneOfEnum.description',
    },
    radios: {
      type: 'string',
      enum: ['one', 'two', 'three'],
      title: 'renderers.radios.label',
      description: 'renderers.radios.description',
    },
    oneOfRadios: {
      type: 'string',
      oneOf: [
        {
          const: 'one',
          title: 'renderers.enum.options.one',
        },
        {
          const: 'two',
          title: 'renderers.enum.options.two',
        },
        {
          const: 'three',
          title: 'renderers.enum.options.three',
        },
      ],
      title: 'renderers.oneOfRadios.label',
      description: 'renderers.oneOfRadios.description',
    },
    multiEnum: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        enum: ['one', 'two', 'three'],
      },
      title: 'renderers.multiEnum.label',
      description: 'renderers.multiEnum.description',
    },
    oneOfMultiEnum: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        oneOf: [
          {
            const: 'one',
            title: 'renderers.enum.options.one',
          },
          {
            const: 'two',
            title: 'renderers.enum.options.two',
          },
          {
            const: 'three',
            title: 'renderers.enum.options.three',
          },
        ],
      },
      title: 'renderers.oneOfMultiEnum.label',
      description: 'renderers.oneOfMultiEnum.description',
    },
    checkboxes: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        enum: ['one', 'two', 'three'],
      },
      title: 'renderers.checkboxes.title',
      description: 'renderers.checkboxes.description',
    },
    toggles: {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        enum: ['one', 'two', 'three'],
      },
      title: 'renderers.toggles.title',
      description: 'renderers.toggles.description',
    },
  },
};

// Optional UI Schema for layout customization
const uischema = {
  type: 'VerticalLayout',
  elements: [
    {
      type: 'Label',
      label: 'renderers.label.text',
      labelClass: 'text-green-8',
    },
    {
      type: 'Section',
      label: 'renderers.section.label',
      labelClass: 'text-h6',
      description: 'renderers.section.description',
      descriptionClass: 'text-blue-8',
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/string'
            },
            {
              type: 'Control',
              scope: '#/properties/password',
              options: {
                autocomplete: 'new-password',
              },
            },
          ],
        },
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/multiLineString',
              options: {
                rows: 4,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/file',
              options: {
                uploadUrl: 'https://httpbin.org/post',
                uploadMethod: 'POST',
                uploadHeaders: {},
                pathKey: 'files.file',
              },
            },
            {
              type: 'Control',
              scope: '#/properties/files',
            },
          ],
        },
      ],
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/number',
            },
            {
              type: 'Control',
              scope: '#/properties/integer',
            },
            {
              type: 'Control',
              scope: '#/properties/computed',
              options: {
                format: 'computed',
                show: true,
              },
            },
          ],
        },
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/rating',
              options: {
                format: 'rating',
                icon: 'star_border',
                iconSelected: 'star',
                color: 'red',
                size: 'md',
                max: 6,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/slider',
              options: {
                format: 'slider',
                min: 0,
                max: 10,
                step: 1,
                color: 'blue',
                size: 'md',
              },
            },
            {
              type: 'Control',
              scope: '#/properties/boolean',
            }
          ],
        },
      ]
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/date',
            },
            {
              type: 'Control',
              scope: '#/properties/time',
            },
            {
              type: 'Control',
              scope: '#/properties/fulltime',
            },
          ],
        },
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/datetime',
            },
            {
              type: 'Control',
              scope: '#/properties/datefulltime',
            },
          ],
        },
      ]
    },
    {
      type: 'HorizontalLayout',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/enum',
            },
            {
              type: 'Control',
              scope: '#/properties/oneOfEnum',
            },
            {
              type: 'Control',
              scope: '#/properties/radios',
              options: {
                format: 'radio',
              },
            },
            {
              type: 'Control',
              scope: '#/properties/oneOfRadios',
              options: {
                format: 'radio',
              },
            }
          ],
        },
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/multiEnum',
              options: {
                maxValues: 2,
                useChips: true,
                clearable: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/oneOfMultiEnum',
              options: {
                maxValues: 2,
                useChips: true,
                clearable: true,
              },
            },
            {
              type: 'Control',
              scope: '#/properties/checkboxes',
              options: {
                format: 'checkbox',
              },
            },
            {
              type: 'Control',
              scope: '#/properties/toggles',
              options: {
                format: 'toggle',
                size: 'xs',
              },
            },
          ],
        },
      ]
    },
  ],
};
</script>

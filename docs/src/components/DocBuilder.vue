<template>
  <div class="doc-wide doc-playground">
    <QJsonFormBuilder
      v-model="form"
      :languages="['en', 'fr']"
      :catalog="[colorApi]"
      :renderers="[colorRenderer]"
      :config="config"
    />

    <q-card flat bordered class="q-mt-md">
      <q-expansion-item :label="t('form')" icon="data_object" dense header-class="doc-card-header text-subtitle2">
        <q-separator />
        <DocCode :code="JSON.stringify(form, null, 2)" />
      </q-expansion-item>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { countryCodes } from 'ui'
import { QJsonFormBuilder } from 'ui/builder'
import type { FormDefinition } from 'ui/builder'
import { colorRenderer, colorApi } from '../examples/custom/QColorRenderer'
import DocCode from './DocCode.vue'

const { t } = useI18n()

const config = { countries: countryCodes }

// a form as the builder stores it: every text is a key of its translations
const form = ref<FormDefinition>({
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'name.title', minLength: 2 },
      email: { type: 'string', title: 'email.title', format: 'email' },
      role: {
        type: 'string',
        title: 'role.title',
        oneOf: [
          { const: 'user', title: 'role.options.user' },
          { const: 'editor', title: 'role.options.editor' },
        ],
      },
      country: { type: 'string', title: 'country.title', format: 'countries' },
      contacts: {
        type: 'array',
        title: 'contacts.title',
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string', title: 'contacts.items.kind.title', enum: ['phone', 'email'] },
            value: { type: 'string', title: 'contacts.items.value.title' },
          },
        },
      },
      bio: { type: 'string', title: 'bio.title' },
    },
    required: ['name'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'HorizontalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/name', hint: 'name.hint' },
          { type: 'Control', scope: '#/properties/email' },
        ],
      },
      { type: 'Control', scope: '#/properties/role', options: { format: 'radio', inline: true } },
      { type: 'Control', scope: '#/properties/country' },
      {
        type: 'Group',
        label: 'group.1.label',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/contacts',
            options: {
              items: {
                type: 'HorizontalLayout',
                elements: [
                  { type: 'Control', scope: '#/properties/kind' },
                  { type: 'Control', scope: '#/properties/value' },
                ],
              },
            },
          },
        ],
      },
      { type: 'Control', scope: '#/properties/bio', options: { rows: 3 }, rules: { visible: 'role == "editor"' } },
    ],
  },
  translations: {
    en: {
      'name.title': 'Name',
      'name.hint': 'As on your passport',
      'email.title': 'Email',
      'role.title': 'Role',
      'role.options.user': 'User',
      'role.options.editor': 'Editor',
      'country.title': 'Country',
      'contacts.title': 'Contacts',
      'contacts.items.kind.title': 'Kind',
      'contacts.items.value.title': 'Value',
      'bio.title': 'About you',
      'group.1.label': 'Contacts',
    },
    fr: {
      'name.title': 'Nom',
      'name.hint': 'Tel que sur votre passeport',
      'email.title': 'Courriel',
      'role.title': 'Rôle',
      'role.options.user': 'Utilisateur',
      'role.options.editor': 'Éditeur',
      'country.title': 'Pays',
      'contacts.title': 'Contacts',
      'bio.title': 'À propos de vous',
      'group.1.label': 'Contacts',
    },
  },
})
</script>

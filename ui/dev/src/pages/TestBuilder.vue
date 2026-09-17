<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Form builder</div>
    <QJsonFormBuilder v-model="form" :languages="['en', 'fr']" :config="config" />
    <q-expansion-item label="Emitted form" dense class="q-mt-md">
      <pre class="q-ma-none q-pa-md" style="font-size: 12px">{{ JSON.stringify(form, null, 2) }}</pre>
    </q-expansion-item>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import QJsonFormBuilder from '../../../src/builder/QJsonFormBuilder';
import type { FormDefinition } from '../../../src/builder';
import { countryCodes } from '../../../src/vue-plugin';

const config = { countries: countryCodes };

const form = ref<FormDefinition>({
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'name.title', minLength: 2 },
      email: { type: 'string', title: 'email.title', format: 'email' },
      role: { type: 'string', title: 'role.title', oneOf: [{ const: 'user', title: 'role.options.user' }, { const: 'editor', title: 'role.options.editor' }] },
      contacts: {
        type: 'array',
        title: 'contacts.title',
        items: { type: 'object', properties: { phone: { type: 'string', title: 'contacts.items.phone.title' } } },
      },
      bio: { type: 'string', title: 'bio.title' },
    },
    required: ['name'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'HorizontalLayout', elements: [{ type: 'Control', scope: '#/properties/name' }, { type: 'Control', scope: '#/properties/email' }] },
      { type: 'Control', scope: '#/properties/role', options: { format: 'radio', inline: true } },
      { type: 'Group', label: 'group.1.label', elements: [
        { type: 'Control', scope: '#/properties/contacts', options: { items: { type: 'HorizontalLayout', elements: [{ type: 'Control', scope: '#/properties/phone' }] } } },
      ] },
      { type: 'Control', scope: '#/properties/bio', options: { rows: 3 }, rules: { visible: 'role == "editor"' } },
    ],
  },
  translations: {
    en: {
      'name.title': 'Name', 'email.title': 'Email', 'role.title': 'Role', 'role.options.user': 'User', 'role.options.editor': 'Editor',
      'contacts.title': 'Contacts', 'contacts.items.phone.title': 'Phone', 'bio.title': 'About you', 'group.1.label': 'Contacts',
    },
    fr: {
      'name.title': 'Nom', 'email.title': 'Courriel', 'role.title': 'Rôle', 'role.options.user': 'Utilisateur', 'role.options.editor': 'Éditeur',
      'contacts.title': 'Contacts', 'bio.title': 'À propos de vous', 'group.1.label': 'Contacts',
    },
  },
});
</script>

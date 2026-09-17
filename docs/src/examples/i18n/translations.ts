import type { DocExampleDef } from '../types'

// A self-contained form: every text is a key, resolved by the translations
// embedded in the form (the application messages are not involved)
export default {
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', title: 'name.title', description: 'name.description', minLength: 2 },
      role: {
        type: 'string',
        title: 'role.title',
        oneOf: [
          { const: 'user', title: 'role.user' },
          { const: 'editor', title: 'role.editor' },
        ],
      },
      bio: { type: 'string', title: 'bio.title' },
    },
    required: ['name'],
  },
  uischema: {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/properties/name', hint: 'name.hint' },
      { type: 'Control', scope: '#/properties/role', options: { format: 'radio', inline: true } },
      { type: 'Control', scope: '#/properties/bio', options: { rows: 2 }, rules: { validation: [{ expr: 'wordCount(bio) < 20', message: 'bio.tooLong' }] } },
    ],
  },
  translations: {
    en: {
      'name.title': 'Name',
      'name.description': 'As on your **passport**',
      'name.hint': 'At least two characters',
      'name.error.minLength': 'Two characters, please',
      role: { title: 'Role', user: 'User', editor: 'Editor' },
      bio: { title: 'About you', tooLong: 'Twenty words at most' },
    },
    fr: {
      'name.title': 'Nom',
      'name.description': 'Tel que sur votre **passeport**',
      'name.hint': 'Au moins deux caractères',
      'name.error.minLength': 'Deux caractères, s\'il vous plaît',
      role: { title: 'Rôle', user: 'Utilisateur', editor: 'Éditeur' },
      bio: { title: 'À propos de vous', tooLong: 'Vingt mots au plus' },
    },
  },
  locale: 'en',
  data: { name: 'A' },
} satisfies DocExampleDef

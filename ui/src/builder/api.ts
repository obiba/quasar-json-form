/**
 * The description of the form builder component, in the shape of the
 * renderer catalog entries, for the API documentation.
 */
import type { RendererApi } from '../catalog'

export const builderApi: RendererApi = {
  name: 'QJsonFormBuilder',
  kind: 'form',
  props: {
    modelValue: {
      type: 'Object',
      default: '{ schema: { type: \'object\', properties: {} } }',
      desc: 'The form under construction (`v-model`): `{ schema, uischema, translations }`. A missing UI schema is generated, nested translations are flattened to dotted keys.',
    },
    languages: {
      type: 'Array | Object',
      desc: 'Languages of the form, `[\'en\', \'fr\']` or `{ en: \'English\', fr: \'Français\' }`, added to the ones found in its translations. Defaults to `en` when none is known.',
    },
    locale: {
      type: 'String',
      default: 'vue-i18n locale',
      desc: 'Language edited and previewed, when it is one of the languages of the form; else the vue-i18n locale when it is one, else the first language. The language switch of the builder changes it for the builder only.',
    },
    catalog: {
      type: 'Array',
      default: '[]',
      desc: '`RendererApi` descriptions of the renderers of the application, whose `items` are added to the palette and whose `options` generate the settings form of their elements (see [custom controls](#/start/custom-controls)).',
    },
    renderers: {
      type: 'Array',
      default: '[]',
      desc: 'Renderers of the application, `{ renderer, tester }` entries passed to the preview form.',
    },
    config: {
      type: 'Object',
      desc: 'JSON Forms config passed to the preview form: `countries`, `fileUpload` hooks...',
    },
  },
  events: {
    'update:modelValue': {
      desc: 'Emitted with the form definition on every change of the model: a node added, moved or removed, a text or an option edited, a translation entered, an import.',
    },
  },
  data: {
    desc: 'The form bound to `v-model`, a self-contained bundle: the JSON schema of the data, the JSON Forms UI schema, and the translations keyed by language. Every text of the schema and UI schema is a translation key generated from the position of its node (`name.title`, `name.hint`, `role.options.editor`, `group.1.label`, `name.validation.0`), resolved by the `translations` prop of `QJsonForm`.',
    example: `{
  "schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "title": "name.title", "minLength": 2 }
    },
    "required": ["name"]
  },
  "uischema": {
    "type": "VerticalLayout",
    "elements": [
      { "type": "Control", "scope": "#/properties/name", "hint": "name.hint" }
    ]
  },
  "translations": {
    "en": { "name.title": "Name", "name.hint": "As on your passport" },
    "fr": { "name.title": "Nom", "name.hint": "Tel que sur votre passeport" }
  }
}`,
  },
}

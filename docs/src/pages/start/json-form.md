---
title: QJsonForm
---

# QJsonForm

<p class="doc-lead">The form component: give it the data, a schema and optionally a UI schema.</p>

```html
<QJsonForm
  v-model="data"
  v-model:errors="errors"
  :schema="schema"
  :uischema="uischema"
  :readonly="false"
  validation-mode="ValidateAndShow"
/>
```

Without a UI schema, one control per property of the schema is rendered in a vertical layout.

<DocExample name="json-form/basic" title="Schema only" />

## UI schema

A UI schema lays the controls out and configures them. `Control` elements point at a schema
property through their `scope` (a JSON pointer); the `options` of a control are read by the
renderer and, for the rest, passed as props to the Quasar component.

<DocExample name="json-form/uischema" title="Layouts and control options" source />

## Errors

The `errors` model contains the AJV validation errors (none in `NoValidation` mode) followed by
the errors found by the renderers themselves, which are always evaluated: `validation`
rules (`keyword: "validation"`), localized strings not completed (`completed`), word limits
(`wordLimit`), file counts (`files`), radio matrix (`allItemsSelected`) and date bounds (`date`).
Their `instancePath` points at the control. The errors are also emitted on mount, so that a
submit button can be disabled right away.

Required controls get a `*` appended to their label. Error messages are looked up with vue-i18n
under the [JSON Forms i18n keys](https://jsonforms.io/docs/i18n): `<path>.error.<keyword>` for a
specific control, then `error.<keyword>` (`error.required`, `error.minLength`, `error.pattern`...)
with the AJV error params available for interpolation (`{limit}`, `{pattern}`, `{format}`...),
then `error.default`.

## Title, description, label and hint

Every control displays its texts the same way, questionnaire style:

- the `title` above the control, in bold, with the `*` of a required control, and the
  `description` under the title;
- the `label` inside the input: the floating label of a `QInput` / `QSelect`, the text of a
  toggle, the upload button of a file control;
- the `hint` under the input, in the messages of a `QInput` / `QSelect` (where the errors replace
  it) or after the component.

Each one is read from the UI schema element first, then from the schema property. They are
translated with vue-i18n when they are keys, and rendered as markdown (inline for the title; the
label is plain text). The `*` of a required control goes on the title, or on the label when there
is no title; `label: false` on the element hides the title. The texts carry the `q-form-title`, `q-form-description` and `q-form-hint` classes;
`titleClass`, `descriptionClass` and `hintClass` on the element add classes to each of them.

<DocExample name="json-form/texts" title="Title, description, label and hint" source />

## Read-only

The `readonly` prop renders every control read-only: inputs are not editable and list / upload
buttons are hidden. A single control can also be read-only through `options.readonly` in the UI
schema or `readOnly` in the schema.

## Config

The `config` prop is the JSON Forms config, forwarded as is to the `JsonForms` component:
a plain object handed to every renderer, where the application sets the defaults that its
controls share. A control overrides a config entry with the same key in its `options`, so the
precedence is `options` on the control element, then `config`, then the built-in default.

```html
<QJsonForm
  v-model="data"
  :schema="schema"
  :uischema="uischema"
  :config="{
    languages: { en: 'English', fr: 'Français' },
    countries: countryCodes,
    fileUpload: { upload, remove, downloadUrl },
    geo: { tiles: 'https://tile.example.org/{z}/{x}/{y}.png', center: [-73.6, 45.5], zoom: 10 },
  }"
/>
```

The built-in renderers read these entries:

| Entry | Read by | Value |
| --- | --- | --- |
| `languages` | [localized string](#/controls/localized-string) | Languages of the localized strings, `['en', 'fr']` or `{ en: 'English', fr: 'Français' }`. Looked up after `options.languages` and before the `languages` prop of `QJsonForm`; defaults to `['en']`. |
| `countries` | [countries](#/controls/countries) | The `[{ code, name }]` list of the country select, or a `{ locale: [...] }` map keyed by language (the current locale is used). Looked up after `options.countries` and before a `jsonforms-countries` provide; the `countryCodes` export holds the ISO 3166-1 alpha-3 codes. |
| `fileUpload` | [file upload](#/controls/file-upload) | Programmatic upload hooks: `upload(file, context)` returning the file item to store (or the path for a string control), `remove(item, context)` called after a file is removed from the data, and `downloadUrl(item, context)` giving the link of a stored file. `context` holds the `path`, `schema`, `uischema` and `options` of the control. Without `upload`, the declarative `uploadUrl` flow of the control options applies. |
| `geo` | [geo](#/controls/geo) | Defaults of the map controls: `tiles` (a `{z}/{x}/{y}` URL template or `{ url, attributions }`), `center` (`[lon, lat]`), `zoom`, `height`, `precision` (decimals of the coordinates) and `grayscale`. Each one is overridden by the option of the same name on the control. |

Any other entry is ignored by the built-in renderers but reaches the [custom controls](#/start/custom-controls)
of the application through the `config` of `useControlProperties`, which makes it the place for
application-wide settings such as API endpoints or feature flags. The standard JSON Forms entries
(`restrict`, `trim`, `showUnfocusedDescription`, `hideRequiredAsterisk`) are not honored by the
Quasar renderers.

## API

<DocApi name="QJsonForm" />

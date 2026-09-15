# Roadmap: replacing angular-schema-form in Mica

This document records the state of `quasar-json-form` as of September 2026, what
[Mica](https://github.com/obiba/mica2) actually needs from
[angular-schema-form](https://github.com/json-schema-form/angular-schema-form) (ASF),
and the plan to replace ASF with this library.

## 1. Where quasar-json-form stands (v0.2.0)

A generic [JSON Forms](https://jsonforms.io/) + Quasar renderer set, not yet an ASF replacement.

What exists:

- `QJsonForm` wrapping `@jsonforms/vue` 3.7 with 19 Quasar renderers: string/textarea/password,
  number/integer, rating, slider, toggle, select (enum/oneOf/multi), radio/checkbox groups, date,
  time, datetime, single file upload, list of objects (ordering, delete confirmation), group,
  tabs (Categorization), stepper, label, section, computed.
- A [filtrex](https://github.com/m93a/filtrex) rule engine (`useFiltrexRules`) evaluating
  `visible`, `enabled`, `min`, `max`, `compute` and `validation[]` rules declared on the schema
  or the uischema, plus per-`oneOf`-item visibility.
- Every title/description/option label/message goes through vue-i18n `t()`; markdown via
  markdown-it + DOMPurify.
- App extension for Quasar CLI; rollup build; TS types; CI + npm trusted publishing.

Gaps that matter for Mica:

- `validationMode: 'NoValidation'` in `QJsonForm`: `required`, `pattern`, `minimum`, `minItems`…
  from the schema are never enforced; only filtrex rules produce errors.
- No `readonly` prop (JSON Forms supports it; Mica renders every entity "view details" page with
  `formDefaults.readonly`).
- No tests; the `ui/dev` pages are the only verification.
- No grid layout equivalent of ASF `htmlClass: "row" / "col-xs-6"` (117 uses in Mica defaults).
- 27 compiled `.js` files are still tracked in `ui/src` next to their `.ts` sources.

## 2. What Mica needs from ASF

### Consumers

1. **Public portal** (Freemarker + Vue 3 global build + Bootstrap/AdminLTE). Only the five
   data-access pages (`data-access-form.ftl`, `-preliminary-`, `-feasibility-`, `-amendment-`,
   `-agreement-`) still load AngularJS, solely for ASF, via
   `_templates/libs/data-access-form-scripts.ftl` and `assets/js/mica-data-access-form.js`
   (validate, `PUT /ws/data-access-request/{id}/model`). The server (`SchemaFormConfig.java`)
   resolves `t(...)` and rewrites `col-xs-` → `col-` before injecting
   `formSchema` / `formDefinition` / `formModel` as globals.
2. **Legacy admin webapp** (`mica-webapp`, AngularJS 1.6, bower): 24 `sf-schema` mount points
   (networks, collection/harmonization studies, populations, DCEs, datasets, study/opal tables,
   projects, persons/contacts, the ace-based config editor, taxonomy attribute dialogs) plus
   ng-obiba-mica's `entity-schema-form` component for DAR admin views. `t(...)` is resolved
   client-side by `LocalizedSchemaFormService`. **This webapp is being rewritten, not retrofitted.**
3. **New admin webapp** (`mica-ui`, Mica branch `mica-ui`): Quasar app-vite v3 + Pinia +
   vue-i18n, modeled on opal-ui, built into the Maven reactor by `frontend-maven-plugin`
   (`mica-ui/pom.xml`). It already declares the `@obiba/json-form` app extension
   (`quasar.extensions.json`, `@obiba/quasar-app-extension-json-form` ^0.2.0). Status as of
   September 2026: sign-in, drawer, networks list, network page (view tab renders acronym/name/
   description through `LocalizedInput.vue`; the custom `model` is still dumped as `<pre>`),
   placeholder pages for studies/datasets/projects/persons/files/settings. `SchemaForm.vue` /
   `SchemaFormItem.vue` are a temporary copy of the opal-ui simple-schema components; they are
   to be replaced by `QJsonForm` from this project (see Phase 4). `LocalizedInput` works on the DTO shape `[{lang, value}]`; entity `model` content
   uses the ASF `{en: "...", fr: "..."}` shape, so the two localized widgets stay distinct.

### The form dialect in use

13 default forms live in `mica-core/src/main/resources/config/*-form/` (`schema.json` +
`definition.json`, plus `*-mandatory.json` fixed parts). Every deployment stores *customized*
copies in MongoDB, so stored configs cannot simply be rewritten.

ASF definition features (counts over the default forms):

| Feature | Count | Notes |
|---|---|---|
| `section` / `fieldset` + `htmlClass` | 171 | Bootstrap grid rows/cols |
| `help` + `helpvalue` | 70 | raw HTML headings containing `t()` |
| `textarea`, `rows`, `wordLimit` | 27 | word-count validator added by ng-obiba-mica `postProcess` |
| `condition` | 40 | JS expressions: `model.x=='y'`, `model.arr.indexOf('z')>=0`, `!model.b`, `&&` / `\|\|` |
| `titleMap`, `radios`, `checkboxes`, `notitle`, `validationMessage`, `add`, `style.add`, `minItems`, `emptyMessage` | — | array item keys like `staff[].name` |
| `x-schema-form` (in schemas) | 3 | `notitle` |

Custom schema `format`s:

| Format | Count | Model shape / widget |
|---|---|---|
| `localizedString` (`type: localizedstring`, `marked`) | 41 | `{en: "...", fr: "..."}`; "completed in all languages" validator; `languages` from `formDefaults` |
| `obibaSimpleMde` | 10 | markdown editor on a localized string |
| `obibaFiles` (`type: obibaFileUpload`) | 10 | `{obibaFiles: [{id, fileName, size, …}]}`; temp-file upload; `minItems`, `emptyMessage`, `missingFiles` message |
| `radioGroupCollection` | 7 | matrix; non-standard `values` / `items` keys on an object schema |
| `datepicker`, `ymdatepicker` | 7 | date, year-month; `dateOptions.dateFormat` |
| `obibaCountriesUiSelect` | 1 | ISO country multi-select |
| `sf-typeahead`, `sf-checkboxgroup`, `sf-obiba-selection-tree`, `ui-ace` | 0 | registered add-ons; may appear in customer configs |

Backend code that reads these documents structurally and must keep working:

- `DataAccessEntityExporter`: walks the *definition* (`items` / `key` / `type`) and the schema
  (`format: obibaFiles`, arrays) to build DOCX/CSV exports.
- `SchemaFormContentFileService`: JsonPath `$..obibaFiles` to save/delete uploaded files.
- `EntitySchemaFormFieldsService` (taxonomy config): traverses schema `properties`.
- `EntityConfigService`: only checks that the schema is a JSON object and the definition a JSON array.

## 3. Key decision

**Do not migrate stored configs. Add an ASF → JSON Forms converter and accept the ASF dialect as
an input format.**

The schema half is nearly standard JSON Schema already (custom `format`s are fine: JSON Forms
testers match on format). Only the `definition` array needs translating to a uischema. This keeps
the exporter/file/taxonomy code and every customer's MongoDB config untouched, and allows old and
new rendering to be verified side by side. A native uischema can be accepted too, detected by
shape: array → ASF definition, object → JSON Forms uischema.

## 4. Phases

### Phase 0 — Harden the library (prerequisite) — done (September 2026)

- [x] `readonly`, `validationMode` (default `ValidateAndShow`), `ajv`, `additionalErrors` and
  `config` props on `QJsonForm`; `update:errors` event. AJV messages go through vue-i18n
  (`error.<keyword>`, `error.default` as the `does-not-validate` equivalent) with built-in
  en/fr defaults (`messages` export); required markers (`*`) on labels. Emptied text/number
  inputs and cleared selects become `undefined` so that `required` applies.
  `localized.completed` belongs to the LocalizedString renderer (Phase 1).
- [x] vitest + `@vue/test-utils` (`ui/test`, `npm test`, run in CI); tracked `ui/src/**/*.js`
  removed and ignored; dev app aliased to the `.ts` entry.
- [x] `options.class` on layouts, groups, sections, labels and controls; new `QLayoutRenderer`
  for `VerticalLayout` / `HorizontalLayout` renders elements as direct children so
  `row q-col-gutter-md` / `col-md-6` work (see `ui/dev` "test-grid-layout").
- [x] `Label` renderer accepts the JSON Forms `text` property; raw HTML (`<h3>`, alert `<div>`s)
  survives markdown-it + DOMPurify, scripts and event handlers are stripped (tested).

### Phase 1 — Missing renderers (generic where possible, Mica shapes as options)

1. **LocalizedString**: object `{lang: text}`; `languages` option (also injectable globally);
   single-line or `rows` textarea; `marked` → markdown editor variant; all-languages-completed
   validation; readonly display.
2. **Markdown editor** (`obibaSimpleMde`): LocalizedString renderer in editor mode
   (textarea + preview toggle; opal-ui already uses `qmarkdown`).
3. **Multi-file upload**: generalize `QFileUploadRenderer` with `multiple`, `minItems`,
   `emptyMessage`, configurable upload flow (Mica: `POST /ws/files/temp` → `Location` header →
   `GET` temp-file metadata) and configurable model shape (`{obibaFiles: [...]}`);
   delete/download; readonly list.
4. **RadioGroupCollection** matrix (rows × radio columns).
5. **Year-month date** (`ymdatepicker`) and a `dateFormat` option on the date renderer.
6. **Word limit**: add `wordCount()` to the filtrex engine; map `wordLimit "0:500"` /
   `wordMin` / `wordMax` to `validation` rules with the `wordLimitError` message.
7. **Countries select** (ISO list injected via option/provide) and **typeahead** string.
8. Defer `sf-obiba-selection-tree` until a customer config using it is found.

### Phase 2 — ASF compatibility converter

`@obiba/quasar-ui-json-form/asf`, pure TypeScript, unit-tested:

```
convert(schema, definition, { languages, readonly }) → { schema, uischema }
```

- `"a.b"` / `"arr[].x"` keys → `Control` scopes; `section` / `fieldset` (+ `htmlClass`) →
  layouts/groups with classes; `help` → `Label`; `textarea` / `rows` / `notitle` / `titleMap` /
  `radios` / `checkboxes` / `add` / `minItems` / `emptyMessage` / `validationMessage` /
  `x-schema-form` → renderer options.
- `condition` → `rules.visible`: a small transpiler for the patterns actually in use (strip
  `model.`; `==` / `===`; `!`; `&&` / `||`; `.indexOf(v) >= 0` and `> -1` → `contains(arr, v)`
  custom function). Log and skip anything it cannot parse.
- **Acceptance fixtures**: the 13 default Mica form pairs as snapshot tests, plus a `ui/dev`
  page that renders any pasted schema/definition pair.

### Phase 3 — Portal data-access forms (independent of mica-ui)

- New Vite lib build in `mica-webapp` producing a `mica-data-access-form.js` bundle (Vue 3 +
  Quasar + json-form + converter), mounted in the five `.ftl` templates, keeping the existing
  `formSchema` / `formDefinition` / `formModel` / `formMessages` globals and the FormController
  behaviours (validate → toast, save → PUT + redirect). vue-i18n messages loaded from the
  existing `/ws/config/i18n/{lang}.json`.
- Remove AngularJS, ASF and all `sf-*` scripts from `data-access-form-scripts.ftl`.
- **Risk**: Quasar and Bootstrap both define `.row` / `.col-*`. Mitigation: prefix Quasar CSS
  with the form root selector at build time (postcss-prefix-selector), or mount in a shadow-DOM
  custom element (`defineCustomElement`). The first is simpler and keeps dialogs/menus working.

### Phase 4 — mica-ui integration (runs in parallel with Phases 1–2)

`mica-ui` is the primary consumer of this library and drives the order in which renderers get
built. It uses the app extension directly (already declared), so integration is:

- A `MicaJsonForm.vue` wrapper in `mica-ui/src/components`: fetches the entity's form config
  (schema + definition, e.g. `/ws/config/network-form`), runs the ASF converter, feeds
  `QJsonForm` with `readonly` for the "view" tab and editable in an "edit" tab/dialog, and passes
  `languages` from `systemStore.configurationPublic.languages`.
- `t(...)` tokens: resolve client-side with vue-i18n (the converter can leave keys as-is since
  every renderer already calls `t()`; only the `t(` / `)` wrapper needs stripping), using the
  same `/ws/config/i18n/{lang}.json` bundles as the legacy app.
- Suggested page order, by form richness: **network** (default form is a single `website`
  field: ideal first target) → **project** → **datasets** (collected/harmonized, study/opal
  tables) → **studies / populations / DCEs** (localizedString, obibaSimpleMde,
  radioGroupCollection, ymdatepicker, grid layouts) → **persons/contacts** → **data-access
  admin views** (obibaFiles, wordLimit, checkboxes) → **taxonomy attribute dialogs** (ASF
  definitions built programmatically by `EntityTaxonomySchemaFormService`; port that builder or
  emit native uischema).
- Retire `SchemaForm.vue` / `SchemaFormItem.vue`: any simple-schema use (plugin or settings
  configs) goes through `QJsonForm` with a generated default uischema, which `QJsonForm` already
  does when no uischema is given.
- **Form config editor** (replaces the ace/ASF `entity-sf-config` page): JSON editors for schema
  and definition with a live `QJsonForm` preview and converter diagnostics (unparsed
  `condition`s, unknown `type`s). Accept both the ASF dialect and native uischema.

No custom-element / AngularJS bridge is planned: the legacy admin keeps ASF until the
corresponding mica-ui page ships, then the AngularJS page is retired.

### Phase 5 — Cleanup

- Drop `angular-schema-form*`, `sf-*`, `angular-ui-ace` from `bower.json`; update the
  `schema-form.info` i18n strings linking to the Textalk docs; document the accepted dialects.
- Optional, later: one-time `MicaXXXUpgrade` converting stored definitions to native uischema
  (Java port of the converter), only once ASF is no longer edited anywhere.

## 5. Sizing

| Phase | Size | Notes |
|---|---|---|
| 0 | small | |
| 1 | large | LocalizedString and multi-file upload are the bulk |
| 2 | medium | |
| 3 | medium | mostly build / CSS plumbing |
| 4 | ongoing | tracks mica-ui page delivery; renderers land as pages need them |

Suggested sequence: Phase 0 → Phase 2 (converter, tested on the 13 default forms) → Phase 4
starting with the network page → Phase 1 renderers pulled in by each subsequent mica-ui page →
Phase 3 (portal) once the DAR renderers exist → Phase 5 when the last AngularJS page is retired.
Phases 0, 2 and 3 do not touch stored data or the backend.

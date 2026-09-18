---
title: Mapping
---

# Mapping

<p class="doc-lead">How each angular-schema-form construct becomes JSON Forms.</p>

| angular-schema-form | JSON Forms |
|---|---|
| `"a.b"`, `{ key: "a.b" }`, `"*"` (the properties not listed elsewhere) | `Control` with scope `#/properties/a/properties/b` |
| `section` (+ `htmlClass`), object key with `items` | `VerticalLayout` (+ `options.class`) |
| `fieldset` (+ `title`), object key without `items` | `Group` (+ `label`), one control per property |
| `help` + `helpvalue` | `Label` (`text`, HTML allowed) |
| `tabs` | `Categorization` / `Category` |
| `htmlClass` | `options.class`, with `col-xs-N` to `col-N`, `col-*-offset-N` to `offset-*-N`, `row` to `rowClass` |
| `condition` | `rules.visible` (see [Conditions](#/migration/conditions)) |
| `notitle` | `label: false` |
| `title` | written on the schema property (displayed above the control) |
| `description` | `hint` of the control (displayed under the input, like the ASF help block) |
| `titleMap` | `oneOf` (`{ const, title }`) on the property or its items; enum arrays get `uniqueItems` |
| `radios`, `radios-inline`, `radiobuttons`, `checkboxes`, `sf-checkboxgroup` | `options.format: "radio"` / `"checkbox"`; enum arrays default to checkboxes |
| `textarea`, `rows` | `options.rows` |
| `password`, `email`, `url`, `date`, `datepicker`, `ymdatepicker` | `options.format` when the schema `format` does not already select the renderer |
| `localizedstring`, `obibaSimpleMde` (`marked`), `obibaFileUpload`, `radioGroupCollection`, `obibaCountriesUiSelect`, `sf-typeahead` | `options.format` (`localizedString`, `obibaSimpleMde`, `obibaFiles`, `radioGroupCollection`, `countries`, `typeahead`) |
| `wordLimit`, `wordMin`, `wordMax`, `emptyMessage`, `validationMessage` (object or string), `placeholder`, `marked`, `minItems`, `maxItems` | same option |
| `readonly` | `options.readonly`, also on the item controls of an array |
| `add` | `options.addLabel` |
| `minItems`, `maxItems`, `required: true` | written on the schema |
| `dateOptions` (`dateFormat`, `yearRef`, `monthRef`, `lastDay`, `validationMessage`) | `options.dateOptions` / `options.validationMessage` |
| `dateOptions.minDate` / `maxDate` (+ `minDateIsRef` / `maxDateIsRef`) | `options.min` / `max`, or `rules.min` / `max` when it names a field |
| array key with `items` (`"arr[].x"` keys) | `options.items` (item UI schema, scopes relative to the item) |
| `x-schema-form` on a schema property | definition defaults for that key |
| `actions`, `submit`, `button`, `reset`, `template`, `hidden`, `sf-obiba-selection-tree` | skipped (info diagnostic) |

## Renderers

The renderers accept the angular-schema-form conventions directly, whether the form was converted
or written by hand:

- `validationMessage` as a single string or a map, with `default` as fallback;
- `dateOptions` nested options and angular-strap date masks (`yyyy-MM-dd`);
- `items` and `values` of a [radio matrix](#/controls/radio-matrix) on the schema property;
- `acceptedFileTypes` on a [file upload](#/controls/file-upload), and the `obibaFiles` data shape;
- the `localizedstring`, `obibaSimpleMde`, `obibaCountriesUiSelect` and `ymdatepicker` formats.

## Translations

Mica forms wrap their strings in `t('key')` tokens. With the `translate` option the tokens are
resolved at conversion time. Without it, the wrapper is removed: a string that is a single token
becomes the bare key, which the renderers translate with vue-i18n, and a string mixing text and
tokens keeps its keys as-is.

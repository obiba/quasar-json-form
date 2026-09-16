/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  rankWith,
  schemaMatches,
  schemaTypeIs,
  schemaSubPathMatches,
  hasType,
  optionIs,
  uiTypeIs,
  isStringControl,
  isIntegerControl,
  isNumberControl,
  isBooleanControl,
  isEnumControl,
  isOneOfEnumControl,
  isDateControl,
  isTimeControl,
  isDateTimeControl,
  isCategorization,
  isCategory,
  isGroup,
  and,
  or,
  isArrayObjectControl,
  isPrimitiveArrayControl,
} from '@jsonforms/core'
import type { Tester } from '@jsonforms/core'
import QLayoutRenderer from '../components/QLayoutRenderer'
import QStringRenderer from '../components/QStringRenderer'
import QFileUploadRenderer from '../components/QFileUploadRenderer'
import QNumRenderer from '../components/QNumberRenderer'
import QRatingRenderer from '../components/QRatingRenderer'
import QSliderRenderer from '../components/QSliderRenderer'
import QRangeRenderer from '../components/QRangeRenderer'
import QToggleRenderer from '../components/QToggleRenderer'
import QSelectRenderer from '../components/QSelectRenderer'
import QOptionsRenderer from '../components/QOptionsRenderer'
import QDateRenderer from '../components/QDateRenderer'
import QTimeRenderer from '../components/QTimeRenderer'
import QDateTimeRenderer from '../components/QDateTimeRenderer'
import QSectionRenderer from '../components/QSectionRenderer'
import QLabelRenderer from '../components/QLabelRenderer'
import QTabsLayout from '../components/QTabsLayout'
import QStepperLayout from '../components/QStepperLayout'
import QListRenderer from '../components/QListRenderer'
import QGroupRenderer from '../components/QGroupRenderer'
import QComputedRenderer from '../components/QComputedRenderer'
import QLocalizedStringRenderer from '../components/QLocalizedStringRenderer'
import QMarkdownRenderer from '../components/QMarkdownRenderer'
import QRadioMatrixRenderer from '../components/QRadioMatrixRenderer'
import QCountriesRenderer from '../components/QCountriesRenderer'
import QTypeaheadRenderer from '../components/QTypeaheadRenderer'

const hasOneOfItems = (schema: any): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf).every((entry: any) => {
    return entry.const !== undefined
  })

const hasEnumItems = (schema: any): boolean =>
  hasType(schema, 'string') && schema.enum !== undefined

/**
 * schema `format` or `options.format` is one of the given names (unlike the
 * JSON Forms `formatIs`, which only matches string schemas)
 */
const hasFormat = (...names: string[]): Tester =>
  or(
    schemaMatches((schema: any) => names.includes(schema?.format)),
    ...names.map((name) => optionIs('format', name)),
  )

const isFileControl = and(
  uiTypeIs('Control'),
  schemaTypeIs('string'),
  hasFormat('file')
)

const isFilesControl = and(
  uiTypeIs('Control'),
  or(schemaTypeIs('object'), schemaTypeIs('array')),
  hasFormat('files', 'obibaFiles')
)

const isLocalizedStringControl = and(
  uiTypeIs('Control'),
  schemaTypeIs('object'),
  hasFormat('localizedString', 'localizedstring', 'obibaSimpleMde')
)

const isRangeControl = and(
  uiTypeIs('Control'),
  schemaTypeIs('object'),
  hasFormat('range')
)

const isMarkdownControl = and(
  isStringControl,
  hasFormat('markdown')
)

const isRadioMatrixControl = and(
  uiTypeIs('Control'),
  schemaTypeIs('object'),
  hasFormat('radioGroupCollection', 'radio-matrix')
)

const isCountriesControl = and(
  uiTypeIs('Control'),
  or(schemaTypeIs('string'), schemaTypeIs('array')),
  hasFormat('countries', 'obibaCountriesUiSelect')
)

const isTypeaheadControl = and(
  isStringControl,
  hasFormat('typeahead')
)

const isDatePickerControl = and(
  uiTypeIs('Control'),
  hasFormat('datepicker', 'ymdatepicker', 'year-month')
)

const isFulltimeControl = and(
  uiTypeIs('Control'),
  hasFormat('fulltime')
)

const isDateFulltimeControl = and(
  uiTypeIs('Control'),
  hasFormat('date-fulltime')
)

const isComputedControl = and(
  uiTypeIs('Control'),
  hasFormat('computed')
)

const isMultiEnumControl = and(
  uiTypeIs('Control'),
  and(
    schemaMatches(
      (schema: any) =>
        hasType(schema, 'array') &&
        !Array.isArray(schema.items) &&
        schema.uniqueItems === true
    ),
    schemaSubPathMatches('items', (schema: any) => {
      return hasOneOfItems(schema) || hasEnumItems(schema)
    })
  )
)

// Define your custom renderers
// Priority 3 - higher than default (usually 1-2)

// Wrapper to fix type compatibility for group/category checking
const isGroupControl = (uischema: any): boolean => isGroup(uischema) || isCategory(uischema)

const qRenderers = [
  {
    renderer: QLayoutRenderer,
    tester: rankWith(2, or(uiTypeIs('VerticalLayout'), uiTypeIs('HorizontalLayout'))),
  },
  {
    renderer: QComputedRenderer,
    tester: rankWith(4, isComputedControl),
  },
  {
    renderer: QGroupRenderer,
    tester: rankWith(3, isGroupControl),
  },
  {
    renderer: QTabsLayout,
    tester: rankWith(4, or(uiTypeIs('TabsLayout'), isCategorization)),
  },
  {
    renderer: QStepperLayout,
    tester: rankWith(2, uiTypeIs('StepperLayout')),
  },
  {
    renderer: QLabelRenderer,
    tester: rankWith(3, uiTypeIs('Label')),
  },
  {
    renderer: QSectionRenderer,
    tester: rankWith(1, uiTypeIs('Section')),
  },
  {
    renderer: QStringRenderer,
    tester: rankWith(3, isStringControl),
  },
  {
    renderer: QMarkdownRenderer,
    tester: rankWith(4, isMarkdownControl),
  },
  {
    renderer: QTypeaheadRenderer,
    tester: rankWith(5, isTypeaheadControl),
  },
  {
    renderer: QLocalizedStringRenderer,
    tester: rankWith(6, isLocalizedStringControl),
  },
  {
    renderer: QRadioMatrixRenderer,
    tester: rankWith(6, isRadioMatrixControl),
  },
  {
    renderer: QCountriesRenderer,
    tester: rankWith(7, isCountriesControl),
  },
  {
    renderer: QRatingRenderer,
    tester: rankWith(3, and(isIntegerControl, optionIs('format', 'rating'))),
  },
  {
    renderer: QSliderRenderer,
    tester: rankWith(3, and(isIntegerControl, optionIs('format', 'slider'))),
  },
  {
    renderer: QRangeRenderer,
    tester: rankWith(6, isRangeControl),
  },
  {
    renderer: QNumRenderer,
    tester: rankWith(3, isIntegerControl),
  },
  {
    renderer: QNumRenderer,
    tester: rankWith(3, isNumberControl),
  },
  {
    renderer: QToggleRenderer,
    tester: rankWith(3, isBooleanControl),
  },
  {
    renderer: QOptionsRenderer,
    tester: rankWith(5, and(isEnumControl, optionIs('format', 'radio'))),
  },
  {
    renderer: QOptionsRenderer,
    tester: rankWith(7, and(isOneOfEnumControl, optionIs('format', 'radio'))),
  },
  {
    renderer: QOptionsRenderer,
    tester: rankWith(7, and(isMultiEnumControl, or(optionIs('format', 'checkbox'), optionIs('format', 'toggle')))),
  },
  {
    renderer: QSelectRenderer,
    tester: rankWith(4, isEnumControl),
  },
  {
    renderer: QSelectRenderer,
    tester: rankWith(6, isOneOfEnumControl),
  },
  {
    renderer: QSelectRenderer,
    tester: rankWith(6, isMultiEnumControl),
  },
  {
    renderer: QDateRenderer,
    tester: rankWith(4, or(isDateControl, isDatePickerControl)),
  },
  {
    renderer: QTimeRenderer,
    tester: rankWith(4, or(isTimeControl, isFulltimeControl)),
  },
  {
    renderer: QDateTimeRenderer,
    tester: rankWith(4, or(isDateTimeControl, isDateFulltimeControl)),
  },
  {
    renderer: QFileUploadRenderer,
    tester: rankWith(4, isFileControl),
  },
  {
    renderer: QFileUploadRenderer,
    tester: rankWith(6, isFilesControl),
  },
  {
    renderer: QListRenderer,
    tester: rankWith(3, or(isArrayObjectControl, isPrimitiveArrayControl)),
  },
]

export default qRenderers

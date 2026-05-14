import {
  rankWith,
  schemaMatches,
  schemaTypeIs,
  schemaSubPathMatches,
  hasType,
  formatIs,
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
} from '@jsonforms/core'
import QStringRenderer from '../components/QStringRenderer'
import QFileUploadRenderer from '../components/QFileUploadRenderer'
import QNumRenderer from '../components/QNumberRenderer'
import QRatingRenderer from '../components/QRatingRenderer'
import QSliderRenderer from '../components/QSliderRenderer'
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

const hasOneOfItems = (schema: any): boolean =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf).every((entry: any) => {
    return entry.const !== undefined
  })
 
const hasEnumItems = (schema: any): boolean =>
  hasType(schema, 'string') && schema.enum !== undefined

const isFileControl = and(
  uiTypeIs('Control'),
  schemaTypeIs('string'),
  or(formatIs('file'), optionIs('format', 'file'))
)

const isFulltimeControl = and(
  uiTypeIs('Control'),
  or(formatIs('fulltime'), optionIs('format', 'fulltime'))
)

const isDateFulltimeControl = and(
  uiTypeIs('Control'),
  or(formatIs('date-fulltime'), optionIs('format', 'date-fulltime'))
)

const isComputedControl = and(
  uiTypeIs('Control'),
  or(formatIs('computed'), optionIs('format', 'computed'))
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
    renderer: QRatingRenderer,
    tester: rankWith(3, and(isIntegerControl, optionIs('format', 'rating'))),
  },
  {
    renderer: QSliderRenderer,
    tester: rankWith(3, and(isIntegerControl, optionIs('format', 'slider'))),
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
    tester: rankWith(4, isDateControl),
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
    renderer: QListRenderer,
    tester: rankWith(3, isArrayObjectControl),
  },
]

export default qRenderers

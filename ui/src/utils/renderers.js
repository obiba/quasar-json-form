import {
  rankWith,
  schemaMatches,
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
  and,
  or,
  isArrayObjectControl,
} from '@jsonforms/core';
import QStringRenderer from '../components/QStringRenderer.js';
import QNumRenderer from '../components/QNumberRenderer.js';
import QRatingRenderer from '../components/QRatingRenderer.js';
import QSliderRenderer from '../components/QSliderRenderer.js';
import QToggleRenderer from '../components/QToggleRenderer.js';
import QSelectRenderer from '../components/QSelectRenderer.js';
import QOptionsRenderer from '../components/QOptionsRenderer.js';
import QDateRenderer from '../components/QDateRenderer.js';
import QTimeRenderer from '../components/QTimeRenderer.js';
import QDateTimeRenderer from '../components/QDateTimeRenderer.js';
import QSectionRenderer from '../components/QSectionRenderer.js';
import QLabelRenderer from '../components/QLabelRenderer.js';
import QTabsLayout from '../components/QTabsLayout.js';
import QStepperLayout from '../components/QStepperLayout.js';
import QListRenderer from '../components/QListRenderer.js';
import QComputedRenderer from '../components/QComputedRenderer.js';

const hasOneOfItems = (schema) =>
  schema.oneOf !== undefined &&
  schema.oneOf.length > 0 &&
  (schema.oneOf).every((entry) => {
    return entry.const !== undefined;
  });
 
const hasEnumItems = (schema) =>
  schema.type === 'string' && schema.enum !== undefined;

const isFulltimeControl = and(
  uiTypeIs('Control'),
  or(formatIs('fulltime'), optionIs('format', 'fulltime'))
);

const isDateFulltimeControl = and(
  uiTypeIs('Control'),
  or(formatIs('date-fulltime'), optionIs('format', 'date-fulltime'))
);

const isComputedControl = and(
  uiTypeIs('Control'),
  or(formatIs('computed'), optionIs('format', 'computed'))
);

const isMultiEnumControl = and(
  uiTypeIs('Control'),
  and(
    schemaMatches(
      (schema) =>
        hasType(schema, 'array') &&
        !Array.isArray(schema.items) &&
        schema.uniqueItems === true
    ),
    schemaSubPathMatches('items', (schema) => {
      return hasOneOfItems(schema) || hasEnumItems(schema);
    })
  )
);

// Define your custom renderers
// Priority 3 - higher than default (usually 1-2)
const qRenderers = [
  {
    renderer: QComputedRenderer,
    tester: rankWith(4, isComputedControl),
  },
  {
    renderer: QTabsLayout,
    tester: rankWith(2, uiTypeIs('TabsLayout')),
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
    renderer: QListRenderer,
    tester: rankWith(3, isArrayObjectControl),
  },
];

export default qRenderers;
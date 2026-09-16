/**
 * Navigation tree of the site: one page per `src/pages/<path>.md`.
 */
export interface MenuPage {
  title: string
  path: string
}

export interface MenuSection {
  title: string
  icon: string
  pages: MenuPage[]
}

const menu: MenuSection[] = [
  {
    title: 'Getting started',
    icon: 'rocket_launch',
    pages: [
      { title: 'Introduction', path: 'start/introduction' },
      { title: 'Installation', path: 'start/installation' },
      { title: 'QJsonForm', path: 'start/json-form' },
      { title: 'Internationalization', path: 'start/i18n' },
      { title: 'Validation', path: 'start/validation' },
      { title: 'Rules', path: 'start/rules' },
    ],
  },
  {
    title: 'Layouts',
    icon: 'dashboard',
    pages: [
      { title: 'Vertical and horizontal', path: 'layouts/vertical-horizontal' },
      { title: 'Group', path: 'layouts/group' },
      { title: 'Section and label', path: 'layouts/section-label' },
      { title: 'Tabs', path: 'layouts/tabs' },
      { title: 'Stepper', path: 'layouts/stepper' },
    ],
  },
  {
    title: 'Controls',
    icon: 'edit_note',
    pages: [
      { title: 'String', path: 'controls/string' },
      { title: 'Number', path: 'controls/number' },
      { title: 'Toggle', path: 'controls/toggle' },
      { title: 'Select', path: 'controls/select' },
      { title: 'Radio and checkbox', path: 'controls/options' },
      { title: 'Slider', path: 'controls/slider' },
      { title: 'Rating', path: 'controls/rating' },
      { title: 'Date', path: 'controls/date' },
      { title: 'Time', path: 'controls/time' },
      { title: 'Date and time', path: 'controls/datetime' },
      { title: 'Typeahead', path: 'controls/typeahead' },
      { title: 'Countries', path: 'controls/countries' },
      { title: 'Localized string', path: 'controls/localized-string' },
      { title: 'Markdown', path: 'controls/markdown' },
      { title: 'File upload', path: 'controls/file-upload' },
      { title: 'Radio matrix', path: 'controls/radio-matrix' },
      { title: 'List', path: 'controls/list' },
      { title: 'Computed', path: 'controls/computed' },
    ],
  },
  {
    title: 'Migration',
    icon: 'swap_horiz',
    pages: [
      { title: 'From angular-schema-form', path: 'migration/overview' },
      { title: 'Mapping', path: 'migration/mapping' },
      { title: 'Conditions', path: 'migration/conditions' },
      { title: 'Converter playground', path: 'migration/playground' },
    ],
  },
  {
    title: 'Playground',
    icon: 'science',
    pages: [
      { title: 'Playground', path: 'playground/index' },
    ],
  },
]

export default menu

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
    ],
  },
  {
    title: 'Controls',
    icon: 'edit_note',
    pages: [
      { title: 'String', path: 'controls/string' },
    ],
  },
]

export default menu

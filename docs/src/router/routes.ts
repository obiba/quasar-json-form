import type { RouteRecordRaw } from 'vue-router'
import menu from '../menu'

const pages = import.meta.glob('../pages/**/*.md')

const children: RouteRecordRaw[] = menu.flatMap((section) =>
  section.pages.map((page) => ({
    path: page.path,
    component: pages[`../pages/${page.path}.md`]!,
    meta: { title: page.title, section: section.title },
  })),
)

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DocLayout.vue'),
    children: [
      { path: '', redirect: '/' + menu[0]!.pages[0]!.path },
      ...children,
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/Error404.vue'),
  },
]

export default routes

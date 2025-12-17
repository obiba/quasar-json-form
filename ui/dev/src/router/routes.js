const pages = [
  { path: '', file: 'Index' },
  { path: 'test-renderers', file: 'TestRenderers' },
  { path: 'test-rules', file: 'TestRules' },
  { path: 'test-list', file: 'TestList' },
  { path: 'test-no-layout', file: 'TestNoLayout' },
]

const children = pages.map(page => ({
  path: page.path,
  component: () => import(`../pages/${page.file}.vue`)
}))

const routes = [
  {
    path: '/',
    component: () => import('layouts/MyLayout.vue'),
    children
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes

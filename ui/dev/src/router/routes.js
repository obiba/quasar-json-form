const pages = [
  { path: '', file: 'Index' },
  { path: 'test1', file: 'Test1' },
  { path: 'test-list', file: 'TestList' },
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

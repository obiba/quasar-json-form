/*
 * Export files list for /pages folder
 */

function kebabCase (str) {
  const result = str.replace(
    /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g,
    match => '-' + match.toLowerCase()
  )
  return (str[0] === str[0].toUpperCase())
    ? result.substring(1)
    : result
}

function slugify (str) {
  return encodeURIComponent(String(str).trim().replace(/\s+/g, '-'))
}

const pages = import.meta.glob('../pages/**/*.vue')

export default Object.keys(pages)
  .map(page => page.replace('../pages/', '').replace('.vue', ''))
  .filter(page => page !== 'Index' && page !== 'Error404')
  .map(page => ({
    file: page,
    title: page + '.vue',
    path: slugify(kebabCase(page))
  }))

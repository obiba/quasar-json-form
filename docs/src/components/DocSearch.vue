<template>
  <q-select
    ref="selectRef"
    v-model="selected"
    :options="results"
    use-input
    hide-dropdown-icon
    hide-selected
    fill-input
    dense
    standout="bg-white text-primary"
    dark
    input-debounce="150"
    :placeholder="t('search')"
    class="doc-search"
    :input-style="{ minWidth: '160px' }"
    @filter="onFilter"
    @update:model-value="onSelect"
  >
    <template #prepend><q-icon name="search" /></template>
    <template #no-option>
      <q-item><q-item-section class="text-grey-7">{{ t('no_results') }}</q-item-section></q-item>
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.page }} <span v-if="scope.opt.heading" class="text-grey-7">/ {{ scope.opt.heading }}</span></q-item-label>
          <q-item-label caption lines="1">{{ scope.opt.excerpt }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { QSelect } from 'quasar'
import menu from '../menu'

interface Entry {
  page: string
  path: string
  heading: string
  hash: string
  text: string
  excerpt: string
}

interface Result extends Entry {
  label: string
}

const { t } = useI18n()
const router = useRouter()
const selectRef = ref<QSelect | null>(null)
const selected = ref<Result | null>(null)
const results = ref<Result[]>([])

// the Markdown sources of every page, loaded on the first search
const sources = import.meta.glob<string>('../pages/**/*.md', { query: '?raw', import: 'default' })
const titles = new Map(menu.flatMap((section) => section.pages.map((page) => [page.path, page.title] as const)))

let index: Entry[] | undefined

// same slugs as markdown-it-anchor
const slugify = (text: string) => encodeURIComponent(text.trim().toLowerCase().replace(/\s+/g, '-'))

const plain = (markdown: string) => markdown
  .replace(/<[^>]+>/g, ' ')
  .replace(/`([^`]*)`/g, '$1')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[*_#>|]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

async function buildIndex (): Promise<Entry[]> {
  const entries: Entry[] = []
  for (const [file, load] of Object.entries(sources)) {
    const path = file.replace('../pages/', '').replace('.md', '')
    const page = titles.get(path)
    if (!page) continue
    const raw = await load()
    const body = raw.replace(/^---[\s\S]*?---\s*/, '')
    let heading = ''
    let hash = ''
    let text: string[] = []
    const flush = () => {
      const content = plain(text.join(' '))
      entries.push({ page, path, heading, hash, text: content, excerpt: content.slice(0, 120) })
      text = []
    }
    for (const line of body.split('\n')) {
      const match = /^(#{1,3})\s+(.*)$/.exec(line)
      if (match) {
        if (heading || text.length) flush()
        const title = plain(match[2]!)
        heading = match[1]!.length === 1 ? '' : title
        hash = match[1]!.length === 1 ? '' : `#${slugify(title)}`
      } else if (!/^<Doc\w+/.test(line)) {
        text.push(line)
      }
    }
    flush()
  }
  return entries
}

function score (entry: Entry, terms: string[]): number {
  const page = entry.page.toLowerCase()
  const heading = entry.heading.toLowerCase()
  const text = entry.text.toLowerCase()
  let total = 0
  for (const term of terms) {
    if (page.includes(term)) total += 10
    else if (heading.includes(term)) total += 5
    else if (text.includes(term)) total += 1
    else return 0
  }
  return total
}

async function onFilter (needle: string, update: (fn: () => void) => void) {
  const terms = needle.toLowerCase().split(/\s+/).filter((term) => term.length > 1)
  if (terms.length === 0) {
    update(() => { results.value = [] })
    return
  }
  index = index ?? await buildIndex()
  const scored = index
    .map((entry) => ({ entry, score: score(entry, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
  update(() => {
    results.value = scored.map(({ entry }) => ({ ...entry, label: entry.heading ? `${entry.page} / ${entry.heading}` : entry.page }))
  })
}

function onSelect (result: Result | null) {
  if (!result) return
  selected.value = null
  selectRef.value?.blur()
  router.push({ path: `/${result.path}`, hash: result.hash })
}
</script>

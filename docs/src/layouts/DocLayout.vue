<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="drawer = !drawer" />
        <q-toolbar-title shrink>
          <router-link to="/" class="text-white" style="text-decoration: none">Quasar JSON Form</router-link>
          <q-badge outline color="white" class="q-ml-sm">v{{ version }}</q-badge>
        </q-toolbar-title>
        <q-space />
        <DocSearch class="gt-xs q-mr-sm" />
        <q-btn-dropdown flat dense :label="locale" class="on-left">
          <q-list>
            <q-item
              v-for="localeOpt in localeOptions"
              :key="localeOpt.value"
              clickable
              v-close-popup
              @click="locale = localeOpt.value"
            >
              <q-item-section>
                <q-item-label>{{ localeOpt.label }}</q-item-label>
              </q-item-section>
              <q-item-section side v-if="locale === localeOpt.value">
                <q-icon color="primary" name="check" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn flat dense round :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" :aria-label="t('dark_mode')" @click="toggleDark">
          <q-tooltip>{{ t('dark_mode') }}</q-tooltip>
        </q-btn>
        <q-btn flat dense round :icon="githubIcon" type="a" href="https://github.com/obiba/quasar-json-form" target="_blank" aria-label="GitHub">
          <q-tooltip>GitHub</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above bordered :width="260">
      <q-scroll-area class="fit">
        <q-list padding>
          <q-expansion-item
            v-for="section in menu"
            :key="section.title"
            :label="section.title"
            :icon="section.icon"
            :default-opened="section.title === currentSection"
            expand-separator
          >
            <q-item
              v-for="page in section.pages"
              :key="page.path"
              :to="'/' + page.path"
              :inset-level="1"
              dense
              active-class="text-primary text-weight-medium"
            >
              <q-item-section>{{ page.title }}</q-item-section>
            </q-item>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <q-page padding class="row no-wrap" @click="onPageClick">
        <div class="col doc-content">
          <router-view v-slot="{ Component }">
            <component :is="Component" :key="route.path" @vue:mounted="collectHeadings" />
          </router-view>
          <div v-if="editUrl" class="doc-footer text-caption text-grey-7 q-mt-xl q-pt-md">
            <q-icon name="edit" size="xs" class="q-mr-xs" />
            <a :href="editUrl" target="_blank" rel="noopener">{{ t('edit_page') }}</a>
          </div>
        </div>
        <aside v-if="headings.length > 1" class="doc-toc gt-md">
          <div class="doc-toc__inner">
            <div class="text-caption text-uppercase text-grey-7 q-mb-sm">{{ t('on_this_page') }}</div>
            <a
              v-for="heading in headings"
              :key="heading.id"
              :href="`#${route.path}#${heading.id}`"
              class="doc-toc__link"
              :class="{ 'doc-toc__link--sub': heading.level === 3, 'doc-toc__link--active': heading.id === activeId }"
              @click.prevent="goTo(heading.id)"
            >{{ heading.text }}</a>
          </div>
        </aside>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { version } from 'ui'
import menu from '../menu'
import DocSearch from '../components/DocSearch.vue'

interface Heading { id: string; text: string; level: number }

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const { locale, t } = useI18n()
const drawer = ref(false)
const localeOptions = [
  { label: 'EN', value: 'en' },
  { label: 'FR', value: 'fr' },
]
// GitHub mark (simple-icons), as a Quasar svg path icon
const githubIcon = 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12|0 0 24 24'
const currentSection = computed(() => route.meta.section as string | undefined)

const editUrl = computed(() => {
  const path = route.path.replace(/^\//, '')
  return path ? `https://github.com/obiba/quasar-json-form/edit/master/docs/src/pages/${path}.md` : undefined
})

// ---- dark mode, remembered per browser
const DARK_KEY = 'quasar-json-form-docs-dark'

function toggleDark () {
  $q.dark.toggle()
  try {
    localStorage.setItem(DARK_KEY, String($q.dark.isActive))
  } catch {
    // storage unavailable (private window...): the choice is not remembered
  }
}

// the OS preference, unless the viewer chose otherwise
try {
  const stored = localStorage.getItem(DARK_KEY)
  $q.dark.set(stored === null ? 'auto' : stored === 'true')
} catch {
  $q.dark.set('auto')
}

// ---- table of contents of the current page
const headings = ref<Heading[]>([])
const activeId = ref('')
const HEADER_OFFSET = 70

async function collectHeadings () {
  await nextTick()
  const elements = Array.from(document.querySelectorAll<HTMLElement>('.doc-page h2[id], .doc-page h3[id]'))
  headings.value = elements.map((el) => ({ id: el.id, text: el.textContent?.replace(/\s*#\s*$/, '').trim() ?? '', level: Number(el.tagName[1]) }))
  updateActive()
  setTimeout(updateActive, 500)
}

const documentTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY

function updateActive () {
  const top = window.scrollY + HEADER_OFFSET + 8
  let current = ''
  for (const heading of headings.value) {
    const el = document.getElementById(heading.id)
    if (el && documentTop(el) <= top) current = heading.id
  }
  // scrolled to the bottom: the last heading is the one being read
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
  if (atBottom && headings.value.length > 0) current = headings.value[headings.value.length - 1]!.id
  activeId.value = current
}

// the router scrolls to the heading (scrollBehavior)
function goTo (id: string) {
  router.replace({ path: route.path, hash: `#${id}` })
  setTimeout(updateActive, 800)
}

// heading permalinks of the Markdown pages are `<a href="#id">`: keep them in the page
function onPageClick (event: MouseEvent) {
  const anchor = (event.target as HTMLElement).closest('a')
  if (!anchor) return
  const href = anchor.getAttribute('href') ?? ''
  if (/^#[^/]/.test(href)) {
    event.preventDefault()
    goTo(href.slice(1))
  }
}

let ticking = false
function onScroll () {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    updateActive()
    ticking = false
  })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

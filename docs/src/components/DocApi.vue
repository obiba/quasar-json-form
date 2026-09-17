<template>
  <q-card flat bordered class="doc-api q-my-md">
    <q-card-section class="row items-center q-py-sm doc-card-header">
      <div class="text-subtitle2">{{ api?.name ?? name }} API</div>
      <q-space />
      <q-input v-model="filter" dense outlined debounce="200" placeholder="Filter" clearable style="width: 200px">
        <template #prepend><q-icon name="search" /></template>
      </q-input>
    </q-card-section>
    <q-separator />

    <template v-if="api">
      <q-tabs v-model="tab" dense align="left" active-color="primary" narrow-indicator>
        <q-tab v-for="s in sections" :key="s.name" :name="s.name">
          <div class="row items-center no-wrap q-gutter-x-xs">
            <span>{{ s.label }}</span>
            <q-badge rounded color="grey-5">{{ s.count }}</q-badge>
          </div>
        </q-tab>
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="tab" animated class="bg-transparent">
        <q-tab-panel name="triggers" class="q-pa-none">
          <q-markup-table flat dense wrap-cells>
            <thead>
              <tr><th>{{ t('api.schema') }}</th><th>{{ t('api.rank') }}</th><th>{{ t('api.description') }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="(trigger, i) in filtered(api.triggers)" :key="i">
                <td><code>{{ trigger.schema }}</code></td>
                <td>{{ trigger.rank }}</td>
                <td v-html="md(trigger.desc)"></td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-tab-panel>

        <q-tab-panel v-for="group in ['props', 'element', 'options', 'common', 'events', 'validation']" :key="group" :name="group" class="q-pa-none">
          <q-markup-table flat dense wrap-cells>
            <thead>
              <tr>
                <th>{{ t('api.name') }}</th>
                <th v-if="group !== 'events'">{{ group === 'validation' ? t('api.message') : t('api.type') }}</th>
                <th v-if="withDefault(group)">{{ t('api.default') }}</th>
                <th>{{ t('api.description') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in filtered(entries(group))" :key="entry.name">
                <td class="text-no-wrap"><code>{{ entry.name }}</code></td>
                <td v-if="group !== 'events'"><code v-if="entry.type || entry.message">{{ entry.type ?? entry.message }}</code></td>
                <td v-if="withDefault(group)"><code v-if="entry.default !== undefined">{{ entry.default }}</code></td>
                <td v-html="md(entry.desc)"></td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-tab-panel>

        <q-tab-panel name="data" class="q-pa-md">
          <div v-html="md(api.data!.desc)"></div>
          <DocCode v-if="api.data!.example" :code="api.data!.example" class="q-mt-sm" />
        </q-tab-panel>
      </q-tab-panels>
    </template>
    <q-card-section v-else class="text-negative">API not found: {{ name }}</q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { renderMarkdownInline } from 'ui'
import { catalog, controlApi } from 'ui/catalog'
import type { ApiEntry as CatalogEntry, RendererApi } from 'ui/catalog'
import DocCode from './DocCode.vue'

interface ApiEntry extends CatalogEntry { name: string }

const props = defineProps<{ name: string }>()
const { t } = useI18n()

// the renderer descriptions come from the library catalog
const api = computed<RendererApi | undefined>(() => catalog[props.name])
const common = computed(() => (api.value?.inherits === 'control' ? controlApi : undefined))

const filter = ref('')

function toEntries (map?: Record<string, Omit<ApiEntry, 'name'>>): ApiEntry[] {
  return Object.entries(map ?? {}).map(([name, entry]) => ({ name, ...entry }))
}

function entries (group: string): ApiEntry[] {
  if (group === 'common') return toEntries(common.value?.options)
  if (group === 'element') return [...toEntries(api.value?.element), ...toEntries(common.value?.element)]
  return toEntries((api.value as unknown as Record<string, Record<string, CatalogEntry>>)[group])
}

function filtered<T extends object> (list: T[] | undefined): T[] {
  const needle = (filter.value || '').toLowerCase()
  if (!needle) return list ?? []
  return (list ?? []).filter((item) => JSON.stringify(item).toLowerCase().includes(needle))
}

const sections = computed(() => {
  const all = [
    { name: 'triggers', label: t('api.triggers'), count: api.value?.triggers?.length ?? 0 },
    { name: 'props', label: t('api.props'), count: entries('props').length },
    { name: 'element', label: t('api.element'), count: entries('element').length },
    { name: 'events', label: t('api.events'), count: entries('events').length },
    { name: 'options', label: t('api.options'), count: entries('options').length },
    { name: 'common', label: t('api.common'), count: entries('common').length },
    { name: 'validation', label: t('api.validation'), count: entries('validation').length },
    { name: 'data', label: t('api.data'), count: api.value?.data ? 1 : 0 },
  ]
  return all.filter((s) => s.count > 0)
})

const withDefault = (group: string) => ['props', 'element', 'options', 'common'].includes(group)

const tab = ref(sections.value[0]?.name ?? 'options')

const md = (text: string) => renderMarkdownInline(text ?? '')
</script>

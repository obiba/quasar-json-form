<template>
  <div class="doc-code-wrapper relative-position">
    <q-btn
      flat
      dense
      round
      size="sm"
      icon="content_copy"
      class="absolute-top-right q-ma-xs text-grey-5"
      :aria-label="t('copy')"
      @click="onCopy"
    >
      <q-tooltip>{{ warning || t('copy') }}</q-tooltip>
    </q-btn>
    <pre :class="`doc-code language-${lang}`"><code :class="`language-${lang}`" v-html="html"></code></pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { copyToClipboard, Notify } from 'quasar'
import { useI18n } from 'vue-i18n'
import Prism from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-javascript'

const props = withDefaults(defineProps<{ code: string; lang?: string; warning?: string }>(), { lang: 'json' })
const { t } = useI18n()

const html = computed(() => {
  const grammar = Prism.languages[props.lang]
  return grammar ? Prism.highlight(props.code, grammar, props.lang) : props.code.replace(/</g, '&lt;')
})

function onCopy () {
  copyToClipboard(props.code).then(() => Notify.create({ message: t('copied'), type: 'positive', timeout: 1000 }))
}
</script>

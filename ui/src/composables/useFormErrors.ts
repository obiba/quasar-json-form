/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, inject, onUnmounted, provide, reactive, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { ErrorObject } from 'ajv'
import { FORM_ERRORS_KEY } from './keys'

export { FORM_ERRORS_KEY }

/**
 * Collects the errors found by the renderers themselves (`validation`
 * rules, "completed in all languages", word limits, file counts...) so that
 * `QJsonForm` can emit them with `update:errors` next to the AJV errors.
 */
export interface FormErrorRegistry {
  /** sets the messages of a path and keyword; `owner` (any value) claims the entry */
  set(path: string, keyword: string, messages: string[], owner?: unknown): void
  /** removes the messages of a path and keyword, unless another `owner` claimed the entry since */
  remove(path: string, keyword: string, owner?: unknown): void
  errors: ComputedRef<ErrorObject[]>
}

/** JSON Forms dotted path -> JSON pointer, as in AJV `instancePath` */
export function toInstancePath(path: string): string {
  if (!path) return ''
  return '/' + path.split('.').map((segment) => segment.replace(/~/g, '~0').replace(/\//g, '~1')).join('/')
}

export function createFormErrorRegistry(): FormErrorRegistry {
  const entries = reactive(new Map<string, ErrorObject[]>())
  // the last owner of each entry: a renderer mounted again (new UI schema)
  // reports its errors before the previous instance is unmounted, whose
  // removal must not drop them
  const owners = new Map<string, unknown>()

  const idOf = (path: string, keyword: string) => `${path}::${keyword}`

  const set = (path: string, keyword: string, messages: string[], owner?: unknown) => {
    const id = idOf(path, keyword)
    owners.set(id, owner)
    if (messages.length === 0) {
      if (entries.has(id)) entries.delete(id)
      return
    }
    const current = entries.get(id)
    if (current && current.length === messages.length && current.every((e, i) => e.message === messages[i])) {
      return
    }
    entries.set(id, messages.map((message) => ({
      keyword,
      instancePath: toInstancePath(path),
      schemaPath: '',
      params: {},
      message,
    })))
  }

  const remove = (path: string, keyword: string, owner?: unknown) => {
    const id = idOf(path, keyword)
    if (owners.get(id) !== owner) return
    owners.delete(id)
    if (entries.has(id)) entries.delete(id)
  }

  const errors = computed(() => Array.from(entries.values()).flat())

  return { set, remove, errors }
}

export function provideFormErrorRegistry(): FormErrorRegistry {
  const registry = createFormErrorRegistry()
  provide(FORM_ERRORS_KEY, registry)
  return registry
}

/**
 * Reports the errors computed by a renderer to the enclosing form, under the
 * given keyword. No-op when there is no enclosing `QJsonForm`.
 */
export function useReportedErrors(
  path: () => string,
  keyword: string,
  messages: Ref<string[]> | ComputedRef<string[]>,
): void {
  const registry = inject<FormErrorRegistry | undefined>(FORM_ERRORS_KEY, undefined)
  if (!registry) return
  const owner = Symbol(keyword)
  let lastPath = path()
  watch(
    [path, messages],
    ([currentPath, currentMessages]) => {
      if (currentPath !== lastPath) {
        registry.remove(lastPath, keyword, owner)
        lastPath = currentPath
      }
      registry.set(currentPath, keyword, currentMessages, owner)
    },
    { immediate: true },
  )
  onUnmounted(() => registry.remove(lastPath, keyword, owner))
}

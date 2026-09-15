/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, inject, onUnmounted, provide, reactive, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { ErrorObject } from 'ajv'
import { FORM_ERRORS_KEY } from './keys'

export { FORM_ERRORS_KEY }

/**
 * Collects the errors found by the renderers themselves (filtrex `validation`
 * rules, "completed in all languages", word limits, file counts...) so that
 * `QJsonForm` can emit them with `update:errors` next to the AJV errors.
 */
export interface FormErrorRegistry {
  set(path: string, keyword: string, messages: string[]): void
  remove(path: string, keyword: string): void
  errors: ComputedRef<ErrorObject[]>
}

/** JSON Forms dotted path -> JSON pointer, as in AJV `instancePath` */
export function toInstancePath(path: string): string {
  return path ? '/' + path.split('.').join('/') : ''
}

export function createFormErrorRegistry(): FormErrorRegistry {
  const entries = reactive(new Map<string, ErrorObject[]>())

  const idOf = (path: string, keyword: string) => `${path}::${keyword}`

  const set = (path: string, keyword: string, messages: string[]) => {
    const id = idOf(path, keyword)
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

  const remove = (path: string, keyword: string) => {
    const id = idOf(path, keyword)
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
  let lastPath = path()
  watch(
    [path, messages],
    ([currentPath, currentMessages]) => {
      if (currentPath !== lastPath) {
        registry.remove(lastPath, keyword)
        lastPath = currentPath
      }
      registry.set(currentPath, keyword, currentMessages)
    },
    { immediate: true },
  )
  onUnmounted(() => registry.remove(lastPath, keyword))
}

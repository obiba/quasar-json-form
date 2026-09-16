/* eslint-disable @typescript-eslint/no-explicit-any */
import { h, ref, computed, defineComponent, nextTick } from 'vue'
import type { PropType, VNode } from 'vue'
import { QInput, QBtn, QSpace } from 'quasar'
import { renderMarkdown } from '../utils/markdown'
import { useFormI18n } from '../composables/useFormI18n'

interface Edit {
  text: string
  /** selection to apply after the edit, relative to the insertion point */
  select?: [number, number]
}

/**
 * Markdown editor: a textarea with a small formatting toolbar and a preview
 * toggle; read-only, the rendered markdown is displayed. Used by the string
 * (`format: "markdown"`) and localized string (`marked`) renderers.
 *
 * The `toolbar` slot adds content to the right of the toolbar (for instance a
 * language selector); the `hint` slot is the hint under the editor when the
 * `hint` prop is not set (the `hint` slot of the QInput).
 */
export default defineComponent({
  name: 'QMarkdownEditor',
  props: {
    modelValue: { type: String as PropType<string | undefined>, default: undefined },
    label: { type: String, default: undefined },
    hint: { type: String, default: undefined },
    rows: { type: Number, default: 5 },
    readonly: { type: Boolean, default: false },
    disable: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    errorMessage: { type: String, default: undefined },
    /** extra props passed to the QInput */
    inputProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, slots }) {
    const { translate } = useFormI18n()
    const inputRef = ref<any>(null)
    const preview = ref(false)

    const html = computed(() => (props.modelValue ? renderMarkdown(props.modelValue) : ''))

    const nativeTextarea = (): HTMLTextAreaElement | undefined => {
      const el = inputRef.value?.getNativeElement?.()
      return el && typeof el.selectionStart === 'number' ? (el as HTMLTextAreaElement) : undefined
    }

    // Replace the current selection of the textarea with the result of `edit`
    const apply = (edit: (selected: string) => Edit) => {
      const el = nativeTextarea()
      const value = props.modelValue || ''
      const start = el ? el.selectionStart : value.length
      const end = el ? el.selectionEnd : value.length
      const { text, select } = edit(value.slice(start, end))
      emit('update:modelValue', value.slice(0, start) + text + value.slice(end))
      nextTick(() => {
        const target = nativeTextarea()
        if (!target) return
        target.focus()
        const [from, to] = select || [text.length, text.length]
        target.setSelectionRange(start + from, start + to)
      })
    }

    const wrap = (marker: string) => apply((selected) => {
      const inner = selected || 'text'
      return {
        text: `${marker}${inner}${marker}`,
        select: selected ? undefined : [marker.length, marker.length + inner.length],
      }
    })

    const prefixLines = (prefix: string) => apply((selected) => {
      const inner = selected || 'text'
      const text = inner.split('\n').map((line) => prefix + line).join('\n')
      return { text, select: selected ? undefined : [prefix.length, prefix.length + inner.length] }
    })

    const link = () => apply((selected) => {
      const inner = selected || 'text'
      const text = `[${inner}](url)`
      return { text, select: [inner.length + 3, inner.length + 6] }
    })

    const actions = [
      { icon: 'format_bold', title: 'markdown.bold', run: () => wrap('**') },
      { icon: 'format_italic', title: 'markdown.italic', run: () => wrap('_') },
      { icon: 'title', title: 'markdown.heading', run: () => prefixLines('## ') },
      { icon: 'format_list_bulleted', title: 'markdown.list', run: () => prefixLines('- ') },
      { icon: 'link', title: 'markdown.link', run: link },
    ]

    // Hint under the rendered markdown (read-only and preview): the `hint` prop, else the `hint` slot
    const renderHint = (): VNode | null => {
      const content = props.hint ?? (slots.hint ? slots.hint() : undefined)
      if (content === undefined || content === null || content === '') return null
      return h('div', { class: 'text-caption text-grey-7 q-mt-xs q-markdown-editor__hint' }, [content])
    }

    return () => {
      const extra = slots.toolbar ? slots.toolbar() : []

      if (props.readonly) {
        return h('div', { class: 'q-markdown-editor q-markdown-editor--readonly' }, [
          props.label || extra.length > 0
            ? h('div', { class: 'row items-center no-wrap q-markdown-editor__toolbar' }, [
              props.label ? h('div', { class: 'text-caption text-grey-7' }, props.label) : null,
              h(QSpace),
              ...extra,
            ])
            : null,
          h('div', { class: 'q-markdown-editor__preview text-markdown', innerHTML: html.value }),
          props.error && props.errorMessage
            ? h('div', { class: 'text-negative text-caption q-mt-xs' }, props.errorMessage)
            : renderHint(),
        ])
      }

      const toolbar = h('div', { class: 'row items-center no-wrap q-markdown-editor__toolbar' }, [
        ...actions.map((action) => h(QBtn, {
          flat: true,
          dense: true,
          size: 'sm',
          icon: action.icon,
          title: translate(action.title),
          disable: props.disable || preview.value,
          onClick: action.run,
        })),
        h(QSpace),
        ...extra,
        h(QBtn, {
          flat: true,
          dense: true,
          size: 'sm',
          class: 'q-markdown-editor__preview-toggle',
          icon: preview.value ? 'edit' : 'visibility',
          color: preview.value ? 'primary' : undefined,
          title: translate(preview.value ? 'markdown.edit' : 'markdown.preview'),
          disable: props.disable,
          onClick: () => { preview.value = !preview.value },
        }),
      ])

      const body = preview.value
        ? h('div', {}, [
          props.label ? h('div', { class: 'text-caption text-grey-7' }, props.label) : null,
          h('div', { class: 'q-markdown-editor__preview text-markdown', innerHTML: html.value }),
          props.error && props.errorMessage
            ? h('div', { class: 'text-negative text-caption q-mt-xs' }, props.errorMessage)
            : renderHint(),
        ])
        : h(QInput, {
          ...props.inputProps,
          ref: inputRef,
          modelValue: props.modelValue ?? '',
          'onUpdate:modelValue': (value: any) => emit('update:modelValue', value),
          type: 'textarea',
          rows: props.rows,
          label: props.label,
          hint: props.hint,
          error: props.error,
          errorMessage: props.errorMessage,
          disable: props.disable,
        }, slots.hint ? { hint: slots.hint } : {})

      return h('div', { class: 'q-markdown-editor' }, [toolbar, body])
    }
  },
})

declare module '*.md' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
  export const frontmatter: Record<string, unknown>
}

declare const __UI_VERSION__: string

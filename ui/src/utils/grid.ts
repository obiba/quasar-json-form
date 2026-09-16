/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CSS grid helpers of the GridLayout renderer (QGridLayout): the `options` of
 * the layout are mapped onto the `grid-template-*` properties of the container,
 * the `options.grid` of each element onto the `grid-column` / `grid-row` /
 * `grid-area` placement of its cell.
 *
 * Every value can also be a Quasar breakpoint map (`{ xs: 1, md: 2 }`),
 * resolved mobile-first against the current screen: the value of the largest
 * declared breakpoint that is not wider than the screen applies, and none
 * below the smallest declared breakpoint.
 */

export const BREAKPOINTS = ['xs', 'sm', 'md', 'lg', 'xl'] as const

export type Breakpoint = (typeof BREAKPOINTS)[number]

export type Responsive<T> = T | Partial<Record<Breakpoint, T>>

/** Container options: `options` of a GridLayout */
export interface GridOptions {
  columns?: Responsive<number | string>
  rows?: Responsive<number | string>
  areas?: Responsive<string[] | string>
  gap?: Responsive<number | string>
  rowGap?: Responsive<number | string>
  columnGap?: Responsive<number | string>
  autoFlow?: Responsive<string>
  align?: Responsive<string>
  justify?: Responsive<string>
}

/** Placement of an element: `options.grid` of a child of a GridLayout */
export interface GridPlacement {
  column?: Responsive<number | string>
  row?: Responsive<number | string>
  colSpan?: Responsive<number>
  rowSpan?: Responsive<number>
  area?: Responsive<string>
  align?: Responsive<string>
  justify?: Responsive<string>
}

export const DEFAULT_ROW_GAP = '10px'
export const DEFAULT_COLUMN_GAP = '20px'

export function isBreakpointMap(value: unknown): value is Partial<Record<Breakpoint, unknown>> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = Object.keys(value as object)
  return keys.length > 0 && keys.every((key) => (BREAKPOINTS as readonly string[]).includes(key))
}

/** The value applying to `screen`, mobile-first, or `value` itself when it is not a breakpoint map. */
export function resolveBreakpoint<T>(value: Responsive<T> | undefined, screen: Breakpoint): T | undefined {
  if (!isBreakpointMap(value)) return value as T | undefined
  const map = value as Partial<Record<Breakpoint, T>>
  for (let i = BREAKPOINTS.indexOf(screen); i >= 0; i--) {
    const candidate = map[BREAKPOINTS[i]!]
    if (candidate !== undefined) return candidate
  }
  return undefined
}

/** `10` → `10px`, strings as is */
function length(value: number | string | undefined): string | undefined {
  if (typeof value === 'number') return `${value}px`
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** `3` → `repeat(3, minmax(0, 1fr))`, strings as is */
function tracks(value: number | string | undefined): string | undefined {
  if (typeof value === 'number') return value > 0 ? `repeat(${value}, minmax(0, 1fr))` : undefined
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** `['a a', 'b c']` → `"a a" "b c"`, strings as is */
function areas(value: string[] | string | undefined): string | undefined {
  if (Array.isArray(value)) return value.length > 0 ? value.map((row) => `"${row}"`).join(' ') : undefined
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** `2` → `2`, `'1 / 3'` and `'span 2'` as is */
function line(value: number | string | undefined): string | undefined {
  if (typeof value === 'number') return String(value)
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function keyword(value: string | undefined): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function assign(style: Record<string, string>, property: string, value: string | undefined): void {
  if (value !== undefined) style[property] = value
}

/** Inline style of the grid container */
export function gridContainerStyle(options: GridOptions | undefined, screen: Breakpoint): Record<string, string> {
  const opts = options || {}
  const style: Record<string, string> = {}
  assign(style, 'gridTemplateColumns', tracks(resolveBreakpoint(opts.columns, screen)))
  assign(style, 'gridTemplateRows', tracks(resolveBreakpoint(opts.rows, screen)))
  assign(style, 'gridTemplateAreas', areas(resolveBreakpoint(opts.areas, screen)))
  const gap = length(resolveBreakpoint(opts.gap, screen))
  style.rowGap = length(resolveBreakpoint(opts.rowGap, screen)) ?? gap ?? DEFAULT_ROW_GAP
  style.columnGap = length(resolveBreakpoint(opts.columnGap, screen)) ?? gap ?? DEFAULT_COLUMN_GAP
  assign(style, 'gridAutoFlow', keyword(resolveBreakpoint(opts.autoFlow, screen)))
  assign(style, 'alignItems', keyword(resolveBreakpoint(opts.align, screen)))
  assign(style, 'justifyItems', keyword(resolveBreakpoint(opts.justify, screen)))
  return style
}

/** Inline style of the cell wrapping an element; `column` / `row` win over `colSpan` / `rowSpan` */
export function gridCellStyle(placement: GridPlacement | undefined, screen: Breakpoint): Record<string, string> {
  const style: Record<string, string> = {}
  if (!placement || typeof placement !== 'object') return style
  const colSpan = resolveBreakpoint(placement.colSpan, screen)
  const rowSpan = resolveBreakpoint(placement.rowSpan, screen)
  assign(style, 'gridColumn', line(resolveBreakpoint(placement.column, screen)) ?? (typeof colSpan === 'number' && colSpan > 0 ? `span ${colSpan}` : undefined))
  assign(style, 'gridRow', line(resolveBreakpoint(placement.row, screen)) ?? (typeof rowSpan === 'number' && rowSpan > 0 ? `span ${rowSpan}` : undefined))
  assign(style, 'gridArea', keyword(resolveBreakpoint(placement.area, screen)))
  assign(style, 'alignSelf', keyword(resolveBreakpoint(placement.align, screen)))
  assign(style, 'justifySelf', keyword(resolveBreakpoint(placement.justify, screen)))
  return style
}

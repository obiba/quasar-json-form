import { describe, it, expect } from 'vitest'
import { mountForm, flush } from './utils'
import { gridContainerStyle, gridCellStyle, resolveBreakpoint, isBreakpointMap } from '../src/utils/grid'

const schema = {
  type: 'object',
  properties: {
    a: { type: 'string', title: 'A' },
    b: { type: 'string', title: 'B' },
    c: { type: 'string', title: 'C' },
    show: { type: 'boolean' },
  },
}

describe('grid utils', () => {
  it('detects breakpoint maps', () => {
    expect(isBreakpointMap({ xs: 1, md: 2 })).toBe(true)
    expect(isBreakpointMap({ xs: 1, foo: 2 })).toBe(false)
    expect(isBreakpointMap({})).toBe(false)
    expect(isBreakpointMap(['a'])).toBe(false)
    expect(isBreakpointMap('1 / 3')).toBe(false)
    expect(isBreakpointMap(null)).toBe(false)
  })

  it('resolves breakpoint maps mobile-first', () => {
    const map = { sm: 1, lg: 3 }
    expect(resolveBreakpoint(map, 'xs')).toBeUndefined()
    expect(resolveBreakpoint(map, 'sm')).toBe(1)
    expect(resolveBreakpoint(map, 'md')).toBe(1)
    expect(resolveBreakpoint(map, 'lg')).toBe(3)
    expect(resolveBreakpoint(map, 'xl')).toBe(3)
    expect(resolveBreakpoint('span 2', 'xs')).toBe('span 2')
    expect(resolveBreakpoint(undefined, 'xs')).toBeUndefined()
  })

  it('maps the layout options onto the container style', () => {
    expect(gridContainerStyle(undefined, 'md')).toEqual({ rowGap: '10px', columnGap: '20px' })
    expect(gridContainerStyle({ columns: 3, gap: 8 }, 'md')).toEqual({
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      rowGap: '8px',
      columnGap: '8px',
    })
    expect(gridContainerStyle({
      columns: '200px 1fr',
      rows: 'auto 1fr',
      areas: ['title title', 'year month'],
      gap: '1rem',
      columnGap: 4,
      autoFlow: 'row dense',
      align: 'start',
      justify: 'stretch',
    }, 'md')).toEqual({
      gridTemplateColumns: '200px 1fr',
      gridTemplateRows: 'auto 1fr',
      gridTemplateAreas: '"title title" "year month"',
      rowGap: '1rem',
      columnGap: '4px',
      gridAutoFlow: 'row dense',
      alignItems: 'start',
      justifyItems: 'stretch',
    })
    expect(gridContainerStyle({ areas: '"a b"' }, 'md').gridTemplateAreas).toBe('"a b"')
    expect(gridContainerStyle({ columns: 0, areas: [] }, 'md')).toEqual({ rowGap: '10px', columnGap: '20px' })
  })

  it('maps responsive layout options', () => {
    const options = { columns: { xs: 1, md: 2, lg: 4 }, gap: { xs: 4, lg: '2rem' } }
    expect(gridContainerStyle(options, 'xs').gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))')
    expect(gridContainerStyle(options, 'sm').gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))')
    expect(gridContainerStyle(options, 'md').gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))')
    expect(gridContainerStyle(options, 'xl').gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))')
    expect(gridContainerStyle(options, 'md').rowGap).toBe('4px')
    expect(gridContainerStyle(options, 'lg').columnGap).toBe('2rem')
  })

  it('maps the element placement onto the cell style', () => {
    expect(gridCellStyle(undefined, 'md')).toEqual({})
    expect(gridCellStyle({ column: 2, row: '1 / 3' }, 'md')).toEqual({ gridColumn: '2', gridRow: '1 / 3' })
    expect(gridCellStyle({ colSpan: 2, rowSpan: 3 }, 'md')).toEqual({ gridColumn: 'span 2', gridRow: 'span 3' })
    // explicit lines win over spans
    expect(gridCellStyle({ column: '1 / -1', colSpan: 2 }, 'md')).toEqual({ gridColumn: '1 / -1' })
    expect(gridCellStyle({ area: 'title', align: 'end', justify: 'center' }, 'md')).toEqual({
      gridArea: 'title',
      alignSelf: 'end',
      justifySelf: 'center',
    })
    expect(gridCellStyle({ column: { md: 'span 2' } }, 'xs')).toEqual({})
    expect(gridCellStyle({ column: { md: 'span 2' } }, 'lg')).toEqual({ gridColumn: 'span 2' })
    expect(gridCellStyle({ colSpan: 0 }, 'md')).toEqual({})
  })
})

describe('GridLayout', () => {
  it('renders a grid container with one cell per element', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'GridLayout',
        options: { columns: 2, gap: 8, class: 'q-pa-md' },
        elements: [
          { type: 'Control', scope: '#/properties/a', options: { grid: { column: '1 / -1' } } },
          { type: 'Control', scope: '#/properties/b' },
          { type: 'Group', label: 'G', options: { grid: { colSpan: 2 } }, elements: [{ type: 'Control', scope: '#/properties/c' }] },
        ],
      },
    })
    await flush()
    const root = wrapper.find('.json-form-wrapper > .q-grid-layout')
    expect(root.exists()).toBe(true)
    expect(root.classes()).toContain('q-pa-md')
    expect(root.attributes('style')).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
    expect(root.attributes('style')).toContain('row-gap: 8px')
    expect(root.attributes('style')).toContain('column-gap: 8px')
    const cells = root.findAll(':scope > .q-grid-layout__cell')
    expect(cells.length).toBe(3)
    expect(cells[0]!.attributes('style')).toContain('grid-column: 1 / -1')
    expect(cells[0]!.find(':scope > .q-string-renderer').exists()).toBe(true)
    expect(cells[1]!.attributes('style')).toBeUndefined()
    expect(cells[1]!.find(':scope > .q-string-renderer').exists()).toBe(true)
    expect(cells[2]!.attributes('style')).toContain('grid-column: span 2')
    expect(cells[2]!.find(':scope > .q-group-renderer').exists()).toBe(true)
    // the placement option is not forwarded to the Quasar component
    expect(wrapper.find('[grid]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('does not forward the placement option to renderers spreading their options', async () => {
    const wrapper = mountForm({
      schema: {
        type: 'object',
        properties: {
          n: { type: 'number', title: 'N' },
          s: { type: 'string', title: 'S', enum: ['a', 'b'] },
          t: { type: 'boolean', title: 'T' },
          r: { type: 'integer', title: 'R' },
        },
      },
      uischema: {
        type: 'GridLayout',
        options: { columns: 2 },
        elements: [
          { type: 'Control', scope: '#/properties/n', options: { grid: { colSpan: 2 } } },
          { type: 'Control', scope: '#/properties/s', options: { grid: { column: 1 } } },
          { type: 'Control', scope: '#/properties/s', options: { grid: { column: 2 }, format: 'radio' } },
          { type: 'Control', scope: '#/properties/t', options: { grid: { row: 3 } } },
          { type: 'Control', scope: '#/properties/r', options: { grid: { row: 4 }, format: 'rating' } },
        ],
      },
    })
    await flush()
    const cells = wrapper.findAll('.q-grid-layout__cell')
    expect(cells.length).toBe(5)
    expect(cells[0]!.find('.q-field input[type=number]').exists()).toBe(true)
    expect(cells[1]!.find('.q-select').exists()).toBe(true)
    expect(cells[2]!.find('.q-radio').exists()).toBe(true)
    expect(cells[3]!.find('.q-toggle').exists()).toBe(true)
    expect(cells[4]!.find('.q-rating').exists()).toBe(true)
    expect(wrapper.find('[grid]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('places elements in named areas', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'GridLayout',
        options: { columns: '1fr 1fr', areas: ['a a', 'b c'] },
        elements: [
          { type: 'Control', scope: '#/properties/a', options: { grid: { area: 'a' } } },
          { type: 'Control', scope: '#/properties/b', options: { grid: { area: 'b' } } },
          { type: 'Control', scope: '#/properties/c', options: { grid: { area: 'c' } } },
        ],
      },
    })
    await flush()
    const root = wrapper.find('.q-grid-layout')
    expect(root.attributes('style')).toContain('grid-template-areas: "a a" "b c"')
    const cells = root.findAll(':scope > .q-grid-layout__cell')
    expect(cells.map((cell) => cell.attributes('style'))).toEqual(['grid-area: a;', 'grid-area: b;', 'grid-area: c;'])
    wrapper.unmount()
  })

  it('leaves the cell of a hidden element empty and honors the layout rules', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'GridLayout',
            rules: { visible: 'truthy(show) or truthy(a)' },
            elements: [
              { type: 'Control', scope: '#/properties/a' },
              { type: 'Control', scope: '#/properties/b', rules: { visible: 'truthy(show)' } },
            ],
          },
        ],
      },
      modelValue: { show: false, a: 'x' },
    })
    await flush()
    let cells = wrapper.findAll('.q-grid-layout__cell')
    expect(cells.length).toBe(2)
    expect(cells[0]!.find('.q-field').exists()).toBe(true)
    expect(cells[1]!.element.children.length).toBe(0)
    await wrapper.setProps({ modelValue: { show: true, a: 'x' } })
    await flush()
    cells = wrapper.findAll('.q-grid-layout__cell')
    expect(cells[1]!.find('.q-field').exists()).toBe(true)
    await wrapper.setProps({ modelValue: { show: false, a: '' } })
    await flush()
    expect(wrapper.find('.q-grid-layout').exists()).toBe(false)
    wrapper.unmount()
  })

  it('nests inside the flex layouts', async () => {
    const wrapper = mountForm({
      schema,
      uischema: {
        type: 'HorizontalLayout',
        elements: [
          { type: 'GridLayout', options: { columns: 2 }, elements: [{ type: 'Control', scope: '#/properties/a' }] },
          { type: 'Control', scope: '#/properties/b' },
        ],
      },
    })
    await flush()
    expect(wrapper.find('.q-horizontal-layout > .q-grid-layout > .q-grid-layout__cell > .q-string-renderer').exists()).toBe(true)
    wrapper.unmount()
  })
})

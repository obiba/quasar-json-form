import { describe, it, expect, vi, afterEach } from 'vitest'
import { ref } from 'vue'
import { FiltrexRuleEngine, filtrexEngine, useFiltrexRules } from '../src/composables/useFiltrexRules'

const evaluate = (expression: string, context: Record<string, unknown> = {}) => filtrexEngine.evaluate(expression, context)

describe('FiltrexRuleEngine built-in functions', () => {
  afterEach(() => vi.restoreAllMocks())

  it('isEmpty / isNotEmpty / isNull / isUndefined', () => {
    expect(evaluate('isEmpty(a)', { a: '' })).toBe(true)
    expect(evaluate('isEmpty(a)', { a: null })).toBe(true)
    expect(evaluate('isEmpty(a)', {})).toBe(true)
    expect(evaluate('isEmpty(a)', { a: 'x' })).toBe(false)
    expect(evaluate('isNotEmpty(a)', { a: 'x' })).toBe(true)
    expect(evaluate('isNotEmpty(a)', { a: '' })).toBe(false)
    expect(evaluate('isNull(a)', { a: '' })).toBe(false)
    expect(evaluate('isNull(a)', { a: null })).toBe(true)
    expect(evaluate('isNull(a)', {})).toBe(true)
    expect(evaluate('isUndefined(a)', {})).toBe(true)
    expect(evaluate('isUndefined(a)', { a: null })).toBe(false)
  })

  it('type checks', () => {
    expect(evaluate('isBoolean(a)', { a: false })).toBe(true)
    expect(evaluate('isBoolean(a)', { a: 'false' })).toBe(false)
    expect(evaluate('isNumber(a)', { a: 3 })).toBe(true)
    expect(evaluate('isNumber(a)', { a: NaN })).toBe(false)
    expect(evaluate('isNumber(a)', { a: '3' })).toBe(false)
    expect(evaluate('isString(a)', { a: '3' })).toBe(true)
    expect(evaluate('isString(a)', { a: 3 })).toBe(false)
  })

  it('ifElse', () => {
    expect(evaluate('ifElse(a > 1, "big", "small")', { a: 2 })).toBe('big')
    expect(evaluate('ifElse(a > 1, "big", "small")', { a: 1 })).toBe('small')
  })

  it('length and get on strings and arrays', () => {
    expect(evaluate('length(a)', { a: 'abc' })).toBe(3)
    expect(evaluate('length(a)', { a: [1, 2] })).toBe(2)
    expect(evaluate('length(a)', { a: 42 })).toBe(0)
    expect(evaluate('get(a, 1)', { a: 'abc' })).toBe('b')
    expect(evaluate('get(a, 0)', { a: ['x', 'y'] })).toBe('x')
    expect(evaluate('get(a, 0)', { a: 42 })).toBeUndefined()
  })

  it('startsWith / endsWith', () => {
    expect(evaluate('startsWith(a, "ab")', { a: 'abc' })).toBe(true)
    expect(evaluate('startsWith(a, "b")', { a: 'abc' })).toBe(false)
    expect(evaluate('startsWith(a, "a")', { a: 1 })).toBe(false)
    expect(evaluate('endsWith(a, "bc")', { a: 'abc' })).toBe(true)
    expect(evaluate('endsWith(a, "a")', { a: 'abc' })).toBe(false)
    expect(evaluate('endsWith(a, 1)', { a: 'abc' })).toBe(false)
  })

  it('matches with a guarded regular expression', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(evaluate('matches(a, "^[a-z]+$")', { a: 'abc' })).toBe(true)
    expect(evaluate('matches(a, "^[a-z]+$")', { a: 'ABC' })).toBe(false)
    // an invalid pattern is reported and does not match
    expect(evaluate('matches(a, "[")', { a: 'abc' })).toBe(false)
    expect(error).toHaveBeenCalled()
    // patterns that are too long are rejected
    expect(evaluate('matches(a, p)', { a: 'abc', p: 'a'.repeat(101) })).toBe(false)
    expect(evaluate('matches(a, 3)', { a: 'abc' })).toBe(false)
  })

  it('inArray and contains', () => {
    expect(evaluate('inArray(a, "x", "y")', { a: 'y' })).toBe(true)
    expect(evaluate('inArray(a, "x", "y")', { a: 'z' })).toBe(false)
    expect(evaluate('contains(list, "b")', { list: ['a', 'b'] })).toBe(true)
    expect(evaluate('contains(list, "c")', { list: ['a', 'b'] })).toBe(false)
    expect(evaluate('contains(text, "ell")', { text: 'hello' })).toBe(true)
    expect(evaluate('contains(n, 1)', { n: 12 })).toBe(false)
  })

  it('wordCount and truthy', () => {
    expect(evaluate('wordCount(a)', { a: 'one  two three' })).toBe(3)
    expect(evaluate('wordCount(a)', {})).toBe(0)
    expect(evaluate('truthy(a)', { a: 'x' })).toBe(true)
    expect(evaluate('truthy(a)', { a: 0 })).toBe(false)
    expect(evaluate('truthy(a)', { a: [] })).toBe(true)
  })

  it('supports dot access on nested data, tolerating missing objects', () => {
    expect(evaluate('person.address.city == "Paris"', { person: { address: { city: 'Paris' } } })).toBe(true)
    expect(evaluate('isUndefined(person.address.city)', { person: {} })).toBe(true)
  })
})

describe('FiltrexRuleEngine API', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns false and logs when an expression cannot be compiled', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(evaluate('a ==', { a: 1 })).toBe(false)
    expect(error).toHaveBeenCalledWith('Error evaluating expression:', 'a ==', expect.anything())
  })

  it('validates expressions', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(filtrexEngine.validateExpression('a > 1 and isEmpty(b)')).toBe(true)
    expect(filtrexEngine.validateExpression('a >')).toBe(false)
    expect(error).toHaveBeenCalledWith('Invalid expression:', 'a >', expect.anything())
  })

  it('accepts custom functions on a dedicated engine', () => {
    const engine = new FiltrexRuleEngine()
    engine.addFunction('double', (value: number) => value * 2)
    expect(engine.evaluate('double(a)', { a: 4 })).toBe(8)
    // the singleton is not affected: filtrex reports the unknown function as an error value
    expect(filtrexEngine.evaluate('double(a)', { a: 4 })).toBeInstanceOf(Error)
  })
})

describe('useFiltrexRules', () => {
  it('evaluates against the current form data, reactively', () => {
    const data = ref<Record<string, unknown>>({ a: 1 })
    const { evaluateRule, evaluateRuleComputed, filtrexEngine: engine } = useFiltrexRules(data)
    expect(engine).toBe(filtrexEngine)
    expect(evaluateRule('a == 1')).toBe(true)
    const rule = evaluateRuleComputed('a * 2')
    expect(rule.value).toBe(2)
    data.value = { a: 5 }
    expect(rule.value).toBe(10)
  })
})

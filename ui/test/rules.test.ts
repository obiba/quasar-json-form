import { describe, it, expect, vi, afterEach } from 'vitest'
import { ref, reactive } from 'vue'
import { filters } from 'angular-expressions'
import { RuleEngine, ruleEngine, useRules } from '../src/composables/useRules'

const evaluate = (expression: string, context: Record<string, unknown> = {}) => ruleEngine.evaluate(expression, context)

describe('RuleEngine built-in functions', () => {
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
    expect(evaluate('person.address.city', {})).toBeUndefined()
  })

  it('functions win over data fields of the same name', () => {
    expect(evaluate('length(list)', { list: [1, 2, 3], length: 'a field' })).toBe(3)
  })
})

describe('RuleEngine expression language', () => {
  afterEach(() => vi.restoreAllMocks())

  it('evaluates JavaScript operators', () => {
    expect(evaluate('a + b * 2', { a: 1, b: 2 })).toBe(5)
    expect(evaluate('a % 2 == 0', { a: 4 })).toBe(true)
    expect(evaluate('-a', { a: 3 })).toBe(-3)
    expect(evaluate('a > 1 && b == "x"', { a: 2, b: 'x' })).toBe(true)
    expect(evaluate('a > 1 || b == "x"', { a: 0, b: 'x' })).toBe(true)
    expect(evaluate('!a', { a: false })).toBe(true)
    expect(evaluate('a > 1 ? "big" : "small"', { a: 2 })).toBe('big')
    expect(evaluate('a == null', {})).toBe(true)
    expect(evaluate('a === undefined', { a: null })).toBe(false)
    expect(evaluate('a == true', { a: true })).toBe(true)
    expect(evaluate('contains([1, 2], a)', { a: 2 })).toBe(true)
  })

  it('compares like JavaScript', () => {
    expect(evaluate('a == b', { a: '1', b: 1 })).toBe(true)
    expect(evaluate('a === b', { a: '1', b: 1 })).toBe(false)
    expect(evaluate('a >= 3', {})).toBe(false)
    expect(evaluate('a >= 3', { a: null })).toBe(false)
  })

  it('rejects assignments, this, $locals, filters and method calls', () => {
    expect(ruleEngine.expressionError('a = 1')).toMatch(/assignment/)
    expect(ruleEngine.expressionError('this')).toMatch(/this/)
    expect(ruleEngine.expressionError('$locals')).toMatch(/\$locals/)
    expect(ruleEngine.expressionError('a | json')).toMatch(/Filter 'json'/)
    filters.upper = (value: string) => value.toUpperCase()
    expect(ruleEngine.expressionError('a | upper')).toMatch(/filters are not allowed/)
    delete filters.upper
    expect(ruleEngine.expressionError('a.toString()')).toMatch(/only the rule functions/)
    // a data field is never assigned
    const data = { a: 1 }
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(evaluate('a = 2', data)).toBe(false)
    expect(data.a).toBe(1)
    expect(error).toHaveBeenCalled()
  })

  it('does not reach the prototype chain', () => {
    expect(evaluate('a.constructor', { a: 'x' })).toBeUndefined()
    expect(evaluate('a.__proto__', { a: {} })).toBeUndefined()
    expect(evaluate('constructor', {})).toBeUndefined()
  })

  it('reports the filtrex keywords as syntax errors', () => {
    expect(ruleEngine.expressionError('a > 1 and b')).toMatch(/'and'/)
    expect(ruleEngine.expressionError('not a')).toMatch(/'a'/)
    expect(ruleEngine.expressionError('"x" in a')).toMatch(/'in'/)
  })
})

describe('RuleEngine API', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns false and logs when an expression cannot be compiled', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(evaluate('a ==', { a: 1 })).toBe(false)
    expect(error).toHaveBeenCalledWith('Error evaluating expression:', 'a ==', expect.anything())
  })

  it('validates expressions', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(ruleEngine.validateExpression('a > 1 && isEmpty(b)')).toBe(true)
    expect(ruleEngine.validateExpression('a >')).toBe(false)
    expect(error).toHaveBeenCalledWith('Invalid expression:', 'a >', expect.anything())
  })

  it('reports unknown functions at compile time', () => {
    expect(ruleEngine.expressionError('nope(a)')).toBe("unknown function 'nope'")
    expect(ruleEngine.expressionError('')).toBeUndefined()
    expect(ruleEngine.expressionError('length(a) > nope(a)')).toBe("unknown function 'nope'")
  })

  it('accepts custom functions on a dedicated engine', () => {
    const engine = new RuleEngine()
    engine.addFunction('double', (value: number) => value * 2)
    expect(engine.evaluate('double(a)', { a: 4 })).toBe(8)
    // the singleton is not affected
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(ruleEngine.evaluate('double(a)', { a: 4 })).toBe(false)
    expect(error).toHaveBeenCalled()
    // a function added later is known to the already compiled expressions
    expect(engine.expressionError('triple(a)')).toBe("unknown function 'triple'")
    engine.addFunction('triple', (value: number) => value * 3)
    expect(engine.evaluate('triple(a)', { a: 4 })).toBe(12)
  })
})

describe('useRules', () => {
  it('evaluates against the current form data, reactively', () => {
    const data = ref<Record<string, unknown>>({ a: 1 })
    const { evaluateRule, evaluateRuleComputed, ruleEngine: engine } = useRules(data)
    expect(engine).toBe(ruleEngine)
    expect(evaluateRule('a == 1')).toBe(true)
    const rule = evaluateRuleComputed('a * 2')
    expect(rule.value).toBe(2)
    data.value = { a: 5 }
    expect(rule.value).toBe(10)
  })

  it('reads reactive form data', () => {
    const data = ref(reactive({ person: { name: 'x' }, list: ['a'] }))
    const { evaluateRule } = useRules(data)
    expect(evaluateRule('person.name == "x" && length(list) == 1')).toBe(true)
  })
})

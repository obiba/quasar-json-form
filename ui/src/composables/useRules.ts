/* eslint-disable @typescript-eslint/no-explicit-any */
import { compile } from 'angular-expressions'
import { computed } from 'vue'
import { countWords } from '../utils/words'

type Evaluator = ReturnType<typeof compile>

/**
 * Rules are angular-expressions (a JavaScript expression subset) evaluated
 * with the form data as scope and the engine functions as locals: `a.b.c`
 * paths (undefined when a segment is missing), literals, arithmetic, `==` /
 * `===` / `!=` / `!==` and ordering comparisons, `&&`, `||`, `!`, `? :`.
 *
 * The interpreter is used (`csp`: no `new Function`), and the syntax tree is
 * checked so that an expression can neither assign into the form data nor
 * call anything but the registered functions.
 */
// `csp` is read by compile() but missing from its option typings
const COMPILE_OPTIONS: NonNullable<Parameters<typeof compile>[1]> & { csp: boolean } = { csp: true }

/** Names of the syntax tree nodes that a rule may not use. */
const FORBIDDEN_SYNTAX: Record<string, string> = {
  AssignmentExpression: 'assignment is not allowed',
  ThisExpression: "'this' is not allowed",
  LocalsExpression: "'$locals' is not allowed",
  FilterExpression: 'filters are not allowed',
}

export class RuleEngine {
  customFunctions: Record<string, (...args: any[]) => any>

  /** Compiled and checked expressions, reset when a function is added (or when too many). */
  private compiled = new Map<string, Evaluator>()

  constructor() {
    this.customFunctions = {}

    // Add useful custom functions
    this.addFunction('isEmpty', (value: any) => {
      return value === null || value === undefined || value === ''
    })

    this.addFunction('isNotEmpty', (value: any) => {
      return value !== null && value !== undefined && value !== ''
    })

    // isNull(value): null or undefined (unlike isEmpty, an empty string is not null)
    this.addFunction('isNull', (value: any) => {
      return value === null || value === undefined
    })

    this.addFunction('isUndefined', (value: any) => {
      return value === undefined
    })

    this.addFunction('isBoolean', (value: any) => {
      return typeof value === 'boolean'
    })

    this.addFunction('ifElse', (condition: boolean, trueVal: any, falseVal: any) => {
      return condition ? trueVal : falseVal
    })

    this.addFunction('isNumber', (value: any) => {
      return typeof value === 'number' && !isNaN(value)
    })

    this.addFunction('isString', (value: any) => {
      return typeof value === 'string'
    })

    this.addFunction('length', (value: any) => {
      if (typeof value === 'string' || Array.isArray(value)) {
        return value.length
      }
      return 0
    })

    this.addFunction('get', (value: any, idx: number) => {
      if (typeof value === 'string' || Array.isArray(value)) {
        return value[idx]
      }
      return undefined
    })

    this.addFunction('startsWith', (value: any, prefix: string) => {
      if (typeof value !== 'string' || typeof prefix !== 'string') {
        return false
      }
      return value.startsWith(prefix)
    })

    this.addFunction('endsWith', (value: any, suffix: string) => {
      if (typeof value !== 'string' || typeof suffix !== 'string') {
        return false
      }
      return value.endsWith(suffix)
    })

    this.addFunction('matches', (value: any, pattern: string) => {
      // Limit pattern length to mitigate ReDoS risk
      if (typeof pattern !== 'string' || pattern.length > 100) {
        return false
      }
      try {
        return new RegExp(pattern).test(value)
      } catch (error) {
        console.error('Error evaluating regex pattern:', pattern, error)
        // Invalid regex pattern
        return false
      }
    })

    this.addFunction('inArray', (value: any, ...items: any[]) => {
      return items.includes(value)
    })

    // contains(list, value): true when an array (or a string) contains the value
    this.addFunction('contains', (container: any, value: any) => {
      if (Array.isArray(container) || typeof container === 'string') {
        return container.includes(value)
      }
      return false
    })

    // number of whitespace-separated words in a string
    this.addFunction('wordCount', (value: any) => countWords(value))

    // truthy(value): JavaScript truthiness
    this.addFunction('truthy', (value: any) => !!value)
  }

  addFunction(name: string, fn: (...args: any[]) => any): void {
    this.customFunctions[name] = fn
    this.compiled.clear()
  }

  /** Compiles an expression and checks its syntax tree, throwing an Error when it is not a valid rule. */
  private compile(expression: string): Evaluator {
    let evaluator = this.compiled.get(expression)
    if (!evaluator) {
      evaluator = compile(expression, COMPILE_OPTIONS)
      this.check(evaluator.ast)
      if (this.compiled.size >= 1000) this.compiled.clear()
      this.compiled.set(expression, evaluator)
    }
    return evaluator
  }

  private check(node: any): void {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach((child) => this.check(child))
      return
    }
    const forbidden = FORBIDDEN_SYNTAX[node.type]
    if (forbidden) throw new Error(forbidden)
    if (node.type === 'CallExpression') {
      const callee = node.callee
      if (callee?.type !== 'Identifier') throw new Error('only the rule functions can be called')
      if (!Object.prototype.hasOwnProperty.call(this.customFunctions, callee.name)) {
        throw new Error(`unknown function '${callee.name}'`)
      }
    }
    Object.values(node).forEach((child) => this.check(child))
  }

  evaluate(expression: string, context: Record<string, any>): any {
    try {
      return this.compile(expression)(context, this.customFunctions)
    } catch (error) {
      console.error('Error evaluating expression:', expression, error)
      return false
    }
  }

  /** The error of an expression that does not compile, undefined when it does (or is empty). */
  expressionError(expression: string): string | undefined {
    if (!expression.trim()) return undefined
    try {
      this.compile(expression)
      return undefined
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    }
  }

  validateExpression(expression: string): boolean {
    try {
      this.compile(expression)
      return true
    } catch (error) {
      console.error('Invalid expression:', expression, error)
      return false
    }
  }
}

// Singleton instance
export const ruleEngine = new RuleEngine()

// Composable for reactive rule evaluation
export function useRules(formData: any) {
  const evaluateRule = (expression: string): any => {
    const val = formData.value
    return ruleEngine.evaluate(expression, val)
  }

  const evaluateRuleComputed = (expression: string) => {
    return computed(() => evaluateRule(expression))
  }

  return {
    evaluateRule,
    evaluateRuleComputed,
    ruleEngine,
  }
}

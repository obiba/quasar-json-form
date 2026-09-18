/**
 * Transpiles the JavaScript `condition` expressions of angular-schema-form
 * (ASF) form definitions into the rules understood by the renderers
 * (`rules.visible`).
 *
 * Only the subset of JavaScript actually found in form definitions is
 * accepted, anything else throws a `ConditionError`:
 *
 * - `model.a.b` paths (the `model.` prefix is dropped), literals (numbers,
 *   single or double quoted strings, `true`, `false`, `null`, `undefined`);
 * - `!`, `&&`, `||`, parentheses;
 * - `==`, `===`, `!=`, `!==`, `<`, `<=`, `>`, `>=`;
 * - `model.list.indexOf(v) >= 0` / `> -1` / `!= -1` (and the negative forms)
 *   and `model.list.includes(v)`, mapped to the `contains(list, v)` function;
 * - `model.list.length`, mapped to `length(list)`.
 *
 * Rules are a JavaScript expression subset themselves, so the operators and
 * literals are kept as they are. A rule must evaluate to a boolean, which
 * `&&` and `||` do not guarantee in JavaScript: a value used as a boolean
 * (`model.a`, `model.a && ...`) is coerced with `!!`.
 */

export class ConditionError extends Error {
  constructor(message: string, public readonly condition: string) {
    super(message)
    this.name = 'ConditionError'
  }
}

type TokenType = 'punct' | 'op' | 'string' | 'number' | 'ident' | 'end'

interface Token {
  type: TokenType
  value: string
  pos: number
}

type Node =
  | { kind: 'or' | 'and'; left: Node; right: Node }
  | { kind: 'not'; operand: Node }
  | { kind: 'cmp'; op: string; left: Node; right: Node }
  | { kind: 'path'; segments: string[] }
  | { kind: 'string'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'bool'; value: boolean }
  | { kind: 'nullish'; value: null | undefined }
  | { kind: 'indexOf'; path: Node; arg: Node }
  | { kind: 'contains'; path: Node; arg: Node }
  | { kind: 'length'; path: Node }

const OPERATORS = ['===', '!==', '==', '!=', '<=', '>=', '&&', '||', '<', '>', '!', '-', '+']
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*/
const NUMBER = /^\d+(\.\d+)?/

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let pos = 0
  while (pos < source.length) {
    const char = source[pos]!
    if (/\s/.test(char)) {
      pos++
      continue
    }
    if ('().,[]'.includes(char)) {
      tokens.push({ type: 'punct', value: char, pos })
      pos++
      continue
    }
    if (char === '"' || char === "'") {
      let end = pos + 1
      let value = ''
      while (end < source.length && source[end] !== char) {
        if (source[end] === '\\' && end + 1 < source.length) {
          end++
        }
        value += source[end]
        end++
      }
      if (end >= source.length) throw new ConditionError(`unterminated string at ${pos}`, source)
      tokens.push({ type: 'string', value, pos })
      pos = end + 1
      continue
    }
    const operator = OPERATORS.find((op) => source.startsWith(op, pos))
    if (operator) {
      tokens.push({ type: 'op', value: operator, pos })
      pos += operator.length
      continue
    }
    const number = NUMBER.exec(source.slice(pos))
    if (number) {
      tokens.push({ type: 'number', value: number[0], pos })
      pos += number[0].length
      continue
    }
    const ident = IDENT.exec(source.slice(pos))
    if (ident) {
      tokens.push({ type: 'ident', value: ident[0], pos })
      pos += ident[0].length
      continue
    }
    throw new ConditionError(`unexpected character '${char}' at ${pos}`, source)
  }
  tokens.push({ type: 'end', value: '', pos })
  return tokens
}

class Parser {
  private index = 0

  constructor(private readonly tokens: Token[], private readonly source: string) {}

  parse(): Node {
    const node = this.parseOr()
    if (this.peek().type !== 'end') {
      throw this.error(`unexpected '${this.peek().value}'`)
    }
    return node
  }

  private peek(): Token {
    return this.tokens[this.index]!
  }

  private next(): Token {
    return this.tokens[this.index++]!
  }

  private accept(type: TokenType, value?: string): Token | undefined {
    const token = this.peek()
    if (token.type === type && (value === undefined || token.value === value)) {
      this.index++
      return token
    }
    return undefined
  }

  private expect(type: TokenType, value?: string): Token {
    const token = this.accept(type, value)
    if (!token) throw this.error(`expected '${value ?? type}' but found '${this.peek().value || 'end of expression'}'`)
    return token
  }

  private error(message: string): ConditionError {
    return new ConditionError(`${message} at ${this.peek().pos}`, this.source)
  }

  private parseOr(): Node {
    let left = this.parseAnd()
    while (this.accept('op', '||')) {
      left = { kind: 'or', left, right: this.parseAnd() }
    }
    return left
  }

  private parseAnd(): Node {
    let left = this.parseComparison()
    while (this.accept('op', '&&')) {
      left = { kind: 'and', left, right: this.parseComparison() }
    }
    return left
  }

  private parseComparison(): Node {
    const left = this.parseUnary()
    const token = this.peek()
    if (token.type === 'op' && ['===', '!==', '==', '!=', '<=', '>=', '<', '>'].includes(token.value)) {
      this.next()
      const right = this.parseUnary()
      return { kind: 'cmp', op: token.value, left, right }
    }
    return left
  }

  private parseUnary(): Node {
    // `!` binds tighter than the comparisons, as in JavaScript
    if (this.accept('op', '!')) {
      return { kind: 'not', operand: this.parseUnary() }
    }
    if (this.accept('op', '-')) {
      const token = this.expect('number')
      return { kind: 'number', value: -Number(token.value) }
    }
    if (this.accept('op', '+')) {
      const token = this.expect('number')
      return { kind: 'number', value: Number(token.value) }
    }
    return this.parsePrimary()
  }

  private parsePrimary(): Node {
    const token = this.next()
    switch (token.type) {
      case 'punct':
        if (token.value === '(') {
          const node = this.parseOr()
          this.expect('punct', ')')
          return node
        }
        break
      case 'string':
        return { kind: 'string', value: token.value }
      case 'number':
        return { kind: 'number', value: Number(token.value) }
      case 'ident':
        return this.parseIdentifier(token)
      default:
        break
    }
    this.index--
    throw this.error(`unexpected '${token.value || 'end of expression'}'`)
  }

  private parseIdentifier(token: Token): Node {
    switch (token.value) {
      case 'true':
        return { kind: 'bool', value: true }
      case 'false':
        return { kind: 'bool', value: false }
      case 'null':
        return { kind: 'nullish', value: null }
      case 'undefined':
        return { kind: 'nullish', value: undefined }
      default:
        break
    }
    if (token.value !== 'model') {
      throw new ConditionError(`unsupported identifier '${token.value}' at ${token.pos} (only 'model' paths are supported)`, this.source)
    }
    const segments: string[] = []
    while (this.accept('punct', '.')) {
      const segment = this.expect('ident')
      if (segment.value === 'indexOf' || segment.value === 'includes') {
        this.expect('punct', '(')
        const arg = this.parseUnary()
        this.expect('punct', ')')
        const path = this.pathNode(segments, segment)
        return segment.value === 'indexOf' ? { kind: 'indexOf', path, arg } : { kind: 'contains', path, arg }
      }
      if (segment.value === 'length' && this.peek().value !== '.') {
        return { kind: 'length', path: this.pathNode(segments, segment) }
      }
      segments.push(segment.value)
    }
    if (this.peek().type === 'punct' && this.peek().value === '[') {
      throw this.error('computed member access is not supported')
    }
    if (segments.length === 0) {
      throw this.error("'model' alone is not a supported expression")
    }
    return { kind: 'path', segments }
  }

  private pathNode(segments: string[], at: Token): Node {
    if (segments.length === 0) {
      throw new ConditionError(`'${at.value}' needs a model property at ${at.pos}`, this.source)
    }
    return { kind: 'path', segments }
  }
}

/** A node as a value: a primary expression, or a parenthesized boolean expression. */
function emitValue(node: Node, source: string): string {
  switch (node.kind) {
    case 'path':
      return node.segments.join('.')
    case 'string':
      return JSON.stringify(node.value)
    case 'number':
      return String(node.value)
    case 'bool':
      return String(node.value)
    case 'nullish':
      return node.value === null ? 'null' : 'undefined'
    case 'length':
      return `length(${emitValue(node.path, source)})`
    case 'contains':
      return `contains(${emitValue(node.path, source)}, ${emitValue(node.arg, source)})`
    case 'indexOf':
      throw new ConditionError('indexOf() must be compared with 0 or -1', source)
    default:
      return `(${emitBool(node, source)})`
  }
}

function emitComparison(node: Extract<Node, { kind: 'cmp' }>, source: string): string {
  const { left, right } = node
  const op = node.op === '===' ? '==' : node.op === '!==' ? '!=' : node.op

  // list.indexOf(v) >= 0, > -1, != -1 (and < 0, <= -1, == -1 for the negation)
  if (left.kind === 'indexOf' && right.kind === 'number') {
    const contains = emitValue({ kind: 'contains', path: left.path, arg: left.arg }, source)
    const positive =
      (op === '>=' && right.value === 0) || (op === '>' && right.value === -1) || (op === '!=' && right.value === -1)
    const negative =
      (op === '<' && right.value === 0) || (op === '<=' && right.value === -1) || (op === '==' && right.value === -1)
    if (positive) return contains
    if (negative) return `!${contains}`
    throw new ConditionError(`unsupported indexOf() comparison '${node.op} ${right.value}'`, source)
  }
  if (right.kind === 'indexOf') {
    // 0 <= list.indexOf(v): swap the operands
    const swapped: Record<string, string> = { '<': '>', '<=': '>=', '>': '<', '>=': '<=' }
    return emitComparison({ kind: 'cmp', op: swapped[node.op] ?? node.op, left: right, right: left }, source)
  }

  return `${emitValue(left, source)} ${node.op} ${emitValue(right, source)}`
}

/** A node as a boolean expression. */
function emitBool(node: Node, source: string): string {
  switch (node.kind) {
    case 'or':
      return `${emitBool(node.left, source)} || ${emitBool(node.right, source)}`
    case 'and': {
      const left = node.left.kind === 'or' ? `(${emitBool(node.left, source)})` : emitBool(node.left, source)
      const right = node.right.kind === 'or' ? `(${emitBool(node.right, source)})` : emitBool(node.right, source)
      return `${left} && ${right}`
    }
    case 'not':
      // `!` yields a boolean whatever the operand
      return `!${node.operand.kind === 'not' ? emitBool(node.operand, source) : emitValue(node.operand, source)}`
    case 'cmp':
      return emitComparison(node, source)
    case 'contains':
      return emitValue(node, source)
    case 'indexOf':
      throw new ConditionError('indexOf() must be compared with 0 or -1', source)
    case 'bool':
      return String(node.value)
    case 'nullish':
      return 'false'
    default:
      return `!!${emitValue(node, source)}`
  }
}

/**
 * Transpiles an ASF `condition` (JavaScript) into a rule expression.
 * Throws a `ConditionError` when the expression is not supported.
 */
export function transpileCondition(condition: string): string {
  const source = String(condition ?? '').trim()
  if (source.length === 0) throw new ConditionError('empty condition', source)
  const ast = new Parser(tokenize(source), source).parse()
  return emitBool(ast, source)
}

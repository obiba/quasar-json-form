/**
 * Transpiles the JavaScript `condition` expressions of angular-schema-form
 * (ASF) form definitions into filtrex rules understood by the renderers
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
 * JavaScript truthiness is preserved with the `truthy(value)` function where a
 * value is used as a boolean (`!model.b`, `model.a && ...`), and comparisons
 * with `null` / `undefined` become `isEmpty` / `isNotEmpty`, since filtrex has
 * neither boolean nor null literals and rejects `not undefined`.
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
  | { kind: 'nullish' }
  | { kind: 'indexOf'; path: Node; arg: Node }
  | { kind: 'contains'; path: Node; arg: Node }
  | { kind: 'length'; path: Node }

/** filtrex has no boolean literals: constant results are expressed as comparisons */
const TRUE = '1 == 1'
const FALSE = '1 == 0'

const OPERATORS = ['===', '!==', '==', '!=', '<=', '>=', '&&', '||', '<', '>', '!', '-', '+']
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*/
const NUMBER = /^\d+(\.\d+)?/
/** filtrex identifiers: no `$`, no leading digit */
const FILTREX_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/

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
    let left = this.parseNot()
    while (this.accept('op', '&&')) {
      left = { kind: 'and', left, right: this.parseNot() }
    }
    return left
  }

  private parseNot(): Node {
    if (this.accept('op', '!')) {
      return { kind: 'not', operand: this.parseNot() }
    }
    return this.parseComparison()
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
      case 'undefined':
        return { kind: 'nullish' }
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

function emitValue(node: Node, source: string): string {
  switch (node.kind) {
    case 'path':
      node.segments.forEach((segment) => {
        if (!FILTREX_IDENT.test(segment)) {
          throw new ConditionError(`property name '${segment}' cannot be used in a filtrex rule`, source)
        }
      })
      return node.segments.join('.')
    case 'string':
      return JSON.stringify(node.value)
    case 'number':
      return String(node.value)
    case 'length':
      return `length(${emitValue(node.path, source)})`
    case 'bool':
    case 'nullish':
      throw new ConditionError(`'${node.kind === 'bool' ? node.value : 'null'}' can only be compared with == or !=`, source)
    case 'indexOf':
      throw new ConditionError('indexOf() must be compared with 0 or -1', source)
    default:
      return `(${emitBool(node, source)})`
  }
}

function isRelational(op: string): boolean {
  return op === '<' || op === '<=' || op === '>' || op === '>='
}

function emitComparison(node: Extract<Node, { kind: 'cmp' }>, source: string): string {
  const { left, right } = node
  const op = node.op === '===' ? '==' : node.op === '!==' ? '!=' : node.op
  const negated = op === '!='

  // list.indexOf(v) >= 0, > -1, != -1 (and < 0, == -1 for the negation)
  if (left.kind === 'indexOf' && right.kind === 'number') {
    const contains = `contains(${emitValue(left.path, source)}, ${emitValue(left.arg, source)})`
    const positive =
      (op === '>=' && right.value === 0) || (op === '>' && right.value === -1) || (op === '!=' && right.value === -1)
    const negative =
      (op === '<' && right.value === 0) || (op === '<=' && right.value === -1) || (op === '==' && right.value === -1)
    if (positive) return contains
    if (negative) return `not (${contains})`
    throw new ConditionError(`unsupported indexOf() comparison '${node.op} ${right.value}'`, source)
  }
  if (right.kind === 'indexOf') {
    // 0 <= list.indexOf(v): swap the operands
    const swapped: Record<string, string> = { '<': '>', '<=': '>=', '>': '<', '>=': '<=', '==': '==', '!=': '!=' }
    return emitComparison({ kind: 'cmp', op: swapped[op]!, left: right, right: left }, source)
  }

  if (op !== '==' && op !== '!=' && !isRelational(op)) {
    throw new ConditionError(`unsupported operator '${node.op}'`, source)
  }

  // x == null / undefined
  if (right.kind === 'nullish' || left.kind === 'nullish') {
    const other = right.kind === 'nullish' ? left : right
    if (other.kind === 'nullish') return negated ? FALSE : TRUE
    return `${negated ? 'isNotEmpty' : 'isEmpty'}(${emitValue(other, source)})`
  }

  // x == true / false: JavaScript truthiness
  if (right.kind === 'bool' || left.kind === 'bool') {
    const other = right.kind === 'bool' ? left : right
    const expected = (right.kind === 'bool' ? right : (left as Extract<Node, { kind: 'bool' }>)).value
    if (other.kind === 'bool') return (other.value === expected) !== negated ? TRUE : FALSE
    const truthy = `truthy(${emitValue(other, source)})`
    return expected !== negated ? truthy : `not (${truthy})`
  }

  if (isRelational(op)) {
    // filtrex rejects ordering comparisons on undefined values, JavaScript evaluates them to false
    const guards = [left, right]
      .filter((operand) => operand.kind === 'path')
      .map((operand) => `isNotEmpty(${emitValue(operand, source)})`)
    const comparison = `${emitValue(left, source)} ${op} ${emitValue(right, source)}`
    return guards.length > 0 ? `(${[...guards, comparison].join(' and ')})` : comparison
  }

  return `${emitValue(left, source)} ${op} ${emitValue(right, source)}`
}

function emitBool(node: Node, source: string): string {
  switch (node.kind) {
    case 'or':
      return `${emitBool(node.left, source)} or ${emitBool(node.right, source)}`
    case 'and': {
      const left = node.left.kind === 'or' ? `(${emitBool(node.left, source)})` : emitBool(node.left, source)
      const right = node.right.kind === 'or' ? `(${emitBool(node.right, source)})` : emitBool(node.right, source)
      return `${left} and ${right}`
    }
    case 'not':
      return `not (${emitBool(node.operand, source)})`
    case 'cmp':
      return emitComparison(node, source)
    case 'contains':
      return `contains(${emitValue(node.path, source)}, ${emitValue(node.arg, source)})`
    case 'indexOf':
      throw new ConditionError('indexOf() must be compared with 0 or -1', source)
    case 'bool':
      return node.value ? TRUE : FALSE
    case 'nullish':
      return FALSE
    default:
      return `truthy(${emitValue(node, source)})`
  }
}

/**
 * Transpiles an ASF `condition` (JavaScript) into a filtrex expression.
 * Throws a `ConditionError` when the expression is not supported.
 */
export function transpileCondition(condition: string): string {
  const source = String(condition ?? '').trim()
  if (source.length === 0) throw new ConditionError('empty condition', source)
  const ast = new Parser(tokenize(source), source).parse()
  return emitBool(ast, source)
}

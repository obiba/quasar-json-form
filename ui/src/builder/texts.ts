/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The texts of a form: titles, descriptions, labels, hints, option labels
 * and messages. In the builder every text is a translation key, generated
 * from the position of the node (`name.title`, `address.street.hint`,
 * `contacts.items.email.title`, `group.1.label`...), and its values live in
 * the translations of the form, one per language.
 */
import type { FormModel, FormNode, JsonObject } from './model'
import { locations, locate, containerOf, propertyIn } from './model'

/** Where a text of a node is stored. */
export interface TextSlot {
  /** identifier of the text: `title`, `description`, `label`, `hint`, `text`, `labels.<i>`, `options.<value>`, `validation.<i>` */
  name: string
  /** the schema of the property, or the UI schema element */
  target: 'schema' | 'element'
  /** path of the text in the target object */
  path: (string | number)[]
}

const TEXT_KEY = /^[A-Za-z_$][\w$-]*(\.[\w$-]+)+$/

const isObject = (value: unknown): value is JsonObject => typeof value === 'object' && value !== null && !Array.isArray(value)

function get(target: JsonObject | undefined, path: (string | number)[]): unknown {
  return path.reduce<any>((current, segment) => (current === undefined || current === null ? undefined : current[segment]), target)
}

function set(target: JsonObject, path: (string | number)[], value: unknown): void {
  let current: any = target
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]!
    if (!isObject(current[segment]) && !Array.isArray(current[segment])) current[segment] = typeof path[i + 1] === 'number' ? [] : {}
    current = current[segment]
  }
  current[path[path.length - 1]!] = value
}

/** The schema of the property of a control node, or undefined. */
function schemaOf(model: FormModel, node: FormNode): JsonObject | undefined {
  if (!node.path) return undefined
  return propertyIn(containerOf(model, locate(model, node.id)?.list), node.path)
}

/** The texts a node can carry, given its kind, its element type and its schema. */
export function textSlots(model: FormModel, node: FormNode): TextSlot[] {
  const slots: TextSlot[] = []
  const element = node.element
  const type = String(element.type ?? '')
  if (node.kind === 'control') {
    const schema = schemaOf(model, node)
    slots.push({ name: 'title', target: 'schema', path: ['title'] }, { name: 'description', target: 'schema', path: ['description'] })
    if (element.label !== false) slots.push({ name: 'label', target: 'element', path: ['label'] })
    slots.push({ name: 'hint', target: 'element', path: ['hint'] })
    const oneOf: unknown = schema?.oneOf ?? (isObject(schema?.items) ? schema!.items.oneOf : undefined)
    const inItems = !schema?.oneOf && isObject(schema?.items)
    if (Array.isArray(oneOf)) {
      oneOf.forEach((entry: any, i: number) => {
        if (isObject(entry) && entry.const !== undefined) {
          slots.push({ name: `options.${entry.const}`, target: 'schema', path: inItems ? ['items', 'oneOf', i, 'title'] : ['oneOf', i, 'title'] })
        }
      })
    }
  } else if (type === 'Label') {
    slots.push({ name: 'text', target: 'element', path: ['text'] })
  } else if (type === 'Section') {
    slots.push({ name: 'label', target: 'element', path: ['label'] }, { name: 'description', target: 'element', path: ['description'] })
  } else if (type === 'TabsLayout' || type === 'StepperLayout') {
    node.children.forEach((_child, i) => slots.push({ name: `labels.${i}`, target: 'element', path: ['labels', i] }))
  } else if (type === 'Group' || type === 'Category' || 'label' in element) {
    slots.push({ name: 'label', target: 'element', path: ['label'] })
  }
  const validation = isObject(element.rules) ? element.rules.validation : undefined
  if (Array.isArray(validation)) {
    validation.forEach((_rule: unknown, i: number) => slots.push({ name: `validation.${i}`, target: 'element', path: ['rules', 'validation', i, 'message'] }))
  }
  return slots
}

/** The raw value stored in a slot: a translation key, a literal, or undefined. */
export function rawText(model: FormModel, node: FormNode, slot: TextSlot): string | undefined {
  const target = slot.target === 'schema' ? schemaOf(model, node) : node.element
  const value = get(target, slot.path)
  return typeof value === 'string' ? value : undefined
}

/** true when the key is defined in at least one language of the form */
export function isKnownKey(model: FormModel, key: string): boolean {
  return Object.values(model.translations).some((messages) => key in messages)
}

/**
 * The text of a slot in a language: its translation, or the literal stored
 * in the slot when it is not a key of the form; undefined when the slot is
 * empty or its key is not translated in that language.
 */
export function getText(model: FormModel, node: FormNode, slot: TextSlot, locale: string): string | undefined {
  const raw = rawText(model, node, slot)
  if (raw === undefined) return undefined
  const translated = model.translations[locale]?.[raw]
  if (translated !== undefined) return translated
  return isKnownKey(model, raw) ? undefined : raw
}

/** The dotted prefix of the keys of a control: its path, under the `items` of its lists. */
function controlPrefix(model: FormModel, node: FormNode): string {
  const list = locate(model, node.id)?.list
  const own = (node.path ?? [node.id]).join('.')
  return list ? `${controlPrefix(model, list)}.items.${own}` : own
}

/** The prefix of the keys of a node: the one of its existing keys, else a new one (`group.1`...). */
export function keyPrefix(model: FormModel, node: FormNode): string {
  if (node.kind === 'control') return controlPrefix(model, node)
  for (const slot of textSlots(model, node)) {
    const raw = rawText(model, node, slot)
    if (raw !== undefined && TEXT_KEY.test(raw) && raw.endsWith(`.${slot.name}`)) return raw.slice(0, -slot.name.length - 1)
  }
  const stem = String(node.element.type ?? 'element').replace(/Layout$/, '').replace(/[A-Z]/g, (c, i) => (i ? '-' : '') + c.toLowerCase())
  const used = new Set(usedPrefixes(model))
  let n = 1
  while (used.has(`${stem}.${n}`)) n++
  return `${stem}.${n}`
}

/** The key of a slot: the one stored, when it is a key of the form, else the generated one. */
export function textKey(model: FormModel, node: FormNode, slot: TextSlot): string {
  const raw = rawText(model, node, slot)
  if (raw !== undefined && isKnownKey(model, raw)) return raw
  return `${keyPrefix(model, node)}.${slot.name}`
}

/**
 * Sets the text of a slot in a language: the slot holds the key (generated
 * when it holds nothing or a literal) and the translations hold the text. An
 * empty text removes the translation, the key stays.
 */
export function setText(model: FormModel, node: FormNode, slot: TextSlot, locale: string, text: string): string {
  const key = textKey(model, node, slot)
  const target = slot.target === 'schema' ? schemaOf(model, node) : node.element
  if (!target) return key
  set(target, slot.path, key)
  const messages = (model.translations[locale] ??= {})
  if (text === '') delete messages[key]
  else messages[key] = text
  return key
}

/** The key prefixes of every node of the tree. */
function usedPrefixes(model: FormModel): string[] {
  const prefixes: string[] = []
  for (const { node } of locations(model)) {
    if (node.kind === 'control') prefixes.push(controlPrefix(model, node))
    else {
      for (const slot of textSlots(model, node)) {
        const raw = rawText(model, node, slot)
        if (raw !== undefined && TEXT_KEY.test(raw) && raw.endsWith(`.${slot.name}`)) prefixes.push(raw.slice(0, -slot.name.length - 1))
      }
    }
  }
  return prefixes
}

/** The keys held by the slots of the tree, when they are keys of the form. */
export function usedKeys(model: FormModel): string[] {
  const keys = new Set<string>()
  for (const { node } of locations(model)) {
    for (const slot of textSlots(model, node)) {
      const raw = rawText(model, node, slot)
      if (raw !== undefined && isKnownKey(model, raw)) keys.add(raw)
    }
  }
  return [...keys]
}

/** The keys of the form (every language) not translated in a language. */
export function missingTranslations(model: FormModel, locale: string): string[] {
  const all = new Set<string>()
  Object.values(model.translations).forEach((messages) => Object.keys(messages).forEach((key) => all.add(key)))
  const messages = model.translations[locale] ?? {}
  return [...all].filter((key) => !(key in messages)).sort()
}

/**
 * Removes the translations no node uses: a key is kept when a slot holds it,
 * or when it is under the prefix of a node (`name.error.required` for the
 * `name` control, read by the renderers). Returns the removed keys.
 */
export function pruneTranslations(model: FormModel): string[] {
  const used = new Set(usedKeys(model))
  const prefixes = usedPrefixes(model).map((prefix) => `${prefix}.`)
  const removed = new Set<string>()
  for (const messages of Object.values(model.translations)) {
    for (const key of Object.keys(messages)) {
      if (used.has(key) || prefixes.some((prefix) => key.startsWith(prefix))) continue
      delete messages[key]
      removed.add(key)
    }
  }
  return [...removed].sort()
}

/**
 * Moves the translations under a prefix to another (`name.*` to
 * `fullName.*`, a renamed control) and updates the keys held by the slots of
 * the given nodes. With `copy`, the translations are copied instead (a
 * duplicated control).
 */
export function retargetKeys(model: FormModel, nodes: FormNode[], oldPrefix: string, newPrefix: string, copy = false): void {
  if (oldPrefix === newPrefix) return
  const rename = (key: string) => (key === oldPrefix || key.startsWith(`${oldPrefix}.`) ? newPrefix + key.slice(oldPrefix.length) : key)
  // the keys held by the slots, resolved before the translations change
  const held: { target: JsonObject; path: (string | number)[]; key: string }[] = []
  for (const node of nodes) {
    for (const slot of textSlots(model, node)) {
      const raw = rawText(model, node, slot)
      const target = slot.target === 'schema' ? schemaOf(model, node) : node.element
      if (raw !== undefined && target && isKnownKey(model, raw)) held.push({ target, path: slot.path, key: raw })
    }
  }
  for (const messages of Object.values(model.translations)) {
    for (const key of Object.keys(messages)) {
      const next = rename(key)
      if (next === key) continue
      messages[next] = messages[key]!
      if (!copy) delete messages[key]
    }
  }
  for (const { target, path, key } of held) set(target, path, rename(key))
}

//src/components/holo-bind.ts

/*
    Neural Line
    Reactive carousel - bindings
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import {keysOf} from './holo-essentials'
import {cyre, log} from 'cyre'
import {holoStore} from '../core/state'
import {BindingRecord, CyreNode} from '../types/interface'
import {reconcile} from './holo-render'

/*
  Bindings: any element follows a Cyre channel, not just carousels.

  The value lives in Cyre - a channel's payload is the state - so
  anything that calls the channel (a fetch handler, another component,
  a server push through cyre/cloud) updates every element bound to it.
  Ids are relative to the Holo instance's branch ('cart' → holo/cart);
  a leading '/' means a path from the root ('/api/projects').

    const cart = holo.state('cart', [])
    holo.bind('#count', 'cart', items => items.length)
    holo.list('#lines', 'cart', {key: item => item.id, render: (item, i, el) => ...})
    holo.bindInput('#search', 'query')
    cart.update(items => [...items, product])
*/

export interface StateHandle<T> {
  readonly id: string
  /** the channel's full path */
  readonly path: string
  get: () => T
  set: (value: T) => void
  update: (change: (value: T) => T) => void
  on: (handler: (value: T) => void) => () => unknown
}

const nodeFor = (holoPath: string, id: string): {node: CyreNode; local: string} | null => {
  if (id.startsWith('/')) return {node: cyre, local: id.slice(1)}
  const holo = holoStore.getHolo(holoPath)
  return holo ? {node: holo.root, local: id} : null
}

const pathOf = (node: CyreNode, local: string): string => {
  const base = 'path' in node && typeof node.path === 'function' ? node.path() : ''
  return base ? `${base}/${local}` : local
}

const elementOf = (target: string | Element | null): HTMLElement | null =>
  typeof target === 'string'
    ? (document.querySelector(target) as HTMLElement | null)
    : (target as HTMLElement | null)

/** keep a binding in the instance's state so destroy() can undo it */
const remember = (holoPath: string, record: BindingRecord): (() => void) => {
  const holo = holoStore.getHolo(holoPath)
  if (!holo) return record.unbind
  holo.bindings[record.id] = record
  return () => {
    record.unbind()
    delete holo.bindings[record.id]
  }
}

/**
 * A piece of state: a channel whose payload is the value. Creating it
 * again returns the same state (its value is kept).
 */
export const createState = <T>(holoPath: string, id: string, initial: T): StateHandle<T> | undefined => {
  const target = nodeFor(holoPath, id)
  if (!target) return undefined
  const {node, local} = target
  if (!node.has(local)) {
    const registered = node.channel({id: local, payload: initial})
    if (!registered.ok) {
      log.error(`@HOLO state ${id}: ${registered.message}`)
      return undefined
    }
    node.on(local, () => undefined) // a value with nobody listening yet is fine
  }
  const get = () => node.value(local) as T
  const set = (value: T) => void node.call(local, value)
  return {
    id,
    path: pathOf(node, local),
    get,
    set,
    update: change => set(change(get())),
    on: handler => node.on(local, handler).unsubscribe || (() => false)
  }
}

/**
 * An element follows a channel. `render(value, element)` returns what to
 * show as text, or nothing when it changed the element itself. Without
 * render the value is shown as text. Text is set as text, never as HTML.
 */
export const bind = <T = any>(
  holoPath: string,
  target: string | Element | null,
  id: string,
  render?: (value: T, element: HTMLElement) => unknown
): (() => void) => {
  const element = elementOf(target)
  const source = nodeFor(holoPath, id)
  if (!element || !source) {
    log.error(`@HOLO bind ${id}: ${element ? 'unknown Holo instance' : 'element not found'}`)
    return () => undefined
  }
  const {node, local} = source
  const show = (value: T) => {
    const shown = render ? render(value, element) : value
    if (shown !== undefined && shown !== null && typeof shown !== 'object') {
      element.textContent = String(shown)
    }
  }
  const current = node.value(local)
  if (current !== undefined) show(current as T)
  const unsubscribe = node.on(local, show).unsubscribe
  return remember(holoPath, {
    id: `bind-${holoStore.nextId()}`,
    kind: 'bind',
    unbind: () => unsubscribe?.(),
    slots: {},
    rendered: {}
  })
}

export interface ListOptions<T> {
  key?: string | ((item: T, index: number) => string | number)
  render: (item: T, index: number, element: HTMLElement) => void
  unrender?: (element: HTMLElement, item: T) => void
  /** the element each item gets (default: li in lists, div elsewhere) */
  tag?: string
  /** shown while the list is empty */
  empty?: string
}

/**
 * A container follows a channel whose value is an array: one element
 * per item, keyed, reused and re-rendered only when its item changes
 * (the same update carousels use).
 */
export const list = <T = any>(
  holoPath: string,
  target: string | Element | null,
  id: string,
  options: ListOptions<T>
): (() => void) => {
  const container = elementOf(target)
  const source = nodeFor(holoPath, id)
  if (!container || !source) {
    log.error(`@HOLO list ${id}: ${container ? 'unknown Holo instance' : 'element not found'}`)
    return () => undefined
  }
  const {node, local} = source
  const tag = options.tag || (/^(UL|OL)$/.test(container.tagName) ? 'li' : 'div')
  const record: BindingRecord = {
    id: `list-${holoStore.nextId()}`,
    kind: 'list',
    unbind: () => undefined,
    slots: {},
    rendered: {}
  }

  const show = (value: T[]) => {
    const items = Array.isArray(value) ? value : []
    if (!items.length && options.empty !== undefined) {
      for (const key in record.slots) {
        options.unrender?.(record.slots[key], record.rendered[key] as T)
        delete record.slots[key]
        delete record.rendered[key]
      }
      container.textContent = options.empty
      container.dataset.empty = ''
      return
    }
    if ('empty' in container.dataset) {
      container.textContent = ''
      delete container.dataset.empty
    }
    const keys = keysOf(items, options.key)
    reconcile(container, items, keys, record, {
      make: () => document.createElement(tag),
      fill: (item, index, element) => options.render(item as T, index, element),
      drop: (element, item) => options.unrender?.(element, item as T)
    })
  }

  const current = node.value(local)
  show((current as T[]) || [])
  const unsubscribe = node.on(local, show).unsubscribe
  record.unbind = () => unsubscribe?.()
  return remember(holoPath, record)
}

export interface InputOptions<T> {
  /** the event that sets the value (default input; change for selects and checkboxes) */
  event?: string
  /** element value → state value */
  parse?: (value: string, element: HTMLInputElement) => T
  /** state value → element value */
  format?: (value: T) => string
}

/** a form field and a channel, both ways */
export const bindInput = <T = string>(
  holoPath: string,
  target: string | Element | null,
  id: string,
  options: InputOptions<T> = {}
): (() => void) => {
  const element = elementOf(target) as HTMLInputElement | null
  const source = nodeFor(holoPath, id)
  if (!element || !source) {
    log.error(`@HOLO bindInput ${id}: ${element ? 'unknown Holo instance' : 'element not found'}`)
    return () => undefined
  }
  const {node, local} = source
  const checkbox = element.type === 'checkbox'
  const event = options.event || (checkbox || element.tagName === 'SELECT' ? 'change' : 'input')
  const read = (): T => {
    const raw = checkbox ? String(element.checked) : element.value
    if (options.parse) return options.parse(raw, element)
    return (checkbox ? element.checked : raw) as unknown as T
  }
  const write = (value: T) => {
    if (checkbox) {
      element.checked = !!value
      return
    }
    const text = options.format ? options.format(value) : value === undefined || value === null ? '' : String(value)
    if (element.value !== text) element.value = text
  }
  if (!node.has(local)) {
    node.channel({id: local, payload: read()})
    node.on(local, () => undefined)
  } else {
    const current = node.value(local)
    if (current !== undefined) write(current as T)
  }
  const onInput = () => void node.call(local, read())
  element.addEventListener(event, onInput)
  const unsubscribe = node.on(local, write).unsubscribe
  return remember(holoPath, {
    id: `input-${holoStore.nextId()}`,
    kind: 'input',
    unbind: () => {
      element.removeEventListener(event, onInput)
      unsubscribe?.()
    },
    slots: {},
    rendered: {}
  })
}

/**
 * Bind markup: data-bind="cart.count" shows a channel as text,
 * data-bind-input="query" binds a field both ways. Returns how many.
 */
export const bindAll = (holoPath: string, root: ParentNode = document): number => {
  let count = 0
  root.querySelectorAll<HTMLElement>('[data-bind]').forEach(element => {
    if (element.dataset.bound) return
    element.dataset.bound = ''
    bind(holoPath, element, element.dataset.bind!)
    count++
  })
  root.querySelectorAll<HTMLElement>('[data-bind-input]').forEach(element => {
    if (element.dataset.bound) return
    element.dataset.bound = ''
    bindInput(holoPath, element, element.dataset.bindInput!)
    count++
  })
  return count
}

/** undo every binding of an instance */
export const unbindAll = (holoPath: string): void => {
  const holo = holoStore.getHolo(holoPath)
  if (!holo) return
  for (const id in holo.bindings) holo.bindings[id].unbind()
  holo.bindings = {}
}

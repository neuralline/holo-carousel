//src/app.ts
'use strict'
//Project HOLO-CAROUSEL 2019

// jscs:enabled
// @flow
// @ts-check

/*
    Neural Line
    Reactive carousel
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import {Cyre, cyre, useLog, LogLevel, log} from 'cyre'
import type {CyreControl} from 'cyre'
import {useMetrics} from 'cyre/metrics'
import {holoStore} from './core/state'
import holoCreateElement, {releasePageListeners} from './components/holo-create-element'
import holoInitiate from './components/holo-initiate'
import Touch from './components/holo-touch'
import {
  CyreNode,
  HoloChange,
  HoloIOOptions,
  HoloOptions
} from './types/interface'
import {CSS_CLASSES, EVENTS, HOLO_BRANCH} from './config/holo-config'
import {initializeHolo, setHold, setLoading} from './core/event-manager'
import {reconfigure} from './components/holo-io-manager'
import {changeOf, normalizeOptions} from './components/holo-essentials'
import {link as linkCarousels, LinkMode} from './components/holo-features'
import {tabs, stepper, pager, TabsOptions, StepperOptions} from './components/holo-presets'
import {
  bind,
  bindAll,
  bindInput,
  createState,
  list,
  unbindAll,
  InputOptions,
  ListOptions,
  StateHandle
} from './components/holo-bind'
import {applyRoute, currentRoute, RouterOptions, startRouter, writeRoute} from './components/holo-router'
import {tune, GestureTuning} from './components/holo-tune'

export const HOLO_VERSION = '3.4.0'

// Set by the UMD build: that bundle carries its own copy of Cyre, so it
// starts it. The ES and CJS builds share the app's Cyre.
declare const __HOLO_STANDALONE__: boolean | undefined
const standalone = typeof __HOLO_STANDALONE__ !== 'undefined' && __HOLO_STANDALONE__
const standaloneControl: CyreControl | null = standalone ? Cyre.init().control || null : null

// --- handles -------------------------------------------------------------
// Handles are thin: every call reads the store by path, so a handle never
// goes stale and holds no state of its own.

export interface CarouselHandle<T = any> {
  readonly id: string
  readonly path: string
  readonly element: HTMLElement | null
  next: () => void
  prev: () => void
  first: () => void
  last: () => void
  goTo: (index: number, animate?: boolean) => void
  /** where it is: index, page, pages, count, slots, ends */
  state: () => HoloChange | undefined
  pause: () => void
  play: () => void
  /** subscribe to one of its channels: 'change', 'next-slide', ... */
  on: (event: string, handler: (payload: any) => unknown) => (() => unknown) | undefined
  /** data mode: replace, add, remove items */
  set: (items: T[]) => void
  append: (items: T[]) => void
  remove: (keyOrIndex: string | number) => void
  /** put items in at an index */
  insert: (index: number, items: T[]) => void
  /** move an item (by key or index) to an index */
  move: (keyOrIndex: string | number, to: number) => void
  /** replace one item (by key or index), or change it with a function */
  update: (keyOrIndex: string | number, item: T | ((item: T) => T)) => void
  /** change the list with a function: patch(list => list.filter(...)) */
  patch: (change: (items: T[]) => T[]) => void
  items: () => T[]
  /** show skeletons while items are on their way (or put them back) */
  loading: (on?: boolean, count?: number) => void
  /** full screen (toggle, or on / off) - for presenting */
  fullscreen: (on?: boolean) => Promise<void>
  /** change options (rebuilds in place, keeping its position) */
  options: (options: Partial<HoloOptions<T>>) => HoloIOOptions | undefined
  /** a carousel nested in this one (a sub-branch) */
  create: <C = any>(element: HTMLElement | null, options?: HoloOptions<C>) => CarouselHandle<C> | undefined
  /** presets nested in this one */
  tabs: <C = any>(wrapper: HTMLElement, options?: TabsOptions<C>) => CarouselHandle<C> | undefined
  stepper: <C = any>(wrapper: HTMLElement, options?: StepperOptions<C>) => CarouselHandle<C> | undefined
  children: () => CarouselHandle[]
  refresh: () => void
  destroy: () => void
}

export interface HoloHandle {
  readonly path: string
  /** the instance's branch */
  readonly branch: CyreNode
  /** the Cyre control handle, only when this instance started Cyre */
  readonly control: CyreControl | null
  create: <T = any>(element: HTMLElement | null, options?: HoloOptions<T>) => CarouselHandle<T> | undefined
  /** build carousels from markup (opt-in) */
  scan: (root?: ParentNode, options?: {selector?: string}) => CarouselHandle[]
  get: (idOrPath: string) => CarouselHandle | undefined
  all: () => CarouselHandle[]
  link: (a: CarouselHandle | string, b: CarouselHandle | string, mode?: LinkMode) => () => unknown

  // presets: the same carousel model, their own controls and roles
  tabs: <T = any>(wrapper: HTMLElement, options?: TabsOptions<T>) => CarouselHandle<T> | undefined
  stepper: <T = any>(wrapper: HTMLElement, options?: StepperOptions<T>) => CarouselHandle<T> | undefined
  pager: <T = any>(element: HTMLElement, options?: HoloOptions<T>) => CarouselHandle<T> | undefined

  // state and bindings: any element follows a Cyre channel
  /** a value in a channel (holo/<id>; '/x' from the root) */
  state: <T>(id: string, initial: T) => StateHandle<T> | undefined
  /** an element shows a channel (render returns its text, or changes it) */
  bind: <T = any>(target: string | Element, id: string, render?: (value: T, element: HTMLElement) => unknown) => () => void
  /** a container keeps one element per item of an array channel (keyed) */
  list: <T = any>(target: string | Element, id: string, options: ListOptions<T>) => () => void
  /** a form field and a channel, both ways */
  bindInput: <T = string>(target: string | Element, id: string, options?: InputOptions<T>) => () => void
  /** data-bind / data-bind-input markup */
  bindAll: (root?: ParentNode) => number
  on: (id: string, handler: (payload: any) => unknown) => () => unknown
  call: (id: string, payload?: unknown) => Promise<unknown>

  // routing
  /** start routing (hash by default) - carousels with `route` start it themselves */
  router: (options?: RouterOptions) => void
  /** go to a path: holo.navigate('/work/alpha') */
  navigate: (route: string) => void
  /** the path the carousels show */
  route: () => string

  /** gesture numbers for the whole page: tune({deceleration: 0.002}); tune() reads, tune('reset') restores */
  tune: (values?: Partial<GestureTuning> | 'reset') => GestureTuning

  refresh: () => void
  destroy: () => void
}

export interface UseHoloOptions {
  /** scan the document (true), an element, or a selector, right away */
  scan?: boolean | ParentNode | string
  /** branch name (default holo) */
  name?: string
}

const pathOf = (target: CarouselHandle | string): string =>
  typeof target === 'string' ? holoStore.resolve(target) || target : target.path

const call = (path: string, event: string, payload?: unknown) =>
  holoStore.getBranch(path)?.call(event, payload)

/** an item's index from its key (a string) or an index (a number) */
const indexOfItem = (path: string, keyOrIndex: string | number): number => {
  const data = holoStore.getInstance(path)?.data
  if (!data) return -1
  if (typeof keyOrIndex === 'number') return keyOrIndex >= 0 && keyOrIndex < data.items.length ? keyOrIndex : -1
  return data.keys.indexOf(String(keyOrIndex))
}

/** the handle of a carousel path */
const carouselHandle = (path: string): CarouselHandle => {
  const instance = holoStore.getInstance(path)
  const id = instance?.id || path.split('/').pop() || path
  const dataOf = () => holoStore.getInstance(path)?.data

  const handle: CarouselHandle = {
    id,
    path,
    element: instance?.Dom?.carousel || null,
    next: () => void call(path, EVENTS.NEXT_SLIDE),
    prev: () => void call(path, EVENTS.PREV_SLIDE),
    first: () => void call(path, EVENTS.FIRST_SLIDE),
    last: () => void call(path, EVENTS.LAST_SLIDE),
    goTo: (index, animate = true) => void call(path, EVENTS.GO_TO, {index, animate}),
    state: () => {
      const virtualDom = holoStore.getVirtualDom(path)
      return virtualDom && changeOf(virtualDom, path)
    },
    pause: () => setHold(path, 'user', true),
    play: () => setHold(path, 'user', false),
    on: (event, handler) => holoStore.getBranch(path)?.on(event, handler)?.unsubscribe,
    set: items => void call(path, EVENTS.ITEMS, items),
    append: items => void call(path, EVENTS.ITEMS, [...((dataOf()?.items as any[]) || []), ...items]),
    remove: keyOrIndex => {
      const data = dataOf()
      const at = indexOfItem(path, keyOrIndex)
      if (!data || at < 0) return
      call(path, EVENTS.ITEMS, data.items.filter((_, i) => i !== at))
    },
    insert: (index, items) => {
      const list = [...((dataOf()?.items as any[]) || [])]
      list.splice(Math.max(0, Math.min(index, list.length)), 0, ...items)
      call(path, EVENTS.ITEMS, list)
    },
    move: (keyOrIndex, to) => {
      const list = [...((dataOf()?.items as any[]) || [])]
      const from = indexOfItem(path, keyOrIndex)
      if (from < 0) return
      const [item] = list.splice(from, 1)
      list.splice(Math.max(0, Math.min(to, list.length)), 0, item)
      call(path, EVENTS.ITEMS, list)
    },
    update: (keyOrIndex, item) => {
      const list = [...((dataOf()?.items as any[]) || [])]
      const at = indexOfItem(path, keyOrIndex)
      if (at < 0) return
      list[at] = typeof item === 'function' ? (item as (item: any) => any)(list[at]) : item
      call(path, EVENTS.ITEMS, list)
    },
    patch: change => call(path, EVENTS.ITEMS, change([...((dataOf()?.items as any[]) || [])])),
    items: () => ((dataOf()?.items as any[]) || []).slice(),
    loading: (on = true, count) => setLoading(path, on, count),
    fullscreen: async on => {
      const element = holoStore.getDom(path)?.carousel
      if (!element || typeof document === 'undefined') return
      const active = document.fullscreenElement === element
      const want = on ?? !active
      if (want && !active) await element.requestFullscreen?.()
      else if (!want && active) await document.exitFullscreen?.()
      element.focus?.()
    },
    options: options => reconfigure(path, options),
    create: (element, options = {}) => {
      const current = holoStore.getInstance(path)
      if (!current) return undefined
      const child = holoCreateElement(element, options, {holo: current.holo, parent: path})
      return child ? carouselHandle(child) : undefined
    },
    tabs: (wrapper, options) => {
      const current = holoStore.getInstance(path)
      return current ? handleOf(tabs(current.holo, wrapper, options, path)) : undefined
    },
    stepper: (wrapper, options) => {
      const current = holoStore.getInstance(path)
      return current ? handleOf(stepper(current.holo, wrapper, options, path)) : undefined
    },
    children: () => (holoStore.getInstance(path)?.children || []).map(carouselHandle),
    refresh: () => void call(path, EVENTS.REFRESH_CAROUSEL),
    destroy: () => {
      holoStore.removeInstance(path)
      releasePageListeners()
    }
  }
  return handle
}

const handleOf = (path: string): CarouselHandle | undefined => (path ? carouselHandle(path) : undefined)

/** the handle of a Holo instance */
const holoHandle = (path: string): HoloHandle => {
  const holo = holoStore.getHolo(path)!
  return {
    path,
    branch: holo.root,
    control: holo.control,
    create: (element, options = {}) => {
      const created = holoCreateElement(element, options, {holo: path})
      return created ? carouselHandle(created) : undefined
    },
    scan: (root = document, options = {}) =>
      holoInitiate(path, root, options.selector).map(carouselHandle),
    get: idOrPath => {
      const found = holoStore.resolve(idOrPath) || holoStore.resolve(`${path}/${idOrPath}`)
      return found ? carouselHandle(found) : undefined
    },
    all: () => {
      const all = holoStore.getAllInstances()
      return Object.keys(all)
        .filter(key => all[key].holo === path)
        .map(carouselHandle)
    },
    link: (a, b, mode = 'sync') => linkCarousels(pathOf(a), pathOf(b), mode),
    tabs: (wrapper, options) => handleOf(tabs(path, wrapper, options)),
    stepper: (wrapper, options) => handleOf(stepper(path, wrapper, options)),
    pager: (element, options) => handleOf(pager(path, element, options)),
    state: (id, initial) => createState(path, id, initial),
    bind: (target, id, render) => bind(path, target, id, render),
    list: (target, id, options) => list(path, target, id, options),
    bindInput: (target, id, options) => bindInput(path, target, id, options),
    bindAll: root => bindAll(path, root),
    on: (id, handler) => {
      const node = id.startsWith('/') ? cyre : holo.root
      return node.on(id.replace(/^\//, ''), handler).unsubscribe || (() => false)
    },
    call: (id, payload) => (id.startsWith('/') ? cyre : holo.root).call(id.replace(/^\//, ''), payload as any),
    router: options => startRouter(options),
    tune,
    navigate: route => {
      startRouter()
      applyRoute(route, true)
      writeRoute()
    },
    route: () => currentRoute(),
    refresh: () => void holo.root.call(EVENTS.REFRESH_SCREEN),
    destroy: () => {
      const current = holoStore.getHolo(path)
      if (!current) return
      unbindAll(path)
      for (const top of [...current.carousels]) holoStore.removeInstance(top, false)
      current.root.destroy()
      holoStore.removeHolo(path)
      releasePageListeners()
    }
  }
}

/**
 * A Holo instance on your Cyre tree.
 *
 *   const holo = useHolo(cyre)                    // holo under root
 *   const holo = useHolo(cyre.branch('ui'))       // ui/holo
 *   const holo = useHolo()                        // starts Cyre if no app did
 *   const holo = useHolo(cyre, {scan: true})      // and builds .holo-carousel markup
 *
 * Nothing is built until you call create() or scan().
 */
export function useHolo(parent?: CyreNode | UseHoloOptions, options: UseHoloOptions = {}): HoloHandle | undefined {
  const isNode = parent && typeof (parent as CyreNode).branch === 'function'
  const node = isNode ? (parent as CyreNode) : undefined
  const settings = isNode ? options : ((parent as UseHoloOptions) || options)

  const state = initializeHolo(node, settings.name || HOLO_BRANCH, standalone)
  if (!state) return undefined
  if (standalone && !state.control && standaloneControl && !node) {
    holoStore.addHolo({...state, control: standaloneControl, owns: true})
  }
  const handle = holoHandle(state.path)

  const scan = settings.scan
  if (scan) {
    if (typeof scan === 'string') handle.scan(document, {selector: scan})
    else if (scan === true) handle.scan()
    else handle.scan(scan)
  }
  return handle
}

// --- the v2 global API (script-tag pages) ------------------------------
// A wrapper over one default instance. Holo.INIT() scans, as it always did.

export interface HoloInitOptions {
  /** class the scan looks for (default holo-carousel) */
  className?: string
  /** node to put the holo branch under (default: root cyre) */
  cyre?: CyreNode
}

const Holo = (() => {
  const instance = (parent?: CyreNode): HoloHandle | undefined => {
    const current = holoStore.getSystem().defaultHolo
    if (current && holoStore.getHolo(current)) return holoHandle(current)
    const created = useHolo(parent)
    if (created) holoStore.updateSystem({defaultHolo: created.path})
    return created
  }
  const byId = (id: string) => {
    const path = holoStore.resolve(id)
    return path ? carouselHandle(path) : undefined
  }
  const nav = (id: string, run: (handle: CarouselHandle) => void): boolean => {
    const handle = byId(id)
    if (handle) run(handle)
    return !!handle
  }

  return {
    VERSION: HOLO_VERSION,
    TOUCH: Touch,
    EVENTS,
    use: useHolo,
    tune,

    INIT: (options: string | HoloInitOptions = {}) => {
      const {className = CSS_CLASSES.CAROUSEL, cyre: parent} =
        typeof options === 'string' ? {className: options} : options
      const holo = instance(parent)
      if (!holo) return []
      console.log(`%c HOLO - Initiating holo v${HOLO_VERSION} `, 'background: #022d5f; color: white; display: block;')
      return holo.scan(document, {selector: `.${className}`}).map(c => c.id)
    },
    BUILD: (element: HTMLElement, options: Partial<HoloOptions> | Partial<HoloIOOptions> = {}): string =>
      instance()?.create(element, options as HoloOptions)?.id || '',
    AUTO: (className = CSS_CLASSES.CAROUSEL) =>
      (instance()?.scan(document, {selector: `.${className}`}) || []).map(c => c.id),

    carousel: (id: string, io: Partial<HoloIOOptions> = {}) => {
      const handle = byId(id)
      const data = handle?.options(normalizeOptions(io) as any)
      return {ok: !!data, data: (data || {}) as HoloIOOptions}
    },
    refresh: () => instance()?.refresh(),
    dimensions: (id: string) => {
      const path = holoStore.resolve(id)
      return path ? holoStore.getDimensions(path) : undefined
    },
    next: (id: string) => nav(id, h => h.next()),
    prev: (id: string) => nav(id, h => h.prev()),
    first: (id: string) => nav(id, h => h.first()),
    last: (id: string) => nav(id, h => h.last()),
    goTo: (id: string, index: number, animate = true) => nav(id, h => h.goTo(index, animate)),
    state: (id: string) => byId(id)?.state(),
    pause: (id: string) => nav(id, h => h.pause()),
    play: (id: string) => nav(id, h => h.play()),
    on: (id: string, eventId: string, handler: (...args: any[]) => any) => {
      const path = holoStore.resolve(id)
      return path ? holoStore.getBranch(path)?.on(eventId, handler) : undefined
    },
    link: (a: string, b: string, mode: LinkMode = 'sync') => {
      const pa = holoStore.resolve(a)
      const pb = holoStore.resolve(b)
      return pa && pb ? linkCarousels(pa, pb, mode) : () => false
    },
    remove: (id: string) => {
      const handle = byId(id)
      handle?.destroy()
      return !!handle
    },
    cleanup: () => {
      instance()?.destroy()
      holoStore.updateSystem({defaultHolo: ''})
    }
  }
})()

// Export for module use
export default Holo

// Also expose to window for UMD/browser usage
if (typeof window !== 'undefined') {
  ;(window as any).Holo = Holo
  ;(window as any).useHolo = useHolo

  // The standalone bundle's own Cyre, for pages that want its telemetry.
  // Apps using the ES build import cyre themselves.
  if (standalone) {
    ;(window as any).Cyre = {Cyre, cyre, control: standaloneControl, useLog, useMetrics, LogLevel, log}
  }
}

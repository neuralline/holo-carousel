//src/components/holo-create-element.ts

import {log} from 'cyre'
import {holoStore} from '../core/state'
import {setupCarousel} from './holo-io-manager'
import {applyGestureOptions} from './holo-tune'
import {refreshCarousel, setItems, setLoading} from '../core/event-manager'
import Touch from './holo-touch'
import {
  keysOf,
  normalizeBreakpoints,
  normalizeOptions,
  readDataOptions
} from './holo-essentials'
import {DataState, DomState, HoloIOOptions, HoloOptions} from '../types/interface'
import {CSS_CLASSES, EVENTS, PATH_ATTRIBUTE} from '../config/holo-config'
import {createDefaultIOOptions} from '../core/state'
import {buildLanes, planGroups} from './holo-groups'
import {measureCarousel} from './holo-render'

/*
  Creating carousels: from markup that is already there, from data
  (Holo builds the container and a slot per item), or headless (no
  element: the model alone, for tests and servers). All three register
  the same state and channels.
*/

/** page-wide pointer and resize listeners, while any carousel has an element */
const ensurePageListeners = (): void => {
  const system = holoStore.getSystem()
  if (system.listeners > 0 || typeof window === 'undefined') {
    system.listeners++
    return
  }
  const refresh = () => {
    const holos = holoStore.getAllHolos()
    for (const path in holos) holos[path].root.call(EVENTS.REFRESH_SCREEN)
  }
  const touchCleanup = Touch.setupGlobalTouchListeners()
  window.addEventListener('resize', refresh)
  window.addEventListener('load', refresh)
  holoStore.updateSystem({
    listeners: 1,
    cleanup: () => {
      touchCleanup()
      window.removeEventListener('resize', refresh)
      window.removeEventListener('load', refresh)
    }
  })
}

/** let go of the page-wide listeners once no carousel with an element is left */
export const releasePageListeners = (): void => {
  const system = holoStore.getSystem()
  if (system.listeners <= 0) return
  const all = holoStore.getAllInstances()
  for (const path in all) if (all[path].Dom) return
  system.cleanup()
  holoStore.updateSystem({listeners: 0, cleanup: () => {}})
}

/** the carousel's own container: a direct child first, then the first inside */
const findContainer = (element: HTMLElement): HTMLElement | null =>
  (element.querySelector(`:scope > .${CSS_CLASSES.CONTAINER}`) as HTMLElement | null) ||
  (element.getElementsByClassName(CSS_CLASSES.CONTAINER)[0] as HTMLElement | undefined) ||
  null

export interface CreateContext {
  /** the Holo instance (its branch path) */
  holo: string
  /** the carousel this one is nested in */
  parent?: string | null
}

/**
 * Create a carousel and return its path ('' if it could not be made).
 * Options come from, in order: the defaults, the element's data-*
 * attributes, then `options`.
 */
const holoCreateElement = (
  element: HTMLElement | null,
  options: HoloOptions = {},
  context: CreateContext
): string => {
  const holo = holoStore.getHolo(context.holo)
  if (!holo) {
    log.error('@HOLO create: unknown Holo instance ' + context.holo)
    return ''
  }

  // items may be a list, a promise of one, or a function returning one
  const source = typeof options.items === 'function' ? (options.items as () => Promise<unknown[]>)() : options.items
  const pending = !!source && typeof (source as Promise<unknown[]>).then === 'function'
  const initial: unknown[] = Array.isArray(source) ? source : []
  const dataMode = Array.isArray(source) || pending || typeof options.render === 'function'
  if (dataMode && typeof options.render !== 'function' && element) {
    log.error('@HOLO create: items need a render(item, index, slot) function')
    return ''
  }

  const merged: HoloOptions = {...(element ? readDataOptions(element) : {}), ...options}
  const id = String(merged.id || element?.id || holoStore.nextId())
  if (element && !element.id) element.id = id

  // the DOM: existing markup, or built for data
  let Dom: DomState | null = null
  if (element) {
    let container = findContainer(element)
    if (!container && dataMode) {
      container = document.createElement('ul')
      container.className = `${CSS_CLASSES.CONTAINER} ${CSS_CLASSES.TRANSITION}`
      element.appendChild(container)
    }
    if (!container) {
      log.error('@HOLO create: holo-container not found in ' + id)
      return ''
    }
    element.classList.add(CSS_CLASSES.CAROUSEL)
    Dom = {carousel: element, container}
  }

  // the branch: under the parent carousel, or the Holo instance
  const parentPath = context.parent || null
  const parentBranch = parentPath ? holoStore.getBranch(parentPath) : holo.root
  if (!parentBranch) {
    log.error('@HOLO create: unknown parent carousel ' + parentPath)
    return ''
  }
  const branchId = id.replace(/[/\\\s]/g, '-')
  const path = `${parentBranch.path()}/${branchId}`

  // building the same carousel again replaces it
  if (holoStore.hasInstance(path)) {
    holoStore.removeInstance(path)
    releasePageListeners()
  }

  const io: HoloIOOptions = {...createDefaultIOOptions(id), ...normalizeOptions(merged), id}
  if (io.virtual && !dataMode) io.virtual = 0 // a virtual window needs data
  // groups: data and an element; the lanes are made now (each is a branch), so never deferred
  const grouped = typeof merged.group === 'function' && dataMode && !!element
  if (typeof merged.group === 'function' && !grouped) log.warn(`@HOLO create: ${id} - groups need items and an element`)
  if (grouped) io.virtual = 0
  const deferred = !!io.defer && !!element && !grouped

  const branch = parentBranch.branch(
    branchId,
    deferred ? {load: () => setupCarousel(path), lockAfterLoad: false} : undefined
  )
  if (!branch) {
    log.error('@HOLO create: failed to create Cyre branch for ' + path)
    return ''
  }

  const data: DataState | null = dataMode
    ? {
        items: initial.slice(),
        keys: keysOf(initial, options.key),
        loading: pending,
        frame: 0,
        render: options.render || (() => undefined),
        key: options.key,
        unrender: options.unrender,
        slots: {},
        rendered: {},
        pool: []
      }
    : null

  holoStore.registerInstance({
    id,
    path,
    holo: holo.path,
    parent: parentPath,
    io,
    breakpoints: normalizeBreakpoints(merged.breakpoints),
    Dom,
    branch,
    data
  })
  if (grouped) planGroups(path, merged)
  if (typeof merged.route === 'function') {
    holoStore.getInstance(path)!.meta.routeOf = merged.route
  }
  const gesture = applyGestureOptions(undefined, merged)
  if (gesture) holoStore.getInstance(path)!.meta.gesture = gesture
  if (element) {
    element.setAttribute(PATH_ATTRIBUTE, path)
    ensurePageListeners()
  }

  // a promise of items: skeletons until it settles
  if (pending) {
    ;(source as Promise<unknown[]>).then(
      list => holoStore.getInstance(path) && setItems(path, list),
      error => {
        log.error(`@HOLO ${path}: items failed to load - ${error}`)
        if (holoStore.getInstance(path)) setLoading(path, false)
      }
    )
  }

  if (!deferred) {
    setupCarousel(path)
    if (grouped) {
      buildLanes(path, holoCreateElement)
      // the groups show at once (the lanes' items, then the stacked sections)
      measureCarousel(path)
    }
    // a child changes its parent's size: re-measure the parent
    if (parentPath) refreshCarousel(parentPath)
    return path
  }

  // deferred: channels register on the first call into the branch, or
  // when the carousel comes within 300px of the screen
  if (typeof IntersectionObserver !== 'undefined') {
    const near = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return
        near.disconnect()
        if (!holoStore.getInstance(path)?.loaded) branch.load()
      },
      {rootMargin: '300px'}
    )
    near.observe(element!)
    holoStore.updateInstance(path, {unobserve: () => near.disconnect()})
  } else {
    branch.load()
  }
  return path
}

export default holoCreateElement

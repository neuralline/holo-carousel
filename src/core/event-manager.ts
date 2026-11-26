//src/core/event-manager.ts

import {Cyre, cyre, log} from 'cyre'
import {EVENTS, HOLO_BRANCH} from '../config/holo-config'
import {CyreNode, HoloBranch, HoldReason, HoloInstanceState} from '../types/interface'
import {holoStore} from './state'
import {
  animate,
  animateSlideBackward,
  animateSlideForward,
  firstSlide,
  lastSlide,
  nxtSlide,
  prvSlide,
  reveal,
  wheeler,
  goTo,
  keysOf,
  setTrack,
  snap
} from '../components/holo-essentials'
import {measureCarousel, nudgeCarousel, placeCarousel} from '../components/holo-render'
import {refreshLayout} from '../components/holo-io-manager'
import {routeReady} from '../components/holo-router'

export type {CyreNode}

/**
 * Create a named branch and register its first channels. Cyre belongs
 * to the app: the app calls Cyre.init() and keeps `control`; Holo only
 * adds a branch. With no parent and nothing started yet, Holo starts
 * Cyre itself (and says so) - `owns` tells the caller.
 */
export const attachBranch = (
  name: string,
  register: (branch: HoloBranch) => boolean,
  parent?: CyreNode,
  quiet = false
): {branch: HoloBranch | null; owns: boolean; control: ReturnType<typeof Cyre.init>['control'] | null} => {
  const attempt = (): HoloBranch | null => {
    const branch = (parent || cyre).branch(name)
    return branch && register(branch) ? branch : null
  }

  const branch = attempt()
  if (branch || parent) return {branch, owns: false, control: null}

  if (!quiet) {
    log.warn(
      `@${name}: Cyre was not initialized - starting it. Call Cyre.init() in your app first to keep control of it.`
    )
  }
  const started = Cyre.init()
  return {branch: attempt(), owns: started.ok, control: started.control || null}
}

/**
 * A Holo instance: its branch (holo, under the given node) and the one
 * channel that re-measures all its carousels.
 */
export const initializeHolo = (
  parent?: CyreNode,
  name = HOLO_BRANCH,
  quiet = false
): HoloInstanceState | null => {
  const base = parent && 'path' in parent ? (parent as HoloBranch).path() : ''
  const path = base ? `${base}/${name}` : name
  const existing = holoStore.getHolo(path)
  if (existing) return existing

  const {branch, owns, control} = attachBranch(
    name,
    root => {
      if (!root.channel({id: EVENTS.REFRESH_SCREEN, debounce: holoStore.gesture().REFRESH_DEBOUNCE * 2}).ok) {
        return false
      }
      root.on(EVENTS.REFRESH_SCREEN, () => {
        const all = holoStore.getAllInstances()
        for (const key in all) {
          if (all[key].holo === path && all[key].loaded) {
            all[key].branch.call(EVENTS.REFRESH_CAROUSEL)
          }
        }
      })
      return true
    },
    parent,
    quiet
  )

  if (!branch) {
    log.error(`@HOLO: could not create the ${name} branch (is Cyre locked?)`)
    return null
  }

  return holoStore.addHolo({
    path: branch.path(),
    root: branch,
    owns,
    control: control || null,
    carousels: [],
    bindings: {}
  })
}

/** auto-play interval for a carousel */
export const autoplayInterval = (path: string): number => {
  const io = holoStore.getVirtualDom(path)?.io
  if (!io) return 0
  // v2 pages passed animate: 1 and the interval in duration; a number
  // above 1 in animate is the interval itself
  return io.animate > 1 ? io.animate : io.duration || 5000
}

type GoToPayload =
  | number
  | {index?: number; track?: number; animate?: boolean; speed?: number; spring?: boolean}

/**
 * Register one carousel's channels on its own branch. Every navigation
 * ends in go-to, so `change` fires the same way for a swipe, a button,
 * a key, the wheel, a link or auto-play.
 */
export const initializeCarouselChannels = (path: string): boolean => {
  const instance = holoStore.getInstance(path)
  if (!instance) return false
  const {branch} = instance

  const registered = branch.channel([
    {id: EVENTS.REFRESH_CAROUSEL, debounce: holoStore.gesture().REFRESH_DEBOUNCE},
    {id: EVENTS.GO_TO},
    {id: EVENTS.SNAP},
    {id: EVENTS.NEXT_SLIDE},
    {id: EVENTS.PREV_SLIDE},
    {id: EVENTS.FIRST_SLIDE},
    {id: EVENTS.LAST_SLIDE},
    {id: EVENTS.ANIMATE_FORWARD},
    {id: EVENTS.ANIMATE_BACKWARD},
    {id: EVENTS.ACTIVATE},
    {id: EVENTS.WHEELER, throttle: holoStore.gesture().WHEEL_THROTTLE},
    {id: EVENTS.SHAKE},
    {id: EVENTS.SETTLE, delay: 160},
    {id: EVENTS.ITEMS},
    {id: EVENTS.CHANGE},
    {id: EVENTS.TAP},
    {id: EVENTS.DOUBLE_TAP},
    {id: EVENTS.LONG_PRESS},
    {id: EVENTS.SWIPE},
    {id: EVENTS.ANIMATE, interval: autoplayInterval(path), repeat: true}
  ])
  if (!registered.ok) return false

  branch.on(EVENTS.REFRESH_CAROUSEL, () => refreshLayout(path))
  branch.on(EVENTS.GO_TO, (payload: GoToPayload) => {
    if (typeof payload === 'number') return goTo(path, payload)
    const animate = payload?.animate !== false
    const speed = typeof payload?.speed === 'number' ? payload.speed : null
    const spring = !!payload?.spring
    if (typeof payload?.track === 'number') return setTrack(path, payload.track, animate, speed, spring)
    return goTo(path, payload?.index ?? 0, animate, speed, spring)
  })
  branch.on(EVENTS.SNAP, () => snap(path))
  branch.on(EVENTS.NEXT_SLIDE, (payload?: {loop?: boolean}) => nxtSlide(path, payload?.loop))
  branch.on(EVENTS.PREV_SLIDE, (payload?: {loop?: boolean}) => prvSlide(path, payload?.loop))
  branch.on(EVENTS.FIRST_SLIDE, () => firstSlide(path))
  branch.on(EVENTS.LAST_SLIDE, () => lastSlide(path))
  branch.on(EVENTS.ANIMATE_FORWARD, () => animateSlideForward(path))
  branch.on(EVENTS.ANIMATE_BACKWARD, () => animateSlideBackward(path))
  branch.on(EVENTS.ANIMATE, () => animate(path))
  branch.on(EVENTS.ACTIVATE, (payload: HTMLElement | number | [HTMLElement, unknown]) => {
    const target = Array.isArray(payload) ? payload[0] : payload
    activate(path, target)
  })
  branch.on(EVENTS.WHEELER, ({delta}: {delta: number}) => wheeler(path, delta))
  branch.on(EVENTS.SHAKE, (payload: {direction?: 1 | -1} = {}) =>
    shake(path, payload?.direction === -1 ? -1 : 1)
  )
  branch.on(EVENTS.SETTLE, () => {
    const current = holoStore.getInstance(path)
    if (!current) return
    holoStore.updateStyle(path, true)
    current.virtualDom.moveDuration = current.virtualDom.duration
    placeCarousel(path)
  })
  branch.on(EVENTS.ITEMS, (items: unknown[]) => setItems(path, items))
  // change and the gestures have no work of their own; apps subscribe
  // with carousel.on('change' | 'tap' | 'double-tap' | 'long-press' | 'swipe')
  for (const id of [EVENTS.CHANGE, EVENTS.TAP, EVENTS.DOUBLE_TAP, EVENTS.LONG_PRESS, EVENTS.SWIPE]) {
    branch.on(id, () => undefined)
  }

  holoStore.updateInstance(path, {loaded: true})
  return true
}

/** the nudge at an end with nothing further to show */
const shake = (path: string, direction: 1 | -1): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom || instance.virtualDom.duration === 0) return
  nudgeCarousel(path, direction, holoStore.gesture().SHAKE)
}

/** mark an item current and bring it into view */
const activate = (path: string, target: HTMLElement | number): void => {
  const instance = holoStore.getInstance(path)
  if (!instance) return
  if (typeof target === 'number') {
    reveal(path, target)
    return
  }
  if (!instance.Dom) return
  const slot = target
  const index =
    slot.dataset.index !== undefined
      ? Number(slot.dataset.index)
      : Array.prototype.indexOf.call(instance.Dom.container.children, slot)
  if (index < 0) return
  instance.touchState.targetHoloComponent?.classList.remove('active')
  slot.classList.add('active')
  holoStore.updateTouchState(path, {targetHoloComponent: slot})
  reveal(path, index)
}

/** replace a data carousel's items (the items channel) */
export const setItems = (path: string, items: unknown[]): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.data) {
    log.error(`@HOLO: ${path} was not created from data - items need items/render options`)
    return
  }
  const list = Array.isArray(items) ? items.slice() : []
  holoStore.updateData(path, {items: list, keys: keysOf(list, instance.data.key), loading: false})
  instance.Dom?.carousel.removeAttribute('aria-busy')
  const routed = !!instance.virtualDom.io.route
  if (!instance.Dom || typeof requestAnimationFrame !== 'function') {
    if (routed) instance.meta.routed = false // the new measure must not write the path
    measureCarousel(path) // headless: the model at once
    if (routed) routeReady(path)
    return
  }
  // a live feed may update many times a frame: draw once per frame, with
  // the latest items (the model already has them)
  if (instance.data.frame) return
  instance.data.frame = requestAnimationFrame(() => {
    const current = holoStore.getInstance(path)
    if (!current?.data) return
    current.data.frame = 0
    // a deep link to an item that just arrived: measure without writing
    // the path, then read the address bar
    if (routed) current.meta.routed = false
    // measure draws the items (data mode) - once
    measureCarousel(path)
    if (routed) routeReady(path)
  })
}

/**
 * Show skeletons while items are on their way (data carousels), or put
 * the items back. `count` skeletons (default: as many as fit).
 */
export const setLoading = (path: string, on: boolean, count?: number): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.data) {
    log.error(`@HOLO: ${path} is not a data carousel - loading() needs items/render`)
    return
  }
  if (typeof count === 'number') holoStore.updateVirtualDom(path, {io: {placeholders: count} as any})
  holoStore.updateData(path, {loading: on})
  instance.Dom?.carousel.toggleAttribute('aria-busy', on)
  // measure draws the slots (data mode)
  measureCarousel(path)
}

/** start (or restart from now) a carousel's auto-play */
export const startAutoplay = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance || !instance.virtualDom.io.animate || !instance.loaded) return
  instance.branch.call(EVENTS.ANIMATE)
}

/** stop auto-play (the timer, not the holds) */
export const stopAutoplay = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (instance?.loaded) instance.branch.pause(EVENTS.ANIMATE)
}

/** hold or release auto-play for one reason; it runs while nothing holds it */
export const setHold = (path: string, reason: HoldReason, on: boolean): void => {
  const instance = holoStore.getInstance(path)
  if (!instance || !instance.virtualDom.io.animate) return
  const wasHeld = holoStore.isHeld(path)
  if (on) holoStore.hold(path, reason)
  else holoStore.release(path, reason)
  const held = holoStore.isHeld(path)

  const play = instance.Dom?.controls?.play
  if (play && reason === 'user') {
    play.setAttribute('aria-pressed', String(on))
    play.setAttribute('aria-label', on ? 'Play' : 'Pause')
    play.dataset.state = on ? 'paused' : 'playing'
  }
  if (held === wasHeld) return

  if (held) stopAutoplay(path)
  else {
    instance.branch.resume(EVENTS.ANIMATE)
    startAutoplay(path) // a full interval after the hold ends
  }
  instance.Dom?.carousel.classList.toggle('holo-paused', held)
}

/**
 * Trigger a refresh for a specific carousel
 */
export const refreshCarousel = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (instance?.loaded) instance.branch.call(EVENTS.REFRESH_CAROUSEL)
}

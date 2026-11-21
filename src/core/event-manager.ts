//src/core/event-manager.ts

import {Cyre, cyre, log} from 'cyre'
import type {CyrePublic} from 'cyre'
import {EVENTS, GESTURE, HOLO_BRANCH} from '../config/holo-config'
import {HoloBranch} from '../types/interface'
import {holoStore} from './state'
import {_place} from '../components/orientation-handler'
import {
  animate,
  animateSlideBackward,
  animateSlideForward,
  firstSlide,
  lastSlide,
  nxtSlide,
  prvSlide,
  activate,
  wheeler,
  goTo,
  snap,
  settle,
  shake,
  renderState,
  changeOf,
  pagesOf,
  _getItemWidthHeight,
  _numberOfSlots
} from '../components/holo-essentials'

/** a node Holo can hang its branch under: root cyre or a host's branch */
export type CyreNode = CyrePublic | HoloBranch

/**
 * Create a named branch and register its first channels. Cyre belongs
 * to the app: the app calls Cyre.init() and keeps `control`, and Holo
 * only adds a branch. If nothing started Cyre (a page that only loads
 * Holo), Holo starts it so it still works, and says so.
 */
export const attachBranch = (
  name: string,
  register: (branch: HoloBranch) => boolean,
  parent?: CyreNode
): HoloBranch | null => {
  const attempt = (): HoloBranch | null => {
    const branch = (parent || cyre).branch(name)
    return branch && register(branch) ? branch : null
  }

  const branch = attempt()
  if (branch || parent) return branch

  log.warn(
    `@${name}: Cyre was not initialized - starting it. Call Cyre.init() in your app first to keep control of it.`
  )
  Cyre.init()
  return attempt()
}

/**
 * The holo branch and its one page-wide channel (holo/refresh-screen),
 * which fans out to every carousel's own refresh-carousel channel.
 * Each carousel's own channels sit one level down (holo/<id>/...).
 */
export const initializeGlobalEvents = (parent?: CyreNode): HoloBranch | null => {
  const existing = holoStore.getSystem().root
  if (existing) return existing

  const root = attachBranch(
    HOLO_BRANCH,
    branch => {
      const registered = branch.channel({
        id: EVENTS.REFRESH_SCREEN,
        debounce: GESTURE.REFRESH_DEBOUNCE * 2
      })
      if (!registered.ok) return false
      branch.on(EVENTS.REFRESH_SCREEN, () => {
        const instances = holoStore.getAllInstances()
        for (const id in instances) {
          instances[id].branch.call(EVENTS.REFRESH_CAROUSEL)
        }
      })
      return true
    },
    parent
  )

  if (!root) {
    log.error('@HOLO: could not create the holo branch (is Cyre locked?)')
    return null
  }

  holoStore.updateSystem({root})
  return root
}

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Measure one carousel and place it back at its first visible item:
 * item size, how many fit, how far it can move, how many pages.
 */
export const measureCarousel = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance) {
    log.error('HOLO: carousel refresh error - unknown id ' + id)
    return
  }

  const {Dom, virtualDom} = instance
  const io = virtualDom.io
  const vertical = !!io.orientation
  const items = Dom.container.children
  const count = items.length
  const pagesBefore = virtualDom.pages

  // measure from a clean slate
  Dom.carousel.style.width = ''
  Dom.carousel.style.height = vertical ? '0px' : ''
  if (vertical) Dom.container.style.width = '100%'

  const {width, height} = _getItemWidthHeight(items[0] as HTMLElement)
  const size = vertical ? height : width
  const parent = Dom.carousel.parentElement
  const room = parent ? (vertical ? parent.clientHeight : parent.clientWidth) : 0

  const fit =
    io.slots > 0
      ? io.slots
      : vertical && room < size
        ? Math.min(3, virtualDom.item.max || 3) // parent sizes to its content
        : _numberOfSlots(room, size, virtualDom.item.max || 0)
  const slots = Math.max(1, Math.min(fit, count || 1))
  const maxIndex = Math.max(0, count - slots)
  const step = io.step > 0 ? Math.min(io.step, Math.max(1, maxIndex)) : slots
  const length = count * size

  holoStore.updateVirtualDom(id, {
    item: {width, height},
    noOfChildren: count,
    numberOfSlots: slots,
    maxIndex,
    step,
    pages: pagesOf(maxIndex, step),
    duration: reducedMotion() ? 0 : io.transition,
    carousel: vertical
      ? {width: Dom.carousel.clientWidth, height: slots * size}
      : {width: slots * size, height},
    container: vertical
      ? {width: Dom.carousel.clientWidth, height: length}
      : {width: length, height},
    endOfSlidePosition: -Math.max(0, length - slots * size)
  })

  holoStore.setDimension(id)

  // back where it was, without animating the jump
  holoStore.updateVirtualDom(id, _place(virtualDom, virtualDom.index))
  holoStore.updateStyle(id, false)
  holoStore.applyDomTransform(id)
  renderState(id)

  if (pagesBefore !== virtualDom.pages) {
    instance.branch.call(EVENTS.CHANGE, changeOf(virtualDom))
  }
}

/** auto-play interval for a carousel */
export const autoplayInterval = (id: string): number => {
  const io = holoStore.getVirtualDom(id)?.io
  if (!io) return 0
  // v2 pages passed animate: 1 and the interval in duration; a number
  // above 1 in animate is the interval itself
  return io.animate > 1 ? io.animate : io.duration || 5000
}

/**
 * Register one carousel's own channels on its own branch (holo/<id>).
 * Navigation always ends in go-to, so `change` fires the same way for a
 * swipe, a button, a key, the wheel or auto-play.
 */
export const initializeCarouselChannels = (id: string): void => {
  const branch = holoStore.getBranch(id)
  if (!branch) return

  branch.channel([
    {id: EVENTS.REFRESH_CAROUSEL, debounce: GESTURE.REFRESH_DEBOUNCE},
    {id: EVENTS.GO_TO},
    {id: EVENTS.SNAP},
    {id: EVENTS.NEXT_SLIDE},
    {id: EVENTS.PREV_SLIDE},
    {id: EVENTS.FIRST_SLIDE},
    {id: EVENTS.LAST_SLIDE},
    {id: EVENTS.ANIMATE_FORWARD},
    {id: EVENTS.ANIMATE_BACKWARD},
    {id: EVENTS.ACTIVATE},
    {id: EVENTS.WHEELER, throttle: GESTURE.WHEEL_THROTTLE},
    {id: EVENTS.SHAKE},
    {id: EVENTS.SETTLE, delay: 160},
    {id: EVENTS.CHANGE},
    {id: EVENTS.ANIMATE, interval: autoplayInterval(id), repeat: true}
  ])

  branch.on(EVENTS.REFRESH_CAROUSEL, () => measureCarousel(id))
  branch.on(
    EVENTS.GO_TO,
    (payload: {index: number; animate?: boolean} | number) =>
      typeof payload === 'number'
        ? goTo(id, payload)
        : goTo(id, payload?.index ?? 0, payload?.animate !== false)
  )
  branch.on(EVENTS.SNAP, () => snap(id))
  branch.on(EVENTS.NEXT_SLIDE, (payload?: {loop?: boolean}) =>
    nxtSlide(id, payload?.loop)
  )
  branch.on(EVENTS.PREV_SLIDE, (payload?: {loop?: boolean}) =>
    prvSlide(id, payload?.loop)
  )
  branch.on(EVENTS.FIRST_SLIDE, () => firstSlide(id))
  branch.on(EVENTS.LAST_SLIDE, () => lastSlide(id))
  branch.on(EVENTS.ANIMATE_FORWARD, () => animateSlideForward(id))
  branch.on(EVENTS.ANIMATE_BACKWARD, () => animateSlideBackward(id))
  branch.on(EVENTS.ANIMATE, () => animate(id))
  branch.on(EVENTS.ACTIVATE, (payload: HTMLElement | [HTMLElement, unknown]) =>
    activate(id, Array.isArray(payload) ? payload[0] : payload)
  )
  branch.on(EVENTS.WHEELER, ({delta}: {delta: number}) => wheeler(id, delta))
  branch.on(EVENTS.SHAKE, (payload: {direction?: 1 | -1} = {}) =>
    shake(id, payload?.direction === -1 ? -1 : 1)
  )
  branch.on(EVENTS.SETTLE, () => settle(id))
  // change has no work of its own; hosts subscribe with Holo.on(id, 'change')
  branch.on(EVENTS.CHANGE, () => undefined)
}

/** start (or restart from now) a carousel's auto-play */
export const startAutoplay = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance || !instance.virtualDom.io.animate) return
  instance.branch.call(EVENTS.ANIMATE)
}

/** hold or release auto-play for one reason; it runs while nothing holds it */
export const setHold = (
  id: string,
  reason: Parameters<typeof holoStore.hold>[1],
  on: boolean
): void => {
  const instance = holoStore.getInstance(id)
  if (!instance || !instance.virtualDom.io.animate) return
  const wasHeld = holoStore.isHeld(id)
  if (on) holoStore.hold(id, reason)
  else holoStore.release(id, reason)
  const held = holoStore.isHeld(id)

  const play = instance.Dom.controls?.play
  if (play && reason === 'user') {
    play.setAttribute('aria-pressed', String(on))
    play.setAttribute('aria-label', on ? 'Play' : 'Pause')
    play.dataset.state = on ? 'paused' : 'playing'
  }
  if (held === wasHeld) return

  if (held) instance.branch.pause(EVENTS.ANIMATE)
  else {
    instance.branch.resume(EVENTS.ANIMATE)
    startAutoplay(id) // a full interval after the hold ends
  }
  instance.Dom.carousel.classList.toggle('holo-paused', held)
}

/**
 * Trigger a refresh for a specific carousel
 */
export const refreshCarousel = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance) {
    log.error('Holo carousel refresh error: unknown id ' + id)
    return
  }
  instance.branch.call(EVENTS.REFRESH_CAROUSEL)
}

//src/components/holo-essentials.ts

import {log} from 'cyre'
import {HoloChange, VirtualDomState} from '../types/interface'
import {holoStore} from '../core/state'
import {CSS_CLASSES, EVENTS, GESTURE} from '../config/holo-config'
import {_place} from './orientation-handler'

// --- pure maths ------------------------------------------------------

/**
 * Calculate snap position for grid alignment
 */
export const _snap = (parent: number, item: number): number =>
  item ? Math.round(parent / item) * item : parent

/**
 * Determine if a touch interaction is a click based on duration
 */
export const _isClicked = (timeElapsed: number): boolean => timeElapsed < 250

/**
 * Calculate swipe velocity
 */
export const _swipe = (distance: number, timeElapsed: number): number =>
  timeElapsed > 0 ? distance / timeElapsed : 0

/** an index inside 0..max */
export const clampIndex = (index: number, max: number): number =>
  Math.max(0, Math.min(Math.round(index) || 0, Math.max(0, max)))

/** how many dots: one per step, plus the last position */
export const pagesOf = (maxIndex: number, step: number): number =>
  maxIndex <= 0 ? 1 : Math.ceil(maxIndex / Math.max(1, step)) + 1

/** which dot an index belongs to (the end always lights the last one) */
export const pageOf = (index: number, maxIndex: number, step: number): number =>
  index >= maxIndex
    ? pagesOf(maxIndex, step) - 1
    : Math.floor(index / Math.max(1, step))

/** the index a dot goes to */
export const pageTarget = (page: number, maxIndex: number, step: number): number =>
  Math.min(page * Math.max(1, step), maxIndex)

/** the item at a position (positions are 0 or negative) */
export const nearestIndex = (position: number, size: number): number =>
  size > 0 ? Math.round(-position / size) : 0

/**
 * Past either end a drag keeps moving, but by less the further it goes,
 * so the edge is felt instead of hit.
 */
export const rubberBand = (
  position: number,
  end: number,
  resistance = GESTURE.RESISTANCE
): number => {
  if (position > 0) return position * resistance
  if (position < end) return end + (position - end) * resistance
  return position
}

/** px/ms over the last few samples of [time, position] */
export const releaseVelocity = (
  samples: Array<[number, number]>,
  now: number,
  window = GESTURE.VELOCITY_WINDOW
): number => {
  const recent = samples.filter(([time]) => now - time <= window)
  if (recent.length < 2) return 0
  const [t0, p0] = recent[0]
  const [t1, p1] = recent[recent.length - 1]
  return _swipe(p1 - p0, t1 - t0)
}

/**
 * Where a drag lands. A slow release snaps to the nearest item; a flick
 * carries on (momentum) and always moves at least one item that way.
 */
export const releaseIndex = (
  startIndex: number,
  position: number,
  velocity: number,
  size: number,
  maxIndex: number
): number => {
  if (size <= 0) return startIndex
  const projected = position + velocity * GESTURE.MOMENTUM
  let target = nearestIndex(projected, size)
  if (Math.abs(velocity) >= GESTURE.FLICK && target === startIndex) {
    target = startIndex - Math.sign(velocity)
  }
  return clampIndex(target, maxIndex)
}

/**
 * Where next/prev goes. Returns -1 when there is nowhere to go (an end
 * without loop), so the caller can nudge instead.
 */
export const stepIndex = (
  index: number,
  direction: 1 | -1,
  step: number,
  maxIndex: number,
  loop: boolean
): number => {
  if (maxIndex <= 0) return -1
  if (direction > 0) {
    if (index >= maxIndex) return loop ? 0 : -1
    return Math.min(index + step, maxIndex)
  }
  if (index <= 0) return loop ? maxIndex : -1
  return Math.max(index - step, 0)
}

/**
 * Merge options into carousel parameters
 */
export const ioData = (
  carouselParameter: Record<string, any> = {},
  io: Record<string, any> = {}
): Record<string, any> => {
  for (const attribute in io) {
    if (attribute in carouselParameter) {
      carouselParameter[attribute] = io[attribute]
    } else {
      log.warn('unknown carousel Parameter ' + attribute)
    }
  }
  return carouselParameter
}

/** data-animate="1" data-duration="4000" ... → options (numbers) */
export const readDataOptions = (
  element: HTMLElement,
  names: readonly string[]
): Record<string, number> => {
  const options: Record<string, number> = {}
  for (const name of names) {
    const raw = element.dataset[name]
    if (raw === undefined) continue
    const value =
      raw === '' || raw === 'true' ? 1 : raw === 'false' ? 0 : Number(raw)
    if (!Number.isNaN(value)) options[name] = value
  }
  return options
}

/**
 * Get width and height of an element including margins
 */
export const _getItemWidthHeight = (
  e: HTMLElement | null
): {width: number; height: number} => {
  if (!e) return {width: 0, height: 0}

  const style = window.getComputedStyle(e, null)
  const px = (value: string) => parseFloat(value) || 0

  return {
    width: e.offsetWidth + px(style.marginLeft) + px(style.marginRight),
    height: e.offsetHeight + px(style.marginTop) + px(style.marginBottom)
  }
}

/**
 * Calculate number of slots based on parent width and item width
 */
export const _numberOfSlots = (
  parent: number,
  item: number,
  max: number
): number => {
  const slots = item > 0 ? Math.floor(parent / item) : 1
  if (max && slots > max) return max
  return slots || 1
}

/** what Holo.on(id, 'change') sends */
export const changeOf = (virtualDom: VirtualDomState): HoloChange => ({
  id: virtualDom.id,
  index: virtualDom.index,
  page: virtualDom.page,
  pages: virtualDom.pages,
  count: virtualDom.noOfChildren || 0,
  slots: virtualDom.numberOfSlots,
  atStart: virtualDom.index <= 0,
  atEnd: virtualDom.index >= virtualDom.maxIndex
})

// --- DOM -------------------------------------------------------------

/**
 * Reflect the position in the DOM: which items are on screen (the rest
 * are hidden from screen readers and taken out of the tab order), the
 * slide labels, and the prev/next buttons and dots.
 */
export const renderState = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance) return
  const {Dom, virtualDom} = instance
  const items = Dom.container.children
  const first = virtualDom.index
  const last = first + virtualDom.numberOfSlots - 1
  const count = items.length

  for (let i = 0; i < count; i++) {
    const item = items[i] as HTMLElement
    const visible = i >= first && i <= last
    item.classList.toggle(CSS_CLASSES.VISIBLE, visible)
    item.setAttribute('aria-label', `${i + 1} of ${count}`)
    if (visible) {
      item.removeAttribute('aria-hidden')
      item.removeAttribute('inert')
    } else {
      item.setAttribute('aria-hidden', 'true')
      item.setAttribute('inert', '')
    }
  }

  const controls = Dom.controls
  if (!controls) return
  const loop = !!virtualDom.io.loop
  const scrollable = virtualDom.maxIndex > 0
  controls.root.hidden = !scrollable
  controls.prev.disabled = !loop && first <= 0
  controls.next.disabled = !loop && first >= virtualDom.maxIndex

  // dots, or "3 / 18" when there are more pages than dots fit
  const fit = Math.floor((virtualDom.carousel.width || 0) / 16) - 6
  const counter = virtualDom.pages > Math.max(3, fit)
  const mode = counter ? 'count' : 'dots'
  if (controls.dots.dataset.mode !== mode || (!counter && controls.dots.childElementCount !== virtualDom.pages)) {
    controls.dots.dataset.mode = mode
    controls.dots.textContent = ''
    if (!counter) {
      for (let page = 0; page < virtualDom.pages; page++) {
        const dot = document.createElement('button')
        dot.type = 'button'
        dot.className = CSS_CLASSES.DOT
        dot.dataset.page = String(page)
        dot.setAttribute('aria-label', `Go to page ${page + 1} of ${virtualDom.pages}`)
        controls.dots.appendChild(dot)
      }
    }
  }
  if (counter) {
    controls.dots.textContent = `${virtualDom.page + 1} / ${virtualDom.pages}`
    return
  }
  const dots = controls.dots.children
  for (let page = 0; page < dots.length; page++) {
    const on = page === virtualDom.page
    dots[page].classList.toggle(CSS_CLASSES.ACTIVE, on)
    if (on) dots[page].setAttribute('aria-current', 'true')
    else dots[page].removeAttribute('aria-current')
  }
}

// --- navigation (channel handlers) ------------------------------------

/**
 * Move to an item index - every navigation ends here. Emits `change`
 * when the first visible item changed.
 */
export const goTo = (id: string, target: number, animate = true): boolean => {
  const virtualDom = holoStore.getVirtualDom(id)
  if (!virtualDom) return false
  const before = virtualDom.index

  holoStore.updateVirtualDom(id, _place(virtualDom, target))
  holoStore.updateStyle(id, animate)
  holoStore.applyDomTransform(id)
  renderState(id)

  if (virtualDom.index !== before) {
    holoStore.getBranch(id)?.call(EVENTS.CHANGE, changeOf(virtualDom))
  }
  return true
}

/** the nudge at an end with nothing further to show */
export const shake = (id: string, direction: 1 | -1): void => {
  const instance = holoStore.getInstance(id)
  if (!instance || instance.virtualDom.duration === 0) return
  holoStore.updateStyle(id, true)
  holoStore.applyDomTransform(id, -direction * GESTURE.SHAKE)
  instance.branch.call(EVENTS.SETTLE)
}

/** back from a nudge */
export const settle = (id: string): void => {
  holoStore.updateStyle(id, true)
  holoStore.applyDomTransform(id)
}

/** next / prev: where to, then through go-to (or shake at an end) */
const advance = (id: string, direction: 1 | -1, loop?: boolean): void => {
  const instance = holoStore.getInstance(id)
  if (!instance) return
  const {virtualDom, branch} = instance
  const target = stepIndex(
    virtualDom.index,
    direction,
    virtualDom.step,
    virtualDom.maxIndex,
    loop ?? !!virtualDom.io.loop
  )
  if (target < 0) branch.call(EVENTS.SHAKE, {direction})
  else branch.call(EVENTS.GO_TO, {index: target})
}

/**
 * Previous slide operator
 */
export const prvSlide = (id: string, loop?: boolean): void =>
  advance(id, -1, loop)

/**
 * Next slide operator
 */
export const nxtSlide = (id: string, loop?: boolean): void =>
  advance(id, 1, loop)

/**
 * Jump to first slide operator
 */
export const firstSlide = (id: string): void => {
  holoStore.getBranch(id)?.call(EVENTS.GO_TO, {index: 0})
}

/**
 * Jump to last slide operator
 */
export const lastSlide = (id: string): void => {
  const virtualDom = holoStore.getVirtualDom(id)
  if (virtualDom) {
    holoStore.getBranch(id)?.call(EVENTS.GO_TO, {index: virtualDom.maxIndex})
  }
}

/**
 * Animate slides forward (auto-play always wraps around)
 */
export const animateSlideForward = (id: string): void => {
  holoStore.getBranch(id)?.call(EVENTS.NEXT_SLIDE, {loop: true})
}

/**
 * Animate slides backward
 */
export const animateSlideBackward = (id: string): void => {
  holoStore.getBranch(id)?.call(EVENTS.PREV_SLIDE, {loop: true})
}

/**
 * Auto-play tick
 */
export const animate = (id: string): void => {
  if (holoStore.isHeld(id)) return
  const instance = holoStore.getInstance(id)
  if (!instance) return
  instance.branch.call(
    instance.virtualDom.io.animateDirection < 0
      ? EVENTS.ANIMATE_BACKWARD
      : EVENTS.ANIMATE_FORWARD
  )
}

/**
 * Snap to the nearest item from wherever the container is
 */
export const snap = (id: string): void => {
  const virtualDom = holoStore.getVirtualDom(id)
  if (!virtualDom) return
  const size =
    (virtualDom.io.orientation ? virtualDom.item.height : virtualDom.item.width) || 0
  const position = virtualDom.io.orientation
    ? virtualDom.transformY
    : virtualDom.transformX
  goTo(id, nearestIndex(position, size))
}

/**
 * Mark an item active and bring it into view (the smallest move that
 * shows all of it)
 */
export const activate = (id: string, element: HTMLElement): void => {
  const instance = holoStore.getInstance(id)
  if (!instance) return
  const {virtualDom, touchState, Dom} = instance

  const position = Array.prototype.indexOf.call(Dom.container.children, element)
  if (position < 0) return

  touchState.targetHoloComponent?.classList.remove(CSS_CLASSES.ACTIVE)
  element.classList.add(CSS_CLASSES.ACTIVE)
  holoStore.updateTouchState(id, {targetHoloComponent: element})

  const last = virtualDom.index + virtualDom.numberOfSlots - 1
  if (position < virtualDom.index) goTo(id, position)
  else if (position > last) goTo(id, position - virtualDom.numberOfSlots + 1)
}

/**
 * Mouse wheel / trackpad: one step per gesture (the channel is throttled)
 */
export const wheeler = (id: string, delta: number): void => {
  if (delta < 0) prvSlide(id)
  else if (delta > 0) nxtSlide(id)
}

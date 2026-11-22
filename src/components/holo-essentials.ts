//src/components/holo-essentials.ts

import {log} from 'cyre'
import {
  HoloChange,
  HoloIOOptions,
  HoloOptions,
  VirtualDomState
} from '../types/interface'
import {holoStore} from '../core/state'
import {DATA_OPTIONS, DATA_WORDS, EVENTS} from '../config/holo-config'
import {placeCarousel, syncCarousel, normalizeTrack} from './holo-render'

/*
  The carousel model: pure maths plus the moves every input ends in.
  Nothing here reads or writes the DOM - the renderer (holo-render.ts)
  draws whatever the model says, so a headless carousel (no element)
  runs the same code.
*/

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

/** n wrapped into 0..count-1 */
export const wrapIndex = (n: number, count: number): number =>
  count > 0 ? ((Math.round(n) % count) + count) % count : 0

/** how many dots: one per step, plus the last position */
export const pagesOf = (maxIndex: number, step: number, wrap = false, count = 0): number =>
  wrap
    ? Math.max(1, Math.ceil(count / Math.max(1, step)))
    : maxIndex <= 0
      ? 1
      : Math.ceil(maxIndex / Math.max(1, step)) + 1

/** which dot an index belongs to (the end always lights the last one) */
export const pageOf = (index: number, maxIndex: number, step: number, wrap = false): number =>
  !wrap && index >= maxIndex && maxIndex > 0
    ? pagesOf(maxIndex, step) - 1
    : Math.floor(index / Math.max(1, step))

/** the index a dot goes to */
export const pageTarget = (page: number, maxIndex: number, step: number, wrap = false): number =>
  wrap ? page * Math.max(1, step) : Math.min(page * Math.max(1, step), maxIndex)

/** the item at a position (positions are 0 or negative) */
export const nearestIndex = (position: number, size: number): number =>
  size > 0 ? Math.round(-position / size) : 0

/**
 * Past either end a drag keeps moving, but by less the further it goes,
 * so the edge is felt instead of hit. Works in px or in items.
 */
export const rubberBand = (
  position: number,
  end: number,
  resistance = holoStore.gesture().RESISTANCE
): number => {
  if (position > 0) return position * resistance
  if (position < end) return end + (position - end) * resistance
  return position
}

/** a track kept inside 0..max, stretching past the ends */
export const rubberTrack = (track: number, max: number): number =>
  -rubberBand(-track, -max)

/** per ms over the last few samples of [time, value] */
export const releaseVelocity = (
  samples: Array<[number, number]>,
  now: number,
  window = holoStore.gesture().VELOCITY_WINDOW
): number => {
  const recent = samples.filter(([time]) => now - time <= window)
  if (recent.length < 2) return 0
  const [t0, p0] = recent[0]
  const [t1, p1] = recent[recent.length - 1]
  return _swipe(p1 - p0, t1 - t0)
}

/**
 * Where a drag lands, in px (kept for the px-based callers). A slow
 * release snaps to the nearest item; a flick carries on and always moves
 * at least one item that way.
 */
export const releaseIndex = (
  startIndex: number,
  position: number,
  velocity: number,
  size: number,
  maxIndex: number
): number => {
  if (size <= 0) return startIndex
  const projected = position + velocity * holoStore.gesture().MOMENTUM
  let target = nearestIndex(projected, size)
  if (Math.abs(velocity) >= holoStore.gesture().FLICK && target === startIndex) {
    target = startIndex - Math.sign(velocity)
  }
  return clampIndex(target, maxIndex)
}

/**
 * The same in items: where a track lands from its release speed
 * (items/ms). `flick` is the speed that counts as a flick, in items/ms.
 */
export const releaseTrack = (
  startTrack: number,
  track: number,
  velocity: number,
  flick: number
): number => {
  let target = Math.round(track + velocity * holoStore.gesture().MOMENTUM)
  const start = Math.round(startTrack)
  if (Math.abs(velocity) >= flick && target === start) {
    target = start + Math.sign(velocity)
  }
  return target
}

/**
 * How far a released drag glides on (items), decelerating evenly from its
 * release speed (items/ms): distance = v² / 2a. Pure.
 */
export const glideDistance = (
  velocity: number,
  size: number,
  deceleration = holoStore.gesture().DECELERATION,
  max = holoStore.gesture().MAX_GLIDE
): number => {
  if (!size || !velocity) return 0
  const speed = velocity * size // px/ms
  const distance = (speed * Math.abs(speed)) / (2 * deceleration) / size
  return Math.max(-max, Math.min(max, distance))
}

/** a move's length (ms): the transition for one item, longer for a long glide */
export const glideDuration = (base: number, items: number): number =>
  base <= 0
    ? 0
    : items <= 1
      ? base
      : Math.min(holoStore.gesture().GLIDE_MAX_DURATION, Math.round(base * (0.7 + 0.3 * Math.sqrt(items))))

/**
 * Where next/prev goes without wrapping. Returns -1 when there is
 * nowhere to go (an end without loop), so the caller can nudge instead.
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

/** the shortest way round from `from` to `to` on a ring of `count` */
export const shortestDelta = (from: number, to: number, count: number): number => {
  if (count <= 0) return 0
  let delta = wrapIndex(to - from, count)
  if (delta > count / 2) delta -= count
  return delta
}

/**
 * Merge options into carousel parameters
 */
export const ioData = (
  carouselParameter: Record<string, any> = {},
  io: Record<string, any> = {}
): Record<string, any> => {
  for (const attribute in io) {
    if (attribute in carouselParameter) carouselParameter[attribute] = io[attribute]
    else log.warn('unknown carousel Parameter ' + attribute)
  }
  return carouselParameter
}

const LOOPS: Record<string, number> = {
  false: 0,
  true: 1,
  rewind: 1,
  infinite: 2
}

/** app options (booleans, words) → the numbers a carousel runs on */
export const normalizeOptions = (
  options: Partial<HoloOptions> | Partial<HoloIOOptions> = {}
): Partial<HoloIOOptions> => {
  const io: Record<string, any> = {}
  for (const name in options) {
    const value = (options as any)[name]
    if (value === undefined) continue
    switch (name) {
      case 'items':
      case 'render':
      case 'key':
      case 'unrender':
      case 'breakpoints':
      case 'label':
      case 'validate':
      case 'onComplete':
      case 'nextLabel':
      case 'backLabel':
      case 'finishLabel':
        break // not runtime options
      case 'route':
        io.route = value ? 1 : 0 // a function is kept by create()
        break
      case 'loop':
        io.loop = typeof value === 'number' ? value : LOOPS[String(value)] ?? 0
        break
      case 'orientation':
        io.orientation = value === 'vertical' || value === 1 || value === true ? 1 : 0
        break
      case 'effect':
      case 'hash':
      case 'placeholder':
      case 'id':
        io[name] = String(value)
        break
      case 'active':
      case 'onClick':
      case 'onDoubleClick':
        io[name] = !!value
        break
      default:
        io[name] = typeof value === 'boolean' ? (value ? 1 : 0) : Number(value)
    }
  }
  return io as Partial<HoloIOOptions>
}

/** data-animate="1" data-effect="ring" ... → options */
export const readDataOptions = (
  element: HTMLElement,
  names: readonly string[] = DATA_OPTIONS
): Partial<HoloOptions> => {
  const options: Record<string, unknown> = {}
  for (const name of names) {
    const raw = element.dataset[name]
    if (raw === undefined) continue
    const value = raw === '' || raw === 'true' ? 1 : raw === 'false' ? 0 : Number(raw)
    if (!Number.isNaN(value)) options[name] = value
  }
  for (const name of DATA_WORDS) {
    const raw = element.dataset[name]
    if (raw === undefined) continue
    options[name] = /^\d+$/.test(raw) ? Number(raw) : raw
  }
  return options as Partial<HoloOptions>
}

/** breakpoints {768: {...}} → sorted [[768, normalised options]] */
export const normalizeBreakpoints = (
  breakpoints: Record<number, Partial<HoloOptions>> | undefined
): Array<[number, Partial<HoloIOOptions>]> =>
  Object.entries(breakpoints || {})
    .map(([width, options]) => [Number(width), normalizeOptions(options)] as [number, Partial<HoloIOOptions>])
    .filter(([width]) => !Number.isNaN(width))
    .sort((a, b) => a[0] - b[0])

/** the breakpoint (its min width) for a width, -1 for none */
export const breakpointFor = (
  breakpoints: Array<[number, unknown]>,
  width: number
): number => {
  let found = -1
  for (const [min] of breakpoints) if (width >= min) found = min
  return found
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
export const _numberOfSlots = (parent: number, item: number, max: number): number => {
  const slots = item > 0 ? Math.floor(parent / item) : 1
  if (max && slots > max) return max
  return slots || 1
}

/** what Holo.on(id, 'change') sends */
export const changeOf = (virtualDom: VirtualDomState, path = ''): HoloChange => ({
  id: virtualDom.id,
  path,
  index: virtualDom.index,
  page: virtualDom.page,
  pages: virtualDom.pages,
  count: virtualDom.noOfChildren || 0,
  slots: virtualDom.numberOfSlots,
  atStart: !virtualDom.wrap && virtualDom.index <= 0,
  atEnd: !virtualDom.wrap && virtualDom.index >= virtualDom.maxIndex
})

/** stands in for an item while the items load */
export const SKELETON = Object.freeze({holoSkeleton: true})

/** what a data carousel shows: its items, or skeletons while they load */
export const dataList = (
  data: {items: unknown[]; loading: boolean},
  fallback: number
): unknown[] =>
  data.loading ? Array.from({length: Math.max(1, fallback)}, () => SKELETON) : data.items

/** a data carousel's key per item (the index when it has no key function) */
export const keysOf = (
  items: unknown[],
  key?: string | ((item: any, index: number) => string | number)
): string[] =>
  items.map((item, index) =>
    item === SKELETON
      ? `__holo-skeleton-${index}`
      : String(
          typeof key === 'function'
            ? key(item, index)
            : key && item != null
              ? (item as Record<string, unknown>)[key] ?? index
              : index
        )
  )

// --- the model -------------------------------------------------------

/** index, page and end flags for a track. Pure. */
export const placeTrack = (
  virtualDom: VirtualDomState,
  track: number
): Pick<VirtualDomState, 'track' | 'index' | 'page' | 'endOfSlide'> => {
  const count = virtualDom.noOfChildren
  const index = virtualDom.wrap
    ? wrapIndex(track, count)
    : clampIndex(track, virtualDom.maxIndex)
  const endOfSlide = virtualDom.wrap
    ? 0
    : index <= 0
      ? 1
      : index >= virtualDom.maxIndex
        ? -1
        : 0
  return {
    track: virtualDom.wrap ? track : Math.max(0, Math.min(track, virtualDom.maxIndex)),
    index,
    page: pageOf(index, virtualDom.maxIndex, virtualDom.step, virtualDom.wrap),
    endOfSlide
  }
}

/**
 * Set a carousel's geometry: how many items, how many fit, whether it
 * wraps. Keeps the current item where it was. Pure.
 */
export const geometryOf = (
  virtualDom: VirtualDomState,
  count: number,
  slots: number,
  wrap: boolean
): Partial<VirtualDomState> => {
  const fit = Math.max(1, Math.min(slots, count || 1))
  const maxIndex = wrap ? Math.max(0, count - 1) : Math.max(0, count - fit)
  const io = virtualDom.io
  // a page by default; one item for effects that show one in the middle
  const page = io.effect === 'slide' ? fit : 1
  const step = io.step > 0 ? Math.min(io.step, Math.max(1, wrap ? count : maxIndex)) : page
  return {
    noOfChildren: count,
    numberOfSlots: fit,
    maxIndex,
    wrap,
    step,
    pages: pagesOf(maxIndex, step, wrap, count)
  }
}

/**
 * Move a carousel to a track - every navigation ends here. Draws it
 * (when it has an element) and emits `change` when the item changed.
 */
export const setTrack = (
  path: string,
  track: number,
  animate = true,
  speed: number | null = null
): boolean => {
  const instance = holoStore.getInstance(path)
  if (!instance) return false
  const virtualDom = instance.virtualDom
  const before = virtualDom.index

  const travel = Math.abs(track - virtualDom.shown)
  holoStore.updateVirtualDom(path, placeTrack(virtualDom, track))
  virtualDom.moveDuration = animate ? glideDuration(virtualDom.duration, travel) : 0
  virtualDom.launch = animate ? speed : null
  holoStore.updateStyle(path, animate)
  placeCarousel(path)
  syncCarousel(path)
  if (virtualDom.wrap) normalizeTrack(path, animate ? virtualDom.moveDuration : 0)

  if (virtualDom.index !== before) {
    instance.branch.call(EVENTS.CHANGE, changeOf(virtualDom, path))
  }
  return true
}

/** go to an item index (the shortest way round when it wraps) */
export const goTo = (
  path: string,
  target: number,
  animate = true,
  speed: number | null = null
): boolean => {
  const virtualDom = holoStore.getVirtualDom(path)
  if (!virtualDom) return false
  if (!virtualDom.wrap) return setTrack(path, clampIndex(target, virtualDom.maxIndex), animate, speed)
  const base = Math.round(virtualDom.track)
  const delta = shortestDelta(wrapIndex(base, virtualDom.noOfChildren), target, virtualDom.noOfChildren)
  return setTrack(path, base + delta, animate, speed)
}

/**
 * next / prev by `step`. Wrapping carousels keep counting; others stop
 * at an end (a nudge) or rewind with loop.
 */
export const moveBy = (path: string, direction: 1 | -1, loop?: boolean): void => {
  const instance = holoStore.getInstance(path)
  if (!instance) return
  const {virtualDom, branch} = instance
  if (virtualDom.noOfChildren <= 1) return

  if (virtualDom.wrap) {
    branch.call(EVENTS.GO_TO, {
      track: Math.round(virtualDom.track) + direction * virtualDom.step
    })
    return
  }
  const target = stepIndex(
    virtualDom.index,
    direction,
    virtualDom.step,
    virtualDom.maxIndex,
    loop ?? virtualDom.io.loop > 0
  )
  if (target < 0) branch.call(EVENTS.SHAKE, {direction})
  else branch.call(EVENTS.GO_TO, {index: target})
}

/**
 * Previous slide operator
 */
export const prvSlide = (path: string, loop?: boolean): void => moveBy(path, -1, loop)

/**
 * Next slide operator
 */
export const nxtSlide = (path: string, loop?: boolean): void => moveBy(path, 1, loop)

/**
 * Jump to first slide operator
 */
export const firstSlide = (path: string): void => {
  holoStore.getBranch(path)?.call(EVENTS.GO_TO, {index: 0})
}

/**
 * Jump to last slide operator
 */
export const lastSlide = (path: string): void => {
  const virtualDom = holoStore.getVirtualDom(path)
  if (virtualDom) holoStore.getBranch(path)?.call(EVENTS.GO_TO, {index: virtualDom.maxIndex})
}

/**
 * Animate slides forward (auto-play always goes round)
 */
export const animateSlideForward = (path: string): void => {
  holoStore.getBranch(path)?.call(EVENTS.NEXT_SLIDE, {loop: true})
}

/**
 * Animate slides backward
 */
export const animateSlideBackward = (path: string): void => {
  holoStore.getBranch(path)?.call(EVENTS.PREV_SLIDE, {loop: true})
}

/**
 * Auto-play tick
 */
export const animate = (path: string): void => {
  if (holoStore.isHeld(path)) return
  const instance = holoStore.getInstance(path)
  if (!instance) return
  instance.branch.call(
    instance.virtualDom.io.animateDirection < 0
      ? EVENTS.ANIMATE_BACKWARD
      : EVENTS.ANIMATE_FORWARD
  )
}

/**
 * Snap to the nearest item from wherever the track is
 */
export const snap = (path: string): void => {
  const virtualDom = holoStore.getVirtualDom(path)
  if (virtualDom) setTrack(path, Math.round(virtualDom.track))
}

/**
 * Bring an item into view (the smallest move that shows all of it)
 */
export const reveal = (path: string, position: number, animate = true): void => {
  const virtualDom = holoStore.getVirtualDom(path)
  if (!virtualDom || position < 0) return
  if (virtualDom.wrap) {
    if (virtualDom.numberOfSlots === 1 || virtualDom.io.effect !== 'slide') {
      goTo(path, position, animate)
      return
    }
    // on a wrapping strip: is it already among the visible ones?
    const offset = wrapIndex(position - virtualDom.index, virtualDom.noOfChildren)
    if (offset < virtualDom.numberOfSlots) return
    const back = virtualDom.noOfChildren - offset
    setTrack(
      path,
      Math.round(virtualDom.track) +
        (back <= offset - virtualDom.numberOfSlots + 1 ? -back : offset - virtualDom.numberOfSlots + 1),
      animate
    )
    return
  }
  const centred = virtualDom.io.effect !== 'slide'
  if (centred) {
    goTo(path, position, animate)
    return
  }
  const last = virtualDom.index + virtualDom.numberOfSlots - 1
  if (position < virtualDom.index) goTo(path, position, animate)
  else if (position > last) goTo(path, position - virtualDom.numberOfSlots + 1, animate)
}

/**
 * Mouse wheel / trackpad: one step per gesture (the channel is throttled)
 */
export const wheeler = (path: string, delta: number): void => {
  if (delta < 0) prvSlide(path)
  else if (delta > 0) nxtSlide(path)
}

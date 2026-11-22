//src/components/holo-touch.ts

import {log} from 'cyre'
import {holoStore} from '../core/state'
import {setHold} from '../core/event-manager'
import {glideDistance, releaseVelocity, setTrack} from './holo-essentials'
import {axisSize, trackMovedBy} from './orientation-handler'
import {placeCarousel, stopMove} from './holo-render'
import {CSS_CLASSES, EVENTS, PATH_ATTRIBUTE} from '../config/holo-config'
import type {TouchState} from '../types/interface'

/*
  Gestures, for mouse, touch, pen (Pointer Events) and trackpads (wheel
  events), all working in items so every effect moves the same way.

  Pointer: a press is a tap, a long press, a drag along the carousel or
  a move across it, decided once the pointer has moved past a threshold
  that suits the pointer (4px mouse, 10px touch) by the angle of the
  move: within 35° of the axis it is a drag, beyond 55° it is across
  (the page scrolls, or a parent carousel on that axis takes it), and in
  between Holo waits for more movement.

  - A drag follows the pointer 1:1 and stretches past the ends.
  - On release it glides on from where it was let go, slowing down
    evenly (a faster flick goes further), and lands on an item. A short
    quick flick always moves at least one. momentum: false stops it
    where it was let go instead. The swipe is reported.
  - A nested carousel at its edge hands the drag to its parent.
  - Taps, double taps and long presses are reported on their own channels.
  - Clicks right after a drag or long press are swallowed.

  Trackpad: a two-finger swipe along the carousel drags it live and
  lands when the fingers lift. macOS keeps sending momentum events after
  that; they are the gesture's tail and are ignored, so one swipe is one
  move. A swipe across the carousel stays the page's scroll. A mouse
  wheel (notched) steps, with the wheel option.
*/

const axisOf = (vertical: boolean, x: number, y: number) =>
  vertical ? {main: y, cross: x} : {main: x, cross: y}

const slopFor = (pointerType: string): number =>
  pointerType === 'mouse' ? holoStore.gesture().SLOP_MOUSE : pointerType === 'touch' ? holoStore.gesture().SLOP_TOUCH : holoStore.gesture().SLOP

/** the angle (deg) of a move from the carousel's axis */
export const moveAngle = (main: number, cross: number): number =>
  (Math.atan2(Math.abs(cross), Math.abs(main)) * 180) / Math.PI

/**
 * What a move is so far: 'wait' (too short or too diagonal to tell),
 * 'main' (along the axis) or 'cross'. Pure.
 */
export const classifyMove = (main: number, cross: number, slop: number): 'wait' | 'main' | 'cross' => {
  const distance = Math.hypot(main, cross)
  if (distance < slop) return 'wait'
  const angle = moveAngle(main, cross)
  if (angle <= holoStore.gesture().AXIS_LOCK) return 'main'
  if (angle >= holoStore.gesture().AXIS_CROSS) return 'cross'
  // diagonal: wait for a clearer move, then take the larger component
  if (distance < slop * 2.5) return 'wait'
  return Math.abs(main) >= Math.abs(cross) ? 'main' : 'cross'
}

/** a swipe's direction from its move */
export const swipeDirection = (dx: number, dy: number): 'left' | 'right' | 'up' | 'down' =>
  Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'

/**
 * Where a released drag lands (in items): from where it was let go, plus
 * the glide its speed carries it (momentum), on the nearest item. A
 * quick flick that would land back where it started moves one item that
 * way instead. Pure.
 */
export const landing = (
  startTrack: number,
  track: number,
  velocity: number,
  size: number,
  momentum: boolean
): number => {
  const glide = momentum ? glideDistance(velocity, size) : 0
  const target = Math.round(track + glide)
  const start = Math.round(startTrack)
  const flick = Math.abs(velocity * size) >= holoStore.gesture().FLICK
  if (target === start && flick) return start + Math.sign(velocity)
  return target
}

/**
 * Where a trackpad swipe lands when its events stop: the nearest item,
 * or the next one if it moved far enough towards it to mean it. Pure.
 */
export const wheelLanding = (startTrack: number, track: number): number => {
  const start = Math.round(startTrack)
  const target = Math.round(track)
  const moved = track - startTrack
  if (target === start && Math.abs(moved) >= holoStore.gesture().WHEEL_INTENT) return start + Math.sign(moved)
  return target
}

/**
 * How a trackpad gesture's event sizes are trending. Fingers on the pad
 * give uneven deltas; once they lift, the system's momentum shrinks them
 * event by event, and a new swipe makes them grow again. Pure.
 */
export const wheelTrend = (
  prev: number,
  size: number,
  falling: number,
  rising: number
): {falling: number; rising: number} => ({
  falling: prev && size < prev * 0.97 ? falling + 1 : size > prev * 1.03 ? 0 : falling,
  rising: prev && size > prev * 1.25 && size > 2 ? rising + 1 : 0
})

/** draw the dragged position at most once per frame */
const scheduleFrame = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance || instance.frame) return
  holoStore.setFrame(
    path,
    requestAnimationFrame(() => {
      holoStore.setFrame(path, 0)
      placeCarousel(path)
    })
  )
}

const cancelFrame = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.frame) return
  cancelAnimationFrame(instance.frame)
  holoStore.setFrame(path, 0)
}

const clearLongPress = (path: string): void => {
  const touchState = holoStore.getInstance(path)?.touchState
  if (touchState?.longPressTimer) {
    clearTimeout(touchState.longPressTimer)
    touchState.longPressTimer = 0
  }
}

/** the item index under an event target in a carousel, or -1 */
const indexAt = (path: string, target: EventTarget | null): number => {
  const container = holoStore.getDom(path)?.container
  let slot = target as HTMLElement | null
  while (slot && slot.parentElement !== container) slot = slot.parentElement
  if (!slot || !container) return -1
  return slot.dataset.index !== undefined
    ? Number(slot.dataset.index)
    : Array.prototype.indexOf.call(container.children, slot)
}

/** the drag begins: capture the pointer, stop animating, hold auto-play */
const beginDrag = (path: string, pointerId: number): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom) return
  clearLongPress(path)
  instance.touchState.dragging = true
  instance.Dom.carousel.classList.add(CSS_CLASSES.DRAGGING)
  try {
    instance.Dom.container.setPointerCapture(pointerId)
  } catch {
    // the pointer may already be gone
  }
  holoStore.updateStyle(path, false)
  setHold(path, 'pointer', true)
}

/**
 * Handle pointer down on a carousel
 */
export const _touchStart = (e: PointerEvent, path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom) {
    log.error('@_touchStart: unknown carousel ' + path)
    return
  }

  const {io} = instance.virtualDom
  const mouse = e.pointerType === 'mouse'
  if (!io.enabled || (mouse ? e.button !== 0 : !io.swipe)) return
  // a nested carousel took this press already (events bubble inner → outer)
  if (holoStore.getSystem().pressedPath) return

  const onButton = !!(e.target as Element).closest?.('button, a, input, select, textarea')
  // a mouse would otherwise start dragging the image or selecting text
  if (mouse && io.drag && !onButton) e.preventDefault()

  cancelFrame(path)
  // a press on a gliding carousel catches it where it is
  const caught = stopMove(path)
  if (caught) instance.virtualDom.track = instance.virtualDom.shown
  const now = performance.now()
  const touchState = instance.touchState
  holoStore.updateTouchState(path, {
    pressed: true,
    dragging: false,
    cancelled: false,
    longPressed: false,
    caught,
    pointerType: e.pointerType,
    pointerId: e.pointerId,
    positionX: e.clientX,
    positionY: e.clientY,
    currentX: e.clientX,
    currentY: e.clientY,
    startTrack: instance.virtualDom.shown,
    TouchStartTimeStamp: now,
    samples: [[now, instance.virtualDom.shown]]
  })
  holoStore.updateSystem({pressedPath: path})

  // a still press becomes a long press
  clearLongPress(path)
  touchState.longPressTimer = setTimeout(() => {
    const current = holoStore.getInstance(path)
    if (!current) return
    const state = current.touchState
    state.longPressTimer = 0
    if (!state.pressed || state.dragging || state.cancelled) return
    state.longPressed = true
    state.suppressUntil = performance.now() + holoStore.gesture().CLICK_GUARD + 600
    current.branch.call(EVENTS.LONG_PRESS, {
      index: indexAt(path, e.target),
      x: state.currentX,
      y: state.currentY
    })
  }, holoStore.gesture().LONG_PRESS)
}

/** can this carousel move further that way (for a handoff) */
const canMove = (path: string, direction: number): boolean => {
  const virtualDom = holoStore.getVirtualDom(path)
  if (!virtualDom || virtualDom.maxIndex <= 0) return false
  if (virtualDom.wrap) return true
  return direction < 0 ? virtualDom.index > 0 : virtualDom.index < virtualDom.maxIndex
}

/** pass the drag up to the parent carousel */
const handOff = (from: string, to: string, e: PointerEvent): void => {
  const child = holoStore.getInstance(from)
  const parent = holoStore.getInstance(to)
  if (!child || !parent) return
  _release(from)
  child.touchState.suppressUntil = performance.now() + holoStore.gesture().CLICK_GUARD
  setTrack(from, Math.round(child.touchState.startTrack)) // spring back

  const now = performance.now()
  holoStore.updateTouchState(to, {
    pressed: true,
    dragging: false,
    cancelled: false,
    longPressed: false,
    pointerType: e.pointerType,
    pointerId: e.pointerId,
    positionX: e.clientX,
    positionY: e.clientY,
    currentX: e.clientX,
    currentY: e.clientY,
    startTrack: parent.virtualDom.shown,
    TouchStartTimeStamp: now,
    samples: [[now, parent.virtualDom.shown]]
  })
  holoStore.updateSystem({pressedPath: to})
  beginDrag(to, e.pointerId)
}

/**
 * Handle pointer movement (document-wide while pressed)
 */
export const _touchMove = (e: PointerEvent): void => {
  const path = holoStore.getSystem().pressedPath
  if (!path) return
  const instance = holoStore.getInstance(path)
  if (!instance) return
  const {touchState, virtualDom} = instance
  if (e.pointerId !== touchState.pointerId) return
  touchState.currentX = e.clientX
  touchState.currentY = e.clientY
  if (touchState.cancelled || touchState.longPressed) return

  const vertical = !!virtualDom.io.orientation
  const {main, cross} = axisOf(
    vertical,
    e.clientX - touchState.positionX,
    e.clientY - touchState.positionY
  )

  if (!touchState.dragging) {
    const kind = classifyMove(main, cross, slopFor(touchState.pointerType))
    if (kind === 'wait') return
    clearLongPress(path)
    if (kind === 'cross') {
      // across this carousel: a parent on that axis takes it, else the page
      const parent = instance.parent ? holoStore.getInstance(instance.parent) : null
      if (
        parent &&
        !!parent.virtualDom.io.orientation !== vertical &&
        canMove(parent.path, -Math.sign(cross))
      ) {
        handOff(path, parent.path, e)
        return
      }
      touchState.cancelled = true // watch it to the end, to report the swipe
      return
    }
    const mouse = touchState.pointerType === 'mouse'
    const allowed = mouse ? virtualDom.io.drag : virtualDom.io.swipe
    if (!allowed || (virtualDom.maxIndex <= 0 && !instance.parent)) {
      touchState.cancelled = true
      return
    }
    beginDrag(path, e.pointerId)
  }

  if (e.cancelable) e.preventDefault()

  const size = axisSize(virtualDom) || 1
  const track = trackMovedBy(virtualDom, touchState.startTrack, -main)

  // a nested carousel at its edge passes the drag to its parent
  if (!virtualDom.wrap && instance.parent) {
    const over = track < 0 ? track : track > virtualDom.maxIndex ? track - virtualDom.maxIndex : 0
    const parent = holoStore.getInstance(instance.parent)
    if (
      parent &&
      over !== 0 &&
      Math.abs(over) * size > holoStore.gesture().SLOP * 4 &&
      !!parent.virtualDom.io.orientation === vertical &&
      canMove(parent.path, Math.sign(over))
    ) {
      handOff(path, parent.path, e)
      return
    }
  }

  virtualDom.track = track
  const now = performance.now()
  touchState.samples.push([now, track])
  if (touchState.samples.length > 12) touchState.samples.shift()
  scheduleFrame(path)
}

/** end a press without landing anywhere */
const _release = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance) return
  const {touchState, Dom} = instance
  clearLongPress(path)
  try {
    if (Dom?.container.hasPointerCapture?.(touchState.pointerId)) {
      Dom.container.releasePointerCapture(touchState.pointerId)
    }
  } catch {
    // nothing captured
  }
  Dom?.carousel.classList.remove(CSS_CLASSES.DRAGGING)
  touchState.pressed = false
  touchState.dragging = false
  if (holoStore.getSystem().pressedPath === path) holoStore.updateSystem({pressedPath: null})
  setHold(path, 'pointer', false)
}

/**
 * Handle pointer up / cancel
 */
export const _touchEnd = (e: PointerEvent): void => {
  const path = holoStore.getSystem().pressedPath
  if (!path) return
  const instance = holoStore.getInstance(path)
  if (!instance) return
  const {touchState, virtualDom, branch} = instance
  if (e.pointerId !== touchState.pointerId) return

  const dragged = touchState.dragging
  const cancelled = touchState.cancelled
  const longPressed = touchState.longPressed
  const now = performance.now()
  const dx = touchState.currentX - touchState.positionX
  const dy = touchState.currentY - touchState.positionY
  const elapsed = now - (touchState.TouchStartTimeStamp || now)
  cancelFrame(path)
  _release(path)

  // a move across the carousel (the page scrolled): report the swipe only
  if (cancelled) {
    if (touchState.caught) {
      touchState.caught = false
      branch.call(EVENTS.GO_TO, virtualDom.wrap ? {track: Math.round(virtualDom.track), speed: 0} : {index: Math.round(virtualDom.track), speed: 0})
    }
    if (Math.hypot(dx, dy) >= holoStore.gesture().SWIPE_MIN) {
      branch.call(EVENTS.SWIPE, {
        direction: swipeDirection(dx, dy),
        distance: Math.round(Math.hypot(dx, dy)),
        velocity: elapsed > 0 ? Math.hypot(dx, dy) / elapsed : 0,
        moved: false
      })
    }
    return
  }

  if (!dragged) {
    // caught mid-glide and let go without dragging: settle on an item
    if (touchState.caught) {
      touchState.caught = false
      touchState.suppressUntil = now + holoStore.gesture().CLICK_GUARD
      if (virtualDom.wrap) branch.call(EVENTS.GO_TO, {track: Math.round(virtualDom.track), speed: 0})
      else branch.call(EVENTS.GO_TO, {index: Math.round(virtualDom.track), speed: 0})
      return
    }
    if (longPressed || e.type === 'pointercancel') return
    // a tap (and maybe the second of a double tap)
    const last = touchState.lastTap
    const tap = {time: now, x: touchState.currentX, y: touchState.currentY}
    const index = indexAt(path, e.target)
    branch.call(EVENTS.TAP, {index, x: tap.x, y: tap.y})
    if (now - last.time <= holoStore.gesture().DOUBLE_TAP && Math.hypot(tap.x - last.x, tap.y - last.y) <= holoStore.gesture().DOUBLE_TAP_DISTANCE) {
      branch.call(EVENTS.DOUBLE_TAP, {index, x: tap.x, y: tap.y})
      touchState.lastTap = {time: 0, x: 0, y: 0}
    } else {
      touchState.lastTap = tap
    }
    return
  }

  touchState.suppressUntil = now + holoStore.gesture().CLICK_GUARD // the click after a drag is not a click

  const size = axisSize(virtualDom) || 1
  const velocity = e.type === 'pointercancel' ? 0 : releaseVelocity(touchState.samples, now)
  const track = virtualDom.track

  branch.call(EVENTS.SWIPE, {
    direction: swipeDirection(dx, dy),
    distance: Math.round(Math.hypot(dx, dy)),
    velocity: Math.abs(velocity * size),
    moved: true
  })

  if (!virtualDom.io.snap) {
    // free: glide by the release speed and stop where it lands
    const landed = track + (virtualDom.io.momentum ? glideDistance(velocity, size) : 0)
    setTrack(path, virtualDom.wrap ? landed : Math.max(0, Math.min(landed, virtualDom.maxIndex)), true, velocity)
    return
  }

  const target = landing(touchState.startTrack, track, velocity, size, !!virtualDom.io.momentum)
  // the landing carries straight on at the speed the drag was let go
  if (virtualDom.wrap) branch.call(EVENTS.GO_TO, {track: target, speed: velocity})
  else branch.call(EVENTS.GO_TO, {index: Math.max(0, Math.min(target, virtualDom.maxIndex)), speed: velocity})
}

// --- trackpad / mouse wheel ------------------------------------------

/** a notched mouse wheel (lines or pages, or big whole steps on one axis) */
export const isNotchedWheel = (e: Pick<WheelEvent, 'deltaMode' | 'deltaX' | 'deltaY'>): boolean =>
  e.deltaMode !== 0 ||
  (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY))

/** forget a trackpad gesture */
const resetWheel = (wheel: TouchState['wheel']): void => {
  wheel.axis = ''
  wheel.main = 0
  wheel.cross = 0
  wheel.prev = 0
  wheel.peak = 0
  wheel.falling = 0
  wheel.rising = 0
}

/**
 * Let go of a trackpad gesture Holo was following and land it.
 * `fling`: the fingers lifted at speed - the glide is projected from that
 * speed (a faster swipe goes further, several items), and the move starts
 * at exactly that speed so there is no pause or kick. Otherwise (a slow
 * drag whose events stopped) it settles on the nearest item.
 */
const landWheel = (path: string, fling: boolean): void => {
  const instance = holoStore.getInstance(path)
  if (!instance) return
  const {touchState, virtualDom, branch, Dom} = instance
  const now = performance.now()

  touchState.dragging = false
  Dom?.carousel.classList.remove(CSS_CLASSES.DRAGGING)
  setHold(path, 'pointer', false)
  touchState.suppressUntil = now + holoStore.gesture().CLICK_GUARD
  cancelFrame(path)

  const size = axisSize(virtualDom) || 1
  const speed = releaseVelocity(touchState.samples, now, fling ? holoStore.gesture().VELOCITY_WINDOW : holoStore.gesture().WHEEL_IDLE + 60)
  const target = fling
    ? landing(touchState.startTrack, virtualDom.track, speed, size, !!virtualDom.io.momentum)
    : wheelLanding(touchState.startTrack, virtualDom.track)
  const moved = virtualDom.track - touchState.startTrack
  if (Math.abs(moved) >= holoStore.gesture().WHEEL_INTENT || fling) {
    branch.call(EVENTS.SWIPE, {
      direction: virtualDom.io.orientation ? (moved > 0 ? 'up' : 'down') : moved > 0 ? 'left' : 'right',
      distance: Math.round(Math.abs(moved) * size),
      velocity: Math.abs(speed * size),
      moved: true
    })
  }
  if (virtualDom.wrap) branch.call(EVENTS.GO_TO, {track: target, speed})
  else branch.call(EVENTS.GO_TO, {index: Math.max(0, Math.min(target, virtualDom.maxIndex)), speed})
}

/** a trackpad gesture's events stopped */
const endWheel = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance) return
  const wheel = instance.touchState.wheel
  if (wheel.timer) clearTimeout(wheel.timer)
  wheel.timer = 0
  const axis = wheel.axis
  resetWheel(wheel)
  if (axis === 'main') landWheel(path, false)
}

/**
 * Wheel events on a carousel: trackpad swipes move it live (momentum
 * included), a notched mouse wheel steps (with the wheel option). What
 * is not the carousel's is left alone - the page (or a parent carousel)
 * gets it.
 */
export const _wheel = (e: WheelEvent, path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance || e.defaultPrevented) return
  const {virtualDom, touchState, branch, Dom} = instance
  const io = virtualDom.io
  if (!io.enabled || holoStore.getSystem().pressedPath) return
  const vertical = !!io.orientation
  const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? virtualDom.viewport || 400 : 1
  const {main, cross} = axisOf(vertical, e.deltaX * scale, e.deltaY * scale)

  // a mouse wheel: one step per notch burst (the channel is throttled)
  if (isNotchedWheel(e)) {
    if (!io.wheel) return
    const delta = vertical ? e.deltaY : e.deltaY || e.deltaX
    const blocked =
      !virtualDom.wrap &&
      !io.loop &&
      ((delta > 0 && virtualDom.index >= virtualDom.maxIndex) || (delta < 0 && virtualDom.index <= 0))
    if (blocked || delta === 0) return
    e.preventDefault()
    branch.call(EVENTS.WHEELER, {delta})
    return
  }

  // a trackpad: a gesture lasts until its events stop
  const wheel = touchState.wheel
  const now = performance.now()
  if (wheel.timer) clearTimeout(wheel.timer)
  wheel.timer = setTimeout(() => endWheel(path), holoStore.gesture().WHEEL_IDLE)
  wheel.last = now

  if (wheel.axis === 'cross') return // the page's

  const amount = Math.abs(main)
  if (wheel.axis === 'glide') {
    // flung: Holo is carrying it - swallow the system's momentum tail,
    // unless a new swipe starts (its events grow again)
    e.preventDefault()
    const trend = wheelTrend(wheel.prev, amount, wheel.falling, wheel.rising)
    wheel.rising = trend.rising
    wheel.prev = amount
    if (wheel.rising < holoStore.gesture().WHEEL_REGRIP) return
    resetWheel(wheel) // a new gesture, taken from this event on
  }

  if (wheel.axis === '') {
    // gather the first few px, then decide whose it is
    wheel.main += main
    wheel.cross += cross
    const kind = classifyMove(wheel.main, wheel.cross, holoStore.gesture().WHEEL_DECIDE)
    if (kind === 'wait') {
      // mostly along the carousel: don't let the page start scrolling
      // the other way meanwhile
      if (Math.abs(wheel.main) >= Math.abs(wheel.cross) && canMove(path, Math.sign(wheel.main) || 1)) e.preventDefault()
      return
    }
    const allowed = vertical ? io.wheel : io.swipe || io.wheel
    if (kind === 'cross' || !allowed || virtualDom.maxIndex <= 0) {
      wheel.axis = 'cross'
      return
    }
    if (!canMove(path, Math.sign(wheel.main))) {
      // at an end: a parent on the same axis takes it
      const parent = instance.parent ? holoStore.getInstance(instance.parent) : null
      if (parent && !!parent.virtualDom.io.orientation === vertical) {
        wheel.axis = 'cross'
        return
      }
    }
    // it's ours: start from where things are drawn (a glide may be running)
    wheel.axis = 'main'
    stopMove(path)
    touchState.startTrack = virtualDom.shown
    touchState.samples = [[now, virtualDom.shown]]
    virtualDom.track = trackMovedBy(virtualDom, virtualDom.shown, wheel.main)
    touchState.dragging = true
    Dom?.carousel.classList.add(CSS_CLASSES.DRAGGING)
    holoStore.updateStyle(path, false)
    setHold(path, 'pointer', true)
    wheel.prev = amount
    wheel.peak = amount
    e.preventDefault()
    scheduleFrame(path)
    return
  }

  e.preventDefault()
  virtualDom.track = trackMovedBy(virtualDom, virtualDom.track, main)
  touchState.samples.push([now, virtualDom.track])
  if (touchState.samples.length > 12) touchState.samples.shift()

  // the fingers lifted at speed (the events now shrink steadily): fling
  const trend = wheelTrend(wheel.prev, amount, wheel.falling, wheel.rising)
  wheel.falling = trend.falling
  wheel.prev = amount
  wheel.peak = Math.max(wheel.peak, amount)
  if (wheel.falling >= holoStore.gesture().WHEEL_DECAY && wheel.peak >= holoStore.gesture().WHEEL_FLING) {
    wheel.axis = 'glide'
    wheel.rising = 0
    landWheel(path, true)
    return
  }
  scheduleFrame(path)
}

/** the carousel element nearest to an event target */
export const nearestCarousel = (target: EventTarget | null): string | null => {
  const element = (target as Element | null)?.closest?.(`[${PATH_ATTRIBUTE}]`)
  return element ? element.getAttribute(PATH_ATTRIBUTE) : null
}

/**
 * Handle click/tap on carousel item
 */
export const _focus = (e: MouseEvent | TouchEvent, path: string): boolean => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom) return false
  let slot: HTMLElement | null = e.target as HTMLElement
  while (slot && slot.parentElement !== instance.Dom.container) slot = slot.parentElement
  if (!slot) return false
  instance.branch.call(EVENTS.ACTIVATE, slot)
  return true
}

/**
 * Setup page-wide pointer listeners (one set for every carousel)
 */
/**
 * While a carousel is being dragged the page must not scroll the other
 * way: touch-action lets the browser pan across the carousel, and a
 * drifting finger would otherwise start it mid-drag.
 */
const lockScroll = (e: TouchEvent): void => {
  const path = holoStore.getSystem().pressedPath
  if (path && e.cancelable && holoStore.getInstance(path)?.touchState.dragging) e.preventDefault()
}

export const setupGlobalTouchListeners = (): (() => void) => {
  const options: AddEventListenerOptions = {passive: false}
  document.addEventListener('touchmove', lockScroll, options)
  document.addEventListener('pointermove', _touchMove, options)
  document.addEventListener('pointerup', _touchEnd)
  document.addEventListener('pointercancel', _touchEnd)

  return () => {
    document.removeEventListener('touchmove', lockScroll, options)
    document.removeEventListener('pointermove', _touchMove, options)
    document.removeEventListener('pointerup', _touchEnd)
    document.removeEventListener('pointercancel', _touchEnd)
    const all = holoStore.getAllInstances()
    for (const path in all) cancelFrame(path)
  }
}

// Export everything as an object for default export
export default {
  _touchStart,
  _touchMove,
  _touchEnd,
  _wheel,
  _focus,
  nearestCarousel,
  setupGlobalTouchListeners
}

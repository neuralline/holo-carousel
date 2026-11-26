//src/components/holo-zoom.ts

/*
    Neural Line
    Reactive carousel - pinch zoom
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import {holoStore} from '../core/state'
import {CSS_CLASSES} from '../config/holo-config'
import {CarouselInstance} from '../types/interface'
import {abortPress} from './holo-touch'

/*
  pinchZoom: two fingers, ctrl+wheel (a trackpad pinch) or a double tap
  zoom into the current item - its [data-zoom] element, else its first
  image, else the item. While zoomed one finger (or the wheel) pans it
  and the carousel does not move; zoomed all the way out, it slides
  again. Moving to another item resets the zoom.
*/

type Point = {x: number; y: number}

interface ZoomState {
  target: HTMLElement | null
  index: number
  scale: number
  x: number
  y: number
  pointers: Map<number, Point>
  pinch: {distance: number; scale: number; mid: Point} | null
  pan: {id: number; from: Point; x: number; y: number} | null
  down: {time: number; at: Point} | null
  lastTap: {time: number; at: Point} | null
  moved: boolean
}

const DOUBLE_TAP = 300
const TAP_SLOP = 10
const TAP_ZOOM = 2.5

const zoomOf = (path: string): ZoomState | undefined =>
  holoStore.getInstance(path)?.meta.zoom as ZoomState | undefined

const maxScale = (instance: CarouselInstance): number => {
  const max = Number(instance.virtualDom.io.pinchZoom) || 0
  return max > 1 ? max : 3
}

const currentSlot = (instance: CarouselInstance): HTMLElement | null => {
  if (!instance.Dom) return null
  const slots = Array.from(instance.Dom.container.children) as HTMLElement[]
  return (
    slots.find(slot => slot.classList.contains(CSS_CLASSES.CURRENT_SLIDE)) ||
    slots.find(slot => slot.dataset.index === String(instance.virtualDom.index)) ||
    slots[instance.virtualDom.index] ||
    null
  )
}

const targetOf = (slot: HTMLElement): HTMLElement =>
  slot.querySelector<HTMLElement>('[data-zoom]') ||
  slot.querySelector<HTMLElement>('img, video, canvas, svg') ||
  slot

const restingTouch = (instance: CarouselInstance): string =>
  instance.virtualDom.io.orientation ? 'pan-x' : 'pan-y'

/** draw the zoom; zoomed all the way out it lets go of the item */
const apply = (instance: CarouselInstance, state: ZoomState): void => {
  const target = state.target
  if (!target || !instance.Dom) return
  const slot = target.closest<HTMLElement>(`.${CSS_CLASSES.ITEM}`) || target
  if (state.scale <= 1.001) {
    target.style.transform = ''
    target.style.transformOrigin = ''
    target.style.transition = ''
    slot.style.overflow = ''
    state.scale = 1
    state.x = 0
    state.y = 0
    instance.Dom.carousel.classList.remove(CSS_CLASSES.ZOOMED)
    instance.Dom.container.style.touchAction = restingTouch(instance)
    return
  }
  target.style.transformOrigin = '0 0'
  target.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`
  slot.style.overflow = 'hidden'
  instance.Dom.carousel.classList.add(CSS_CLASSES.ZOOMED)
  // one finger pans the item now, not the page
  instance.Dom.container.style.touchAction = 'none'
}

/** keep the zoomed item covering its own box */
const clamp = (state: ZoomState): void => {
  const target = state.target
  if (!target) return
  const width = target.offsetWidth
  const height = target.offsetHeight
  state.x = Math.min(0, Math.max(width - state.scale * width, state.x))
  state.y = Math.min(0, Math.max(height - state.scale * height, state.y))
}

/** zoom to `scale` keeping the point under `at` (client px) where it is */
const zoomAt = (instance: CarouselInstance, state: ZoomState, scale: number, at: Point, animate = false): void => {
  const target = state.target
  if (!target) return
  const next = Math.max(1, Math.min(maxScale(instance), scale))
  const box = target.getBoundingClientRect()
  // the box is transformed from origin 0 0: its corner is base + translate
  const localX = at.x - (box.left - state.x)
  const localY = at.y - (box.top - state.y)
  state.x = localX - (next / state.scale) * (localX - state.x)
  state.y = localY - (next / state.scale) * (localY - state.y)
  state.scale = next
  clamp(state)
  target.style.transition = animate ? 'transform 250ms ease' : 'none'
  apply(instance, state)
}

/** the item to zoom: the current one (a new one resets the last) */
const aim = (instance: CarouselInstance, state: ZoomState): HTMLElement | null => {
  if (state.target && state.index === instance.virtualDom.index && state.target.isConnected) return state.target
  if (state.target && state.scale > 1) {
    state.scale = 1
    apply(instance, state)
  }
  const slot = currentSlot(instance)
  state.target = slot ? targetOf(slot) : null
  state.index = instance.virtualDom.index
  state.scale = 1
  state.x = 0
  state.y = 0
  return state.target
}

const pointOf = (e: PointerEvent | WheelEvent): Point => ({x: e.clientX, y: e.clientY})
const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)
const middle = (a: Point, b: Point): Point => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2})

/** a moved carousel lets go of its zoom */
export const resetZoom = (path: string): void => {
  const instance = holoStore.getInstance(path)
  const state = zoomOf(path)
  if (!instance || !state || state.index === instance.virtualDom.index) return
  if (state.target && state.scale > 1) {
    state.scale = 1
    if (state.target) state.target.style.transition = 'transform 200ms ease'
    apply(instance, state)
  }
  state.target = null
  state.index = -1
}

/** is this carousel zoomed in right now */
export const isZoomed = (path: string): boolean => (zoomOf(path)?.scale || 1) > 1

export const setupZoom = (path: string): (() => void) => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom) return () => {}
  const {carousel, container} = instance.Dom
  const state: ZoomState = {
    target: null,
    index: -1,
    scale: 1,
    x: 0,
    y: 0,
    pointers: new Map(),
    pinch: null,
    pan: null,
    down: null,
    lastTap: null,
    moved: false
  }
  instance.meta.zoom = state
  container.style.touchAction = restingTouch(instance)

  const live = (): CarouselInstance | undefined => holoStore.getInstance(path)

  const startPinch = (): void => {
    const [a, b] = Array.from(state.pointers.values())
    state.pinch = {distance: distance(a, b) || 1, scale: state.scale, mid: middle(a, b)}
    state.pan = null
  }

  const onMove = (e: PointerEvent): void => {
    const current = live()
    if (!current || !state.pointers.has(e.pointerId)) return
    const at = pointOf(e)
    state.pointers.set(e.pointerId, at)
    if (state.down && distance(at, state.down.at) > TAP_SLOP) state.moved = true
    if (state.pinch && state.pointers.size >= 2) {
      const [a, b] = Array.from(state.pointers.values())
      const mid = middle(a, b)
      // the fingers pan as they pinch
      state.x += mid.x - state.pinch.mid.x
      state.y += mid.y - state.pinch.mid.y
      state.pinch.mid = mid
      zoomAt(current, state, (state.pinch.scale * distance(a, b)) / state.pinch.distance, mid)
      e.preventDefault()
    } else if (state.pan && state.pan.id === e.pointerId) {
      state.x = state.pan.x + at.x - state.pan.from.x
      state.y = state.pan.y + at.y - state.pan.from.y
      clamp(state)
      if (state.target) state.target.style.transition = 'none'
      apply(current, state)
      e.preventDefault()
    }
  }

  const onUp = (e: PointerEvent): void => {
    const current = live()
    if (!state.pointers.delete(e.pointerId) || !current) return
    if (state.pinch && state.pointers.size < 2) {
      state.pinch = null
      // the finger left on the screen pans on
      const [left] = Array.from(state.pointers.entries())
      if (left && state.scale > 1) state.pan = {id: left[0], from: left[1], x: state.x, y: state.y}
    }
    if (state.pan?.id === e.pointerId) state.pan = null
    if (state.pointers.size) return
    stopWatching()

    // a double tap zooms in there, or back out
    const now = performance.now()
    const at = pointOf(e)
    const tapped = !state.moved && state.down && now - state.down.time < DOUBLE_TAP && e.type === 'pointerup'
    state.down = null
    if (!tapped) {
      state.lastTap = null
      return
    }
    const last = state.lastTap
    if (last && now - last.time <= DOUBLE_TAP && distance(at, last.at) <= TAP_SLOP * 3) {
      state.lastTap = null
      if (!aim(current, state)) return
      if (state.scale > 1) {
        state.scale = 1
        if (state.target) state.target.style.transition = 'transform 250ms ease'
        apply(current, state)
      } else {
        zoomAt(current, state, Math.min(TAP_ZOOM, maxScale(current)), at, true)
      }
    } else {
      state.lastTap = {time: now, at}
    }
  }

  let watching = false
  const watch = (): void => {
    if (watching) return
    watching = true
    window.addEventListener('pointermove', onMove, {passive: false})
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }
  const stopWatching = (): void => {
    if (!watching) return
    watching = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }

  // capture: seen before the carousel's own press, which it may stop
  const onDown = (e: PointerEvent): void => {
    const current = live()
    if (!current || !current.virtualDom.io.enabled) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const at = pointOf(e)
    state.pointers.set(e.pointerId, at)
    watch()
    if (state.pointers.size === 1) {
      state.down = {time: performance.now(), at}
      state.moved = false
    }
    if (state.pointers.size === 2) {
      if (!aim(current, state)) return
      // a pinch, not a drag: the carousel lets go of the first finger
      abortPress(path)
      state.moved = true
      startPinch()
      e.stopPropagation()
      e.preventDefault()
    } else if (state.pointers.size === 1 && state.scale > 1 && aim(current, state) && state.scale > 1) {
      state.pan = {id: e.pointerId, from: at, x: state.x, y: state.y}
      e.stopPropagation()
      e.preventDefault()
    }
  }

  const onWheel = (e: WheelEvent): void => {
    const current = live()
    if (!current) return
    if (e.ctrlKey) {
      // a trackpad pinch (or ctrl + wheel)
      if (!aim(current, state)) return
      e.preventDefault()
      e.stopPropagation()
      zoomAt(current, state, state.scale * Math.exp(-e.deltaY / 100), pointOf(e))
    } else if (state.scale > 1 && state.index === current.virtualDom.index) {
      e.preventDefault()
      e.stopPropagation()
      state.x -= e.deltaX
      state.y -= e.deltaY
      clamp(state)
      if (state.target) state.target.style.transition = 'none'
      apply(current, state)
    }
  }

  // a pan is not a click on the item
  const onClick = (e: MouseEvent): void => {
    if (!state.moved) return
    state.moved = false
    e.stopPropagation()
    e.preventDefault()
  }

  carousel.addEventListener('pointerdown', onDown, true)
  carousel.addEventListener('wheel', onWheel, {capture: true, passive: false})
  carousel.addEventListener('click', onClick, true)

  return () => {
    stopWatching()
    carousel.removeEventListener('pointerdown', onDown, true)
    carousel.removeEventListener('wheel', onWheel, {capture: true} as EventListenerOptions)
    carousel.removeEventListener('click', onClick, true)
    const current = live()
    if (current && state.target) {
      state.scale = 1
      apply(current, state)
    }
    container.style.touchAction = ''
    if (current) delete current.meta.zoom
  }
}

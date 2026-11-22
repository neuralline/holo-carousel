//src/components/holo-render.ts

/*
    Neural Line
    Reactive carousel - renderer
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import {holoStore} from '../core/state'
import {CarouselInstance} from '../types/interface'
import {log} from 'cyre'
import {CSS_CLASSES, EVENTS} from '../config/holo-config'
import {
  _getItemWidthHeight,
  _numberOfSlots,
  SKELETON,
  pagesOf,
  changeOf,
  dataList,
  geometryOf,
  keysOf,
  placeTrack,
  wrapIndex
} from './holo-essentials'
import {
  axisSize,
  fadeOpacity,
  itemAt,
  offsetAt,
  offsetsOf,
  seeded as seededOf,
  ringGeometry,
  stageStyle,
  stripPosition,
  virtualWindow,
  wrappedSlot
} from './orientation-handler'

/*
  Draws the model. One renderer, four effects:

  - slide   the strip moves; items flow in a row (or column)
  - center  the same strip, with the current item in the middle
  - fade    items stacked; the current one is opaque
  - ring    items on a 3D ring that turns
  - coverflow, album, shuffle, flip, cube, zoom: "stage" effects. Items
    are stacked in one place and each is drawn from its distance to the
    track (orientation-handler.ts). A move tweens the track frame by
    frame instead of handing the end state to a CSS transition, so every
    card follows its own path.

  A strip that wraps (infinite loop) or is virtual positions its items
  itself: each sits at its own offset and only the strip moves, so items
  can change place off screen without anything visibly jumping.
*/

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** a registered stage effect (effects.ts) */
const isStage = (effect: string): boolean => holoStore.hasEffect(effect)

/** effects that show one item in the middle */
const isSingle = (effect: string): boolean =>
  effect === 'fade' || effect === 'ring' || isStage(effect)

/** effects that always wrap */
const alwaysWraps = (effect: string): boolean =>
  effect === 'ring' || !!holoStore.getEffect(effect)?.wraps

const BUILT_IN = ['slide', 'center', 'fade', 'ring']

const translate = (vertical: boolean, px: number, z = 0): string =>
  vertical ? `translate3d(0, ${px}px, ${z}px)` : `translate3d(${px}px, 0, ${z}px)`

/** items laid out by Holo instead of by the flow */
const positionsItems = (instance: CarouselInstance): boolean => {
  const {io, wrap} = instance.virtualDom
  return (
    !!io.virtual && !!instance.data
  ) || ((io.effect === 'slide' || io.effect === 'center') && wrap)
}

const slotsOf = (instance: CarouselInstance): HTMLElement[] =>
  instance.Dom ? (Array.from(instance.Dom.container.children) as HTMLElement[]) : []

/** remove the inline styles an effect put on the container and items */
const clearEffect = (instance: CarouselInstance): void => {
  if (!instance.Dom) return
  const {container, carousel} = instance.Dom
  const applied = container.dataset.holoLayout
  if (!applied) return
  for (const name of ['position', 'display', 'height', 'width', 'overflow', 'marginLeft', 'marginTop', 'marginBottom', 'transformStyle', 'transform']) {
    ;(container.style as any)[name] = ''
  }
  carousel.style.perspective = ''
  for (const slot of slotsOf(instance)) {
    for (const name of ['position', 'left', 'top', 'transform', 'opacity', 'gridArea', 'transition', 'zIndex', 'pointerEvents', 'backfaceVisibility', 'transformOrigin', 'visibility']) {
      ;(slot.style as any)[name] = ''
    }
  }
  delete container.dataset.holoLayout
}

// --- data mode ---------------------------------------------------------

/** how many skeletons stand in while items load */
const skeletonCount = (instance: CarouselInstance): number => {
  const io = instance.virtualDom.io
  return io.placeholders || io.slots || (isSingle(io.effect) ? 3 : 6)
}

/** the items a data carousel shows right now (skeletons while loading) */
const listOf = (instance: CarouselInstance): unknown[] =>
  instance.data ? dataList(instance.data, skeletonCount(instance)) : []

/**
 * Mark a slot as loading until its images have arrived (shimmer, pulse
 * or blur-up by the carousel's placeholder option), then as loaded (the
 * images fade in).
 */
export const watchImages = (slot: HTMLElement): void => {
  const images = Array.from(slot.querySelectorAll('img'))
  if (!images.length) return
  const ready = (image: HTMLImageElement) => !!image.getAttribute('src') && image.complete
  const settle = () => {
    if (!images.every(ready)) return
    slot.classList.remove(CSS_CLASSES.LOADING)
    slot.classList.add(CSS_CLASSES.LOADED)
  }
  if (images.every(ready)) {
    slot.classList.remove(CSS_CLASSES.LOADING)
    return
  }
  slot.classList.add(CSS_CLASSES.LOADING)
  slot.classList.remove(CSS_CLASSES.LOADED)
  for (const image of images) {
    if (ready(image)) continue
    // also for images whose src comes later (lazy): load fires then
    image.addEventListener('load', settle, {once: true})
    image.addEventListener('error', settle, {once: true})
  }
}

/** fill one slot: a skeleton, or the item through the app's render */
const fill = (instance: CarouselInstance, item: unknown, index: number, slot: HTMLElement): void => {
  if (item === SKELETON) {
    slot.classList.add(CSS_CLASSES.SKELETON)
    slot.textContent = ''
    return
  }
  slot.classList.remove(CSS_CLASSES.SKELETON)
  instance.data!.render(item, index, slot)
  watchImages(slot)
}

/** a new item arrives: it fades up, a little after the one before it */
const enter = (slot: HTMLElement, order: number): void => {
  slot.style.setProperty('--holo-stagger', String(order))
  slot.classList.add(CSS_CLASSES.ENTER)
  slot.addEventListener('animationend', () => slot.classList.remove(CSS_CLASSES.ENTER), {once: true})
}

const newSlot = (): HTMLElement => {
  const slot = document.createElement('li')
  slot.className = `${CSS_CLASSES.ITEM} ${CSS_CLASSES.TRANSITION}`
  return slot
}


/**
 * Keyed update of a data carousel's slots: a slot per key, reused when
 * the key stays, re-rendered when its item changed, moved into order,
 * emptied (unrender) and removed when its key went.
 */
export const renderItems = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.data || !instance.Dom) return
  if (instance.virtualDom.io.virtual) {
    renderWindow(path)
    return
  }
  const {data} = instance
  const list = listOf(instance)
  const keys = keysOf(list, data.key)
  reconcile(instance.Dom.container, list, keys, data, {
    make: newSlot,
    fill: (item, index, slot) => fill(instance, item, index, slot),
    drop: (slot, item) => {
      if (item !== SKELETON) data.unrender?.(slot, item)
    },
    // items added to a live carousel (or replacing skeletons) fade up
    added: (slot, item, order) => {
      if (instance.loaded && item !== SKELETON) enter(slot, order)
    }
  })
  if (!data.loading) holoStore.updateData(path, {keys})
}

/** what reconcile needs to know about a keyed list's slots */
export interface KeyedRecord {
  slots: Record<string, HTMLElement>
  rendered: Record<string, unknown>
}

export interface KeyedHooks {
  make: () => HTMLElement
  fill: (item: unknown, index: number, slot: HTMLElement) => void
  drop?: (slot: HTMLElement, item: unknown) => void
  /** a slot made for a new key (order among this update's arrivals) */
  added?: (slot: HTMLElement, item: unknown, order: number) => void
}

/**
 * The keyed update every list in Holo uses (carousels and list
 * bindings): one element per key, reused while the key stays, filled
 * again only when its item changed (by identity), moved into order,
 * dropped when its key goes. The record lives in the caller's state.
 */
export const reconcile = (
  container: HTMLElement,
  items: unknown[],
  keys: string[],
  record: KeyedRecord,
  hooks: KeyedHooks
): void => {
  const keep: Record<string, true> = {}
  let arrivals = 0

  keys.forEach((key, index) => {
    keep[key] = true
    const item = items[index]
    let slot = record.slots[key]
    if (!slot) {
      slot = hooks.make()
      record.slots[key] = slot
      hooks.added?.(slot, item, arrivals++)
    }
    if (record.rendered[key] !== item || !(key in record.rendered)) {
      hooks.fill(item, index, slot)
      record.rendered[key] = item
    }
    slot.dataset.key = key
    slot.dataset.index = String(index)
    if (container.children[index] !== slot) {
      container.insertBefore(slot, container.children[index] || null)
    }
  })

  for (const key in record.slots) {
    if (keep[key]) continue
    const slot = record.slots[key]
    hooks.drop?.(slot, record.rendered[key])
    slot.remove()
    delete record.slots[key]
    delete record.rendered[key]
  }
}

/**
 * Virtual window: only the items around the track have a slot; slots
 * that leave the window go back to the pool and are reused.
 */
export const renderWindow = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.data || !instance.Dom) return
  const {data, virtualDom} = instance
  const container = instance.Dom.container
  const list = listOf(instance)
  const count = list.length
  const vertical = !!virtualDom.io.orientation
  const size = axisSize(virtualDom)
  const wanted = virtualWindow(
    virtualDom.shown,
    virtualDom.numberOfSlots,
    Math.max(0, virtualDom.io.buffer),
    count,
    virtualDom.wrap
  )
  const keep: Record<string, true> = {}
  for (const position of wanted) keep[String(position)] = true

  // free what left the window
  for (const key in data.slots) {
    if (keep[key]) continue
    const slot = data.slots[key]
    if (data.rendered[key] !== SKELETON) data.unrender?.(slot, data.rendered[key])
    slot.remove()
    data.pool.push(slot)
    delete data.slots[key]
    delete data.rendered[key]
  }

  for (const position of wanted) {
    const key = String(position)
    const index = itemAt(position, count, virtualDom.wrap)
    const item = list[index]
    let slot = data.slots[key]
    if (!slot) {
      slot = data.pool.pop() || newSlot()
      data.slots[key] = slot
      container.appendChild(slot)
    }
    if (data.rendered[key] !== item || slot.dataset.index !== String(index)) {
      if (key in data.rendered && data.rendered[key] !== SKELETON) data.unrender?.(slot, data.rendered[key])
      fill(instance, item, index, slot)
      data.rendered[key] = item
    }
    slot.dataset.index = String(index)
    slot.dataset.key = key
    slot.style.position = 'absolute'
    slot.style.left = '0'
    slot.style.top = '0'
    slot.style.transition = 'none'
    slot.style.transform = translate(vertical, position * size)
  }
}

/** make sure a virtual carousel has one slot to measure */
const ensureProbe = (instance: CarouselInstance): void => {
  const data = instance.data
  const list = listOf(instance)
  if (!data || !instance.Dom || !list.length) return
  if (instance.Dom.container.children.length) return
  const slot = data.pool.pop() || newSlot()
  fill(instance, list[0], 0, slot)
  data.slots['0'] = slot
  data.rendered['0'] = list[0]
  slot.dataset.index = '0'
  slot.dataset.key = '0'
  instance.Dom.container.appendChild(slot)
}

// --- measure -----------------------------------------------------------

/**
 * Measure a carousel and set its geometry, keeping its current item:
 * item size, how many fit, whether it wraps, the effect's layout. A
 * headless carousel (no element) just counts its items.
 */
export const measureCarousel = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance) return
  const {virtualDom, data, Dom} = instance
  const io = virtualDom.io
  const pagesBefore = virtualDom.pages
  const countBefore = virtualDom.noOfChildren

  if (!Dom) {
    const count = data ? listOf(instance).length : virtualDom.noOfChildren
    const single = isSingle(io.effect)
    const slots = single ? 1 : io.slots || 1
    const wrap =
      (alwaysWraps(io.effect) && count > 1) ||
      (single && io.loop > 0) ||
      (io.loop === 2 && count > slots)
    holoStore.updateVirtualDom(path, geometryOf(virtualDom, count, slots, wrap))
    holoStore.updateVirtualDom(path, placeTrack(virtualDom, virtualDom.wrap ? virtualDom.track : virtualDom.index))
    if (pagesBefore !== virtualDom.pages || countBefore !== virtualDom.noOfChildren) {
      instance.branch.call(EVENTS.CHANGE, changeOf(virtualDom, path))
    }
    return
  }

  const {carousel, container} = Dom
  const vertical = !!io.orientation
  if (!BUILT_IN.includes(io.effect) && !isStage(io.effect)) {
    log.warn(`@HOLO ${path}: effect "${io.effect}" is not registered (registerEffect from holo-carousel/effects) - sliding instead`)
    holoStore.updateVirtualDom(path, {io: {effect: 'slide'} as any})
  }
  const effect = io.effect

  clearEffect(instance)
  if (data) {
    if (io.virtual) ensureProbe(instance)
    else renderItems(path)
  }

  // measure from a clean slate
  carousel.style.width = ''
  carousel.style.height = vertical ? '0px' : ''
  container.style.width = vertical ? '100%' : ''
  carousel.classList.toggle(CSS_CLASSES.VERTICAL, vertical)

  const first = container.children[0] as HTMLElement | undefined
  const {width, height} = _getItemWidthHeight(first || null)
  const size = vertical ? height : width
  const parent = carousel.parentElement
  const fullscreen = typeof document !== 'undefined' && document.fullscreenElement === carousel
  const room = fullscreen
    ? vertical
      ? window.innerHeight
      : window.innerWidth
    : parent
      ? vertical
        ? parent.clientHeight
        : parent.clientWidth
      : 0
  const count = data ? listOf(instance).length : container.children.length

  // mixed-size items (slide only): position by each item's own size
  const sizes =
    effect === 'slide' && !io.virtual && count > 1
      ? slotsOf(instance).map(slot => {
          const box = _getItemWidthHeight(slot)
          return vertical ? box.height : box.width
        })
      : []
  const offsets = sizes.length > 1 && Math.max(...sizes) - Math.min(...sizes) > 1 ? offsetsOf(sizes) : null

  let fit =
    io.slots > 0
      ? io.slots
      : vertical && room < size
        ? Math.min(3, virtualDom.item.max || 3) // parent sizes to its content
        : _numberOfSlots(room, size, virtualDom.item.max || 0)
  const single = isSingle(effect)
  if (single) fit = 1
  fit = Math.max(1, Math.min(fit, count || 1))

  const wrap =
    !offsets &&
    ((alwaysWraps(effect) && count > 1) ||
      (single && io.loop > 0) ||
      (io.loop === 2 && count >= fit + 3))

  let viewport =
    effect === 'slide' ? fit * size : effect === 'fade' ? size : Math.max(room, size)
  // room for scattered / swinging cards above and below
  const margin = holoStore.getEffect(effect)?.margin || 0

  const geometry = geometryOf(virtualDom, count, fit, wrap)
  let length = count * size
  let end = -Math.max(0, count - fit) * size
  let average = size
  if (offsets) {
    // the viewport is the room it has; it ends where the last item ends
    length = offsets[count]
    viewport = Math.min(length, room || length)
    end = -Math.max(0, length - viewport)
    average = length / count
    const visible = Math.max(1, offsets.filter((start, i) => i < count && offsets[i + 1] <= viewport + 0.5).length)
    const maxIndex = Math.max(0, offsets.findIndex(start => start >= length - viewport - 0.5))
    const step = io.step > 0 ? io.step : visible
    Object.assign(geometry, {
      numberOfSlots: visible,
      maxIndex,
      step,
      pages: pagesOf(maxIndex, step)
    })
  }

  holoStore.updateVirtualDom(path, {
    ...geometry,
    item: vertical ? {width, height: average} : {width: average, height},
    offsets,
    viewport,
    duration: reducedMotion() ? 0 : io.transition,
    carousel: vertical ? {width: carousel.clientWidth, height: viewport} : {width: viewport, height},
    container: vertical ? {width: carousel.clientWidth, height: length} : {width: length, height},
    endOfSlidePosition: end
  })

  // the viewport
  if (vertical) carousel.style.height = `${single ? height + margin * 2 : viewport}px`
  else carousel.style.width = `${viewport}px`

  // the effect's layout
  const layout = positionsItems(instance)
    ? 'items'
    : isStage(effect)
      ? 'stage'
      : effect === 'fade' || effect === 'ring'
        ? effect
        : 'flow'
  if (layout !== 'flow') container.dataset.holoLayout = layout
  if (layout === 'items') {
    // items sit at their own offsets, some outside the container's box
    container.style.position = 'relative'
    container.style.overflow = 'visible'
    container.style.display = 'block'
    if (vertical) container.style.height = `${viewport}px`
    else {
      container.style.height = `${height}px`
      container.style.width = `${viewport}px`
    }
    for (const slot of slotsOf(instance)) {
      slot.style.position = 'absolute'
      slot.style.left = '0'
      slot.style.top = '0'
      slot.style.transition = 'none' // a jump to the other side must not animate
    }
  } else if (layout === 'stage') {
    // every item in one place; each is drawn from its distance to the track
    const depth = holoStore.getEffect(effect)?.perspective
    carousel.style.perspective = depth ? `${depth}px` : ''
    container.style.display = 'grid'
    container.style.position = 'relative'
    container.style.overflow = 'visible'
    container.style.transformStyle = 'preserve-3d'
    container.style.width = vertical ? '100%' : `${width}px`
    container.style.height = `${height}px`
    container.style.marginTop = `${margin}px`
    container.style.marginBottom = `${margin}px`
    if (!vertical) container.style.marginLeft = `${Math.max(0, (room - width) / 2)}px`
    const flat = !!holoStore.getEffect(effect)?.backface
    for (const slot of slotsOf(instance)) {
      slot.style.gridArea = '1 / 1'
      slot.style.transition = 'none'
      slot.style.transformOrigin = 'center center'
      slot.style.backfaceVisibility = flat ? 'hidden' : ''
    }
  } else if (layout === 'fade') {
    container.style.display = 'grid'
    for (const slot of slotsOf(instance)) slot.style.gridArea = '1 / 1'
  } else if (layout === 'ring') {
    const {radius, angle} = ringGeometry(count, size)
    carousel.style.perspective = `${Math.max(600, radius * 3)}px`
    container.style.position = 'relative'
    container.style.overflow = 'visible' // overflow would flatten the 3D
    container.style.transformStyle = 'preserve-3d'
    container.style.height = `${height}px`
    container.style.width = vertical ? '100%' : `${width}px`
    if (!vertical) container.style.marginLeft = `${Math.max(0, (room - width) / 2)}px`
    slotsOf(instance).forEach((slot, i) => {
      slot.style.position = 'absolute'
      slot.style.left = '0'
      slot.style.top = '0'
      slot.style.backfaceVisibility = 'hidden'
      slot.style.transition = 'none'
      slot.style.transform = vertical
        ? `rotateX(${-angle * i}deg) translateZ(${radius}px)`
        : `rotateY(${angle * i}deg) translateZ(${radius}px)`
    })
  }

  const track = wrap ? virtualDom.track : virtualDom.index
  const moving = instance.tween
  if (moving && !instance.touchState.dragging && (wrap || moving.to <= virtualDom.maxIndex)) {
    // re-measured mid-move (images loading as a glide reveals them): the
    // move carries on to the same item with the new sizes - it is only
    // redrawn where it is now, never cut short
    drawAt(instance, virtualDom.shown)
  } else {
    // back where it was, without animating the jump
    holoStore.updateVirtualDom(path, placeTrack(virtualDom, wrap ? track : Math.min(track, virtualDom.maxIndex)))
    virtualDom.shown = virtualDom.track
    virtualDom.moveDuration = virtualDom.duration
    virtualDom.launch = null
    holoStore.updateStyle(path, false)
    placeCarousel(path)
  }
  syncCarousel(path)

  if (pagesBefore !== virtualDom.pages || countBefore !== virtualDom.noOfChildren) {
    instance.branch.call(EVENTS.CHANGE, changeOf(virtualDom, path))
  }
}

// --- place -------------------------------------------------------------

const ease = (t: number): number => 1 - Math.pow(1 - t, 3)

/** draw a stage effect at a (fractional) track */
const drawStage = (instance: CarouselInstance, track: number): void => {
  const {virtualDom} = instance
  const io = virtualDom.io
  const context = {
    size: axisSize(virtualDom),
    count: virtualDom.noOfChildren,
    vertical: !!io.orientation
  }
  slotsOf(instance).forEach((slot, i) => {
    const index = slot.dataset.index !== undefined ? Number(slot.dataset.index) : i
    const style = stageStyle(io.effect, index, track, virtualDom.wrap, context)
    slot.style.transform = style.transform
    slot.style.opacity = String(style.opacity)
    slot.style.zIndex = String(style.zIndex)
    slot.style.clipPath = style.clipPath || ''
    slot.style.visibility = style.opacity > 0 ? '' : 'hidden'
    slot.style.pointerEvents = style.opacity > 0.5 && style.zIndex >= 1000 ? '' : 'none'
  })
}

/** past either end a dragged stage stretches (in items) */
const rubberTrackOf = (track: number, max: number): number =>
  track < 0 ? track * 0.3 : track > max ? max + (track - max) * 0.3 : track

/**
 * Draw a carousel at a (fractional) track, whatever its effect. Every
 * frame of every move ends here - nothing is left to CSS transitions, so
 * a move can start from wherever the last one was, at its speed.
 */
const drawAt = (instance: CarouselInstance, track: number): void => {
  const {virtualDom, Dom, touchState} = instance
  if (!Dom) return
  const {container} = Dom
  const io = virtualDom.io
  const vertical = !!io.orientation
  const size = axisSize(virtualDom)
  const count = virtualDom.noOfChildren
  const dragging = touchState.dragging
  virtualDom.shown = track

  if (isStage(io.effect)) {
    drawStage(instance, dragging && !virtualDom.wrap ? rubberTrackOf(track, virtualDom.maxIndex) : track)
    return
  }

  if (io.effect === 'fade') {
    slotsOf(instance).forEach((slot, i) => {
      const opacity = fadeOpacity(i, track, count, virtualDom.wrap)
      slot.style.transition = 'none'
      slot.style.opacity = String(opacity)
      slot.style.zIndex = opacity > 0.5 ? '1' : '0'
      slot.style.pointerEvents = opacity > 0.5 ? '' : 'none'
    })
    return
  }

  if (io.effect === 'ring') {
    const {angle, radius} = ringGeometry(count, size)
    const turn = track * angle
    container.style.transition = 'none'
    container.style.transform = vertical
      ? `translateZ(${-radius}px) rotateX(${turn}deg)`
      : `translateZ(${-radius}px) rotateY(${-turn}deg)`
    return
  }

  // slide / center: move the strip
  const position = stripPosition(virtualDom, track, dragging)
  container.style.transition = 'none'
  container.style.transform = translate(vertical, position, virtualDom.transformZ)
  virtualDom.transformX = vertical ? 0 : position
  virtualDom.transformY = vertical ? position : 0

  if (instance.data && io.virtual) {
    renderWindow(instance.path)
  } else if (virtualDom.wrap) {
    // each item at the copy of its place nearest the view
    slotsOf(instance).forEach((slot, i) => {
      const at = wrappedSlot(i, track, count, virtualDom.numberOfSlots)
      slot.style.transform = translate(vertical, at * size)
    })
  }
}

/** stop a running move where it is */
export const stopMove = (path: string): boolean => {
  const instance = holoStore.getInstance(path)
  if (!instance?.tween) return false
  if (instance.tween.frame) cancelAnimationFrame(instance.tween.frame)
  instance.tween = null
  return true
}

/**
 * Where a move is at time t (0..1). With a launch speed (m0 = the speed
 * the drag was released at, times the move's length) it is a cubic
 * Hermite curve: it leaves at exactly that speed and arrives at rest, so
 * a released drag carries straight on into its landing. Without one it
 * eases out. Pure.
 */
export const moveAt = (t: number, delta: number, launch: number | null): number =>
  launch !== null
    ? (t * t * t - 2 * t * t + t) * launch + (-2 * t * t * t + 3 * t * t) * delta
    : delta * ease(t)

/**
 * Animate a carousel's drawn track to `to`. `speed` (items/ms) is the
 * speed it is already moving at, e.g. a released drag.
 */
const animateTo = (
  path: string,
  to: number,
  duration: number,
  speed: number | null = null,
  done?: () => void
): void => {
  const instance = holoStore.getInstance(path)
  if (!instance) return
  stopMove(path)
  const from = instance.virtualDom.shown
  const delta = to - from
  if (!delta || duration <= 0) {
    drawAt(instance, to)
    done?.()
    return
  }
  // carry the speed on only when it already heads that way; keep the
  // curve from overshooting (launch ≤ 3·delta) by shortening the move
  let length = duration
  let launch: number | null = null
  if (speed !== null) {
    // continuing a gesture: the curve only slows down from the moment it
    // is let go (a Hermite with launch between 1.5 and 3 times the
    // distance never speeds up and never overshoots). A short settle is
    // quick; a long glide takes the time its speed needs.
    const span = Math.abs(delta)
    const base = instance.virtualDom.duration || duration
    const cap = Math.min(holoStore.gesture().GLIDE_MAX_DURATION, Math.max(duration, base * Math.max(0.45, Math.sqrt(span))))
    const heading = speed && Math.sign(speed) === Math.sign(delta) ? Math.abs(speed) : 0
    length = heading ? Math.min(cap, Math.max(140, (2 * span) / heading)) : Math.min(cap, base * Math.max(0.45, Math.sqrt(span)))
    if (span < 1) length = Math.min(length, base * Math.max(0.45, Math.sqrt(span)))
    const leave = Math.max(1.5 * span, Math.min(3 * span, heading * length))
    launch = Math.sign(delta) * leave
  }
  const tween = {from, to, start: performance.now(), duration: length, frame: 0}
  const step = (now: number) => {
    const current = holoStore.getInstance(path)
    if (!current || current.tween !== tween) return
    const t = Math.min(1, (now - tween.start) / tween.duration)
    drawAt(current, t < 1 ? tween.from + moveAt(t, delta, launch) : tween.to)
    if (t < 1) tween.frame = requestAnimationFrame(step)
    else {
      current.tween = null
      done?.()
    }
  }
  instance.tween = tween
  tween.frame = requestAnimationFrame(step)
}

/**
 * Draw the carousel at its track: straight away, or - when the move
 * animates - from where it is drawn now, carrying on any launch speed.
 */
export const placeCarousel = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom) return
  const {virtualDom, touchState} = instance
  const speed = virtualDom.launch
  virtualDom.launch = null
  if (touchState.dragging || !instance.updateStyle || virtualDom.moveDuration <= 0) {
    stopMove(path)
    drawAt(instance, virtualDom.track)
    return
  }
  animateTo(path, virtualDom.track, virtualDom.moveDuration, speed)
}

/** the bump at an end with nothing further: out a little and back */
export const nudgeCarousel = (path: string, direction: 1 | -1, px: number): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom || instance.virtualDom.duration <= 0) return
  const size = axisSize(instance.virtualDom) || 1
  const track = instance.virtualDom.track
  animateTo(path, track + (direction * px) / size, 140, null, () =>
    animateTo(path, track, Math.min(360, instance.virtualDom.duration))
  )
}

/**
 * After a move on a wrapping carousel, bring the track back to 0..count
 * once the transition is over - nothing visibly changes, the numbers
 * just stay small.
 */
export const normalizeTrack = (path: string, delay: number): void => {
  const instance = holoStore.getInstance(path)
  if (!instance) return
  if (instance.settleTimer) clearTimeout(instance.settleTimer)
  instance.settleTimer = setTimeout(() => {
    const current = holoStore.getInstance(path)
    if (!current) return
    current.settleTimer = 0
    const {virtualDom, touchState} = current
    const count = virtualDom.noOfChildren
    if (!virtualDom.wrap || touchState.dragging || count <= 0) return
    if (virtualDom.track >= 0 && virtualDom.track < count) return
    if (current.tween) {
      normalizeTrack(path, 60) // still animating: try again shortly
      return
    }
    const shift = Math.floor(virtualDom.track / count) * count
    virtualDom.track -= shift
    virtualDom.shown -= shift
    drawAt(current, virtualDom.track)
  }, delay + 20)
}

// --- sync --------------------------------------------------------------

/**
 * Reflect the position in the DOM: which items are on screen (the rest
 * are hidden from screen readers and taken out of the tab order), slide
 * labels, and the prev/next buttons and dots.
 */
export const syncCarousel = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom) return
  const {Dom, virtualDom} = instance
  const count = virtualDom.noOfChildren
  const io = virtualDom.io
  const centred = io.effect !== 'slide'
  const reach = centred ? Math.floor((virtualDom.numberOfSlots - 1) / 2) : 0

  const isVisible = (index: number): boolean => {
    if (centred) {
      const distance = virtualDom.wrap
        ? Math.min(wrapIndex(index - virtualDom.index, count), wrapIndex(virtualDom.index - index, count))
        : Math.abs(index - virtualDom.index)
      return distance <= reach
    }
    if (virtualDom.offsets) {
      // mixed sizes: wholly inside the viewport at the current position
      const offsets = virtualDom.offsets
      const start = Math.min(offsetAt(offsets, virtualDom.index), -virtualDom.endOfSlidePosition)
      return offsets[index] >= start - 0.5 && offsets[index + 1] <= start + virtualDom.viewport + 0.5
    }
    const offset = virtualDom.wrap
      ? wrapIndex(index - virtualDom.index, count)
      : index - virtualDom.index
    return offset >= 0 && offset < virtualDom.numberOfSlots
  }

  slotsOf(instance).forEach((slot, i) => {
    const index = slot.dataset.index !== undefined ? Number(slot.dataset.index) : i
    const visible = isVisible(index)
    slot.classList.toggle(CSS_CLASSES.VISIBLE, visible)
    // the current slide: builds play in it, Ken Burns drifts in it
    const current = index === virtualDom.index
    if (current && io.builds && !slot.classList.contains(CSS_CLASSES.CURRENT_SLIDE)) {
      // each [data-build] comes in after the one before it
      slot.querySelectorAll<HTMLElement>('[data-build]').forEach((element, order) => {
        if (!element.style.getPropertyValue('--build')) element.style.setProperty('--build', String(order))
      })
    }
    slot.classList.toggle(CSS_CLASSES.CURRENT_SLIDE, current)
    if (io.effect === 'kenburns') {
      if (current && !slot.classList.contains(CSS_CLASSES.BURNING)) {
        slot.style.setProperty('--holo-kb-x', `${(seededOf(index) - 0.5) * 8}%`)
        slot.style.setProperty('--holo-kb-y', `${(seededOf(index + 5) - 0.5) * 8}%`)
        slot.style.setProperty('--holo-kb-from', index % 2 ? '1.15' : '1')
        slot.style.setProperty('--holo-kb-to', index % 2 ? '1' : '1.15')
        // drift for as long as the slide is shown (the auto-play interval)
        const interval = io.animate > 1 ? io.animate : io.duration || 5000
        slot.style.setProperty('--holo-progress-duration', `${io.animate ? interval + 1500 : 9000}ms`)
      }
      slot.classList.toggle(CSS_CLASSES.BURNING, current)
    }
    // presets give their items their own roles (tabpanel, step, page)
    if (!slot.hasAttribute('data-holo-role')) {
      slot.setAttribute('role', 'group')
      slot.setAttribute('aria-roledescription', 'slide')
      slot.setAttribute('aria-label', `${index + 1} of ${count}`)
    }
    if (visible) {
      slot.removeAttribute('aria-hidden')
      slot.removeAttribute('inert')
    } else {
      slot.setAttribute('aria-hidden', 'true')
      slot.setAttribute('inert', '')
    }
  })

  const controls = Dom.controls
  if (!controls) return
  const loop = virtualDom.wrap || io.loop > 0
  controls.root.hidden = virtualDom.maxIndex <= 0
  controls.prev.disabled = !loop && virtualDom.index <= 0
  controls.next.disabled = !loop && virtualDom.index >= virtualDom.maxIndex

  // dots, or "3 / 18" when there are more pages than dots fit
  const fitDots = Math.floor((Dom.carousel.clientWidth || virtualDom.viewport || 0) / 16) - 6
  const counter = virtualDom.pages > Math.max(3, fitDots)
  const mode = counter ? 'count' : 'dots'
  const dots = controls.dots
  if (dots.dataset.mode !== mode || (!counter && dots.childElementCount !== virtualDom.pages)) {
    dots.dataset.mode = mode
    dots.textContent = ''
    if (!counter) {
      for (let page = 0; page < virtualDom.pages; page++) {
        const dot = document.createElement('button')
        dot.type = 'button'
        dot.className = CSS_CLASSES.DOT
        dot.dataset.page = String(page)
        dot.setAttribute('aria-label', `Go to page ${page + 1} of ${virtualDom.pages}`)
        dots.appendChild(dot)
      }
    }
  }
  if (counter) {
    dots.textContent = `${virtualDom.page + 1} / ${virtualDom.pages}`
    return
  }
  for (let page = 0; page < dots.children.length; page++) {
    const on = page === virtualDom.page
    dots.children[page].classList.toggle(CSS_CLASSES.DOT_ACTIVE, on)
    if (on) dots.children[page].setAttribute('aria-current', 'true')
    else dots.children[page].removeAttribute('aria-current')
  }
}

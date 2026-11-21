//src/components/holo-touch.ts

import {log} from 'cyre'
import {holoStore} from '../core/state'
import {setHold} from '../core/event-manager'
import {
  releaseIndex,
  releaseVelocity,
  rubberBand,
  goTo,
  renderState,
  changeOf,
  nearestIndex
} from './holo-essentials'
import {CSS_CLASSES, EVENTS, GESTURE} from '../config/holo-config'

/*
  One pointer path for mouse, touch and pen (Pointer Events).

  - The carousel only takes the gesture once it is clearly along its
    axis; a gesture across it is left to the page, so a horizontal
    carousel never blocks scrolling the page on a phone (the CSS sets
    touch-action: pan-y, pan-x for vertical ones).
  - The drag follows the finger 1:1 and pulls with resistance past
    either end.
  - On release a flick carries on by its speed; a slow release snaps to
    the nearest item.
  - The click that ends a drag is swallowed, so a link or a focusable
    item under the pointer does not fire.
*/

const axisOf = (vertical: boolean, x: number, y: number) =>
  vertical ? {main: y, cross: x} : {main: x, cross: y}

/** apply the dragged position at most once per frame */
const scheduleFrame = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance || instance.frame) return
  holoStore.setFrame(
    id,
    requestAnimationFrame(() => {
      holoStore.setFrame(id, 0)
      holoStore.applyDomTransform(id)
    })
  )
}

const cancelFrame = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance || !instance.frame) return
  cancelAnimationFrame(instance.frame)
  holoStore.setFrame(id, 0)
}

/**
 * Handle pointer down on a carousel
 */
export const _touchStart = (e: PointerEvent, id: string): void => {
  if (!id) {
    log.error('@_touchStart: missing carousel ID')
    return
  }

  const instance = holoStore.getInstance(id)
  if (!instance) {
    log.error('@_touchStart: undefined getInstance for: ' + id)
    return
  }

  const {io} = instance.virtualDom
  const mouse = e.pointerType === 'mouse'
  if (!io.enabled || (mouse ? !io.drag || e.button !== 0 : !io.swipe)) return
  if (holoStore.getSystem().pressedId) return // one gesture at a time

  // a mouse would otherwise start dragging the image or selecting text
  if (mouse) e.preventDefault()

  cancelFrame(id)
  const vertical = !!io.orientation
  const now = performance.now()
  const start = vertical
    ? instance.virtualDom.transformY
    : instance.virtualDom.transformX

  holoStore.updateTouchState(id, {
    pressed: true,
    dragging: false,
    cancelled: false,
    pointerId: e.pointerId,
    positionX: e.clientX,
    positionY: e.clientY,
    currentX: e.clientX,
    currentY: e.clientY,
    distance: 0,
    TouchStartTimeStamp: now,
    snapShotWidth: instance.virtualDom.transformX || 0,
    snapShotHeight: instance.virtualDom.transformY || 0,
    samples: [[now, start]],
    suppressClick: false
  })
  holoStore.updateSystem({pressedId: id})
}

/**
 * Handle pointer movement (document-wide while pressed)
 */
export const _touchMove = (e: PointerEvent): void => {
  const id = holoStore.getSystem().pressedId
  if (!id) return
  const instance = holoStore.getInstance(id)
  if (!instance) return
  const {touchState, virtualDom, Dom} = instance
  if (e.pointerId !== touchState.pointerId || touchState.cancelled) return

  const vertical = !!virtualDom.io.orientation
  const {main, cross} = axisOf(
    vertical,
    e.clientX - touchState.positionX,
    e.clientY - touchState.positionY
  )
  touchState.currentX = e.clientX
  touchState.currentY = e.clientY

  if (!touchState.dragging) {
    if (Math.abs(main) < GESTURE.SLOP && Math.abs(cross) < GESTURE.SLOP) return
    if (Math.abs(cross) > Math.abs(main)) {
      // across the carousel: the page scrolls, Holo lets go
      touchState.cancelled = true
      _release(id)
      return
    }
    touchState.dragging = true
    Dom.carousel.classList.add(CSS_CLASSES.DRAGGING)
    try {
      Dom.container.setPointerCapture(e.pointerId)
    } catch {
      // the pointer may already be gone
    }
    holoStore.updateStyle(id, false)
    setHold(id, 'pointer', true)
  }

  if (e.cancelable) e.preventDefault()

  const start = vertical
    ? touchState.snapShotHeight || 0
    : touchState.snapShotWidth || 0
  const position = rubberBand(
    start + main * touchState.multiplier,
    virtualDom.endOfSlidePosition
  )
  if (vertical) virtualDom.transformY = position
  else virtualDom.transformX = position
  touchState.distance = -main

  const now = performance.now()
  touchState.samples.push([now, position])
  if (touchState.samples.length > 12) touchState.samples.shift()

  scheduleFrame(id)
}

/** end a press without landing anywhere */
const _release = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance) return
  const {touchState, Dom} = instance
  try {
    if (Dom.container.hasPointerCapture?.(touchState.pointerId)) {
      Dom.container.releasePointerCapture(touchState.pointerId)
    }
  } catch {
    // nothing captured
  }
  Dom.carousel.classList.remove(CSS_CLASSES.DRAGGING)
  touchState.pressed = false
  touchState.dragging = false
  holoStore.updateSystem({pressedId: null})
  setHold(id, 'pointer', false)
}

/**
 * Handle pointer up / cancel
 */
export const _touchEnd = (e: PointerEvent): void => {
  const id = holoStore.getSystem().pressedId
  if (!id) return
  const instance = holoStore.getInstance(id)
  if (!instance) return
  const {touchState, virtualDom, branch} = instance
  if (e.pointerId !== touchState.pointerId) return

  const dragged = touchState.dragging
  cancelFrame(id)
  _release(id)
  if (!dragged) return

  // the click that follows a drag is not a click
  touchState.suppressClick = true

  const vertical = !!virtualDom.io.orientation
  const size = (vertical ? virtualDom.item.height : virtualDom.item.width) || 0
  const position = vertical ? virtualDom.transformY : virtualDom.transformX
  const velocity =
    e.type === 'pointercancel'
      ? 0
      : releaseVelocity(touchState.samples, performance.now())

  if (virtualDom.io.snap) {
    const index = releaseIndex(
      virtualDom.index,
      position,
      velocity,
      size,
      virtualDom.maxIndex
    )
    // goTo does not move when the index is unchanged, so place it here:
    // a short drag still has to spring back
    if (index === virtualDom.index) goTo(id, index)
    else branch.call(EVENTS.GO_TO, {index})
    return
  }

  // free mode: glide by the release speed and stop where it lands
  const landed = Math.min(
    0,
    Math.max(position + velocity * GESTURE.MOMENTUM, virtualDom.endOfSlidePosition)
  )
  const before = virtualDom.index
  if (vertical) virtualDom.transformY = landed
  else virtualDom.transformX = landed
  virtualDom.index = Math.min(nearestIndex(landed, size), virtualDom.maxIndex)
  virtualDom.endOfSlide =
    landed >= 0 ? 1 : landed <= virtualDom.endOfSlidePosition ? -1 : 0
  holoStore.updateStyle(id, true)
  holoStore.applyDomTransform(id)
  renderState(id)
  if (virtualDom.index !== before) branch.call(EVENTS.CHANGE, changeOf(virtualDom))
}

/**
 * Handle click/tap on carousel item
 */
export const _focus = (e: MouseEvent | TouchEvent, id: string): boolean => {
  const target = e.target as HTMLElement
  const holoItem = target.closest(`.${CSS_CLASSES.ITEM}`) as HTMLElement | null

  if (!holoItem) return false

  const instance = holoStore.getInstance(id)
  if (!instance) {
    log.error('_focus holo instance not found')
    return false
  }

  instance.branch.call(EVENTS.ACTIVATE, holoItem)
  return true
}

/**
 * Setup global pointer listeners (one set for every carousel on the page)
 */
export const setupGlobalTouchListeners = (): (() => void) => {
  const options: AddEventListenerOptions = {passive: false}
  document.addEventListener('pointermove', _touchMove, options)
  document.addEventListener('pointerup', _touchEnd)
  document.addEventListener('pointercancel', _touchEnd)

  return () => {
    document.removeEventListener('pointermove', _touchMove, options)
    document.removeEventListener('pointerup', _touchEnd)
    document.removeEventListener('pointercancel', _touchEnd)

    const instances = holoStore.getAllInstances()
    for (const id in instances) cancelFrame(id)
  }
}

// Export everything as an object for default export
export default {
  _touchStart,
  _touchMove,
  _touchEnd,
  _focus,
  setupGlobalTouchListeners
}

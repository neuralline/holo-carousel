//src/components/holo-essentials.ts

import cyre from 'cyre'
import {VirtualDomState, SlidePosition} from '../types/interface'
import {holoStore} from '../core/state'
import {EVENTS} from '../config/holo-config'

/**
 * Calculate snap position for grid alignment
 */
export const _snap = (parent: number, item: number): number => {
  return Math.round(parent / item) * item
}

/**
 * Determine if a touch interaction is a click based on duration
 */
export const _isClicked = (timeElapsed: number): boolean => {
  return timeElapsed < 250
}

/**
 * Calculate swipe velocity
 */
export const _swipe = (distance: number, timeElapsed: number): number => {
  return distance / timeElapsed
}

/**
 * Merge options into carousel parameters
 */
export const ioData = (
  carouselParameter: Record<string, any> = {},
  io: Record<string, any> = {}
): Record<string, any> => {
  for (const attribute in io) {
    if (carouselParameter[attribute]) {
      carouselParameter[attribute] = io[attribute]
    } else {
      console.error('@Holo: unknown carousel Parameter', attribute)
    }
  }
  return carouselParameter
}

/**
 * Get width and height of an element including margins
 */
export const _getItemWidthHeight = (
  e: HTMLElement | null
): {width: number; height: number} => {
  if (!e) return {width: 0, height: 0}

  const outer = {
    width: e.offsetWidth,
    height: e.offsetHeight
  }

  const style = window.getComputedStyle(e, null)
  outer.width += parseInt(style.marginLeft) + parseInt(style.marginRight)
  outer.height += parseInt(style.marginTop) + parseInt(style.marginBottom)

  return outer
}

/**
 * Calculate slider position and handle boundaries
 */
export const _sliderPosition = (
  virtualDom: VirtualDomState
): VirtualDomState => {
  const updated = {...virtualDom}

  if (updated.transform >= 100) {
    updated.transform = 100
    updated.endOfSlide = 1 // Left end of the carousel
  } else if (updated.transform + 100 <= updated.endOfSlidePosition) {
    updated.transform = updated.endOfSlidePosition - 100
    updated.endOfSlide = -1 // Right end of the carousel
  } else {
    updated.endOfSlide = 0 // In the middle of carousel
  }

  return updated
}

/**
 * Manage active/highlighted slides
 */
export const activate = ([element, virtualDom]: [
  HTMLElement,
  VirtualDomState
]): void => {
  const id = virtualDom.id
  const updatedVirtual = {
    ...virtualDom,
    transformX: -Math.abs(element.offsetLeft)
  }

  // Update store
  holoStore.updateVirtualDom(id, updatedVirtual)

  // Call Cyre event
  cyre.call(EVENTS.SNAP, updatedVirtual)

  // Add active class
  element.classList.add('active')
}

/**
 * Previous slide operator
 */
export const prvSlide = (virtualDom: VirtualDomState): void => {
  const id = virtualDom.id

  if (virtualDom.endOfSlide === 1) return // At left end already

  const updatedVirtual = {
    ...virtualDom,
    transformX: virtualDom.transformX + (virtualDom.carousel.width || 0),
    transformY: virtualDom.transformY + (virtualDom.carousel.height || 0)
  }

  // Update store
  holoStore.updateVirtualDom(id, updatedVirtual)

  // Call Cyre event
  cyre.call(EVENTS.SNAP, updatedVirtual)
}

/**
 * Next slide operator
 */
export const nxtSlide = (virtualDom: VirtualDomState): void => {
  const id = virtualDom.id

  if (virtualDom.endOfSlide === -1) return // At right end already

  const updatedVirtual = {
    ...virtualDom,
    transformX: virtualDom.transformX - (virtualDom.carousel.width || 0),
    transformY: virtualDom.transformY - (virtualDom.carousel.height || 0)
  }

  // Update store
  holoStore.updateVirtualDom(id, updatedVirtual)

  // Call Cyre event
  cyre.call(EVENTS.SNAP, updatedVirtual)
}

/**
 * Jump to first slide operator
 */
export const firstSlide = (virtualDom: VirtualDomState): void => {
  const id = virtualDom.id

  const updatedVirtual = {
    ...virtualDom,
    transformX: 0,
    transformY: 0,
    endOfSlide: 1
  }

  // Update store
  holoStore.updateVirtualDom(id, updatedVirtual)

  // Call Cyre event
  cyre.call(EVENTS.SNAP, updatedVirtual)
}

/**
 * Jump to last slide operator
 */
export const lastSlide = (virtualDom: VirtualDomState): void => {
  const id = virtualDom.id

  const updatedVirtual = {
    ...virtualDom,
    transformX: virtualDom.endOfSlidePosition,
    transformY: virtualDom.endOfSlidePosition,
    endOfSlide: -1
  }

  // Update store
  holoStore.updateVirtualDom(id, updatedVirtual)

  // Call Cyre event
  cyre.call(EVENTS.SNAP, updatedVirtual)
}

/**
 * Animate slides forward
 */
export const animateSlideForward = (virtualDom: VirtualDomState): void => {
  if (virtualDom.endOfSlide === -1) {
    return cyre.call(EVENTS.FIRST_SLIDE, virtualDom)
  }
  return cyre.call(EVENTS.NEXT_SLIDE, virtualDom)
}

/**
 * Animate slides backward
 */
export const animateSlideBackward = (virtualDom: VirtualDomState): void => {
  if (virtualDom.endOfSlide === 1) {
    return cyre.call(EVENTS.LAST_SLIDE, virtualDom)
  }
  return cyre.call(EVENTS.PREV_SLIDE, virtualDom)
}

/**
 * Handle animation
 */
export const animate = (virtualDom: VirtualDomState): void => {
  cyre.call(EVENTS.ANIMATE_FORWARD)
}

/**
 * Mouse wheel controller
 */
export const wheeler = (e: WheelEvent, id: string): void => {
  e.preventDefault()

  const virtualDom = holoStore.getVirtualDom(id)
  if (!virtualDom)
    return cyre.call(EVENTS.ERROR, '@Wheeler virtual dom undefined')

  if (e.deltaY < 0) {
    cyre.call(EVENTS.PREV_SLIDE, virtualDom)
  } else if (e.deltaY > 0) {
    cyre.call(EVENTS.NEXT_SLIDE, virtualDom)
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
  let slots = Math.floor(parent / item)

  if (max && slots > max) {
    return max
  }

  return slots || 1
}

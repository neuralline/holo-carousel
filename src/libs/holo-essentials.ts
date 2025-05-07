//src/libs/holo-essentials.ts

import {cyre} from 'cyre'
import type {
  HoloVirtual,
  HoloDimensions,
  HoloDatabase,
  HoloIOOptions
} from '../types/interface'

/**
 * Main instance - holo database object
 */
export const _holo: HoloDatabase = {}

/**
 * Snap position to grid
 */
export const snapToGrid = (position: number, gridSize: number): number => {
  return Math.round(position / gridSize) * gridSize
}

/**
 * Determines if interaction was a click based on time elapsed
 */
export const isClickEvent = (timeElapsed: number): number => {
  return timeElapsed < 250 ? 1 : 0 // Handle click, touch, double click or long-touch events
}

/**
 * Calculate swipe speed
 */
export const calculateSwipeSpeed = (
  distance: number,
  timeElapsed: number
): number => {
  return distance / timeElapsed
}

/**
 * Update IO parameters with immutable approach
 */
export const updateIOOptions = (
  carouselParameter: HoloIOOptions,
  io: Partial<HoloIOOptions> = {}
): HoloIOOptions => {
  // Filter valid attributes only
  const validAttributes = Object.entries(io).reduce((valid, [key, value]) => {
    if (key in carouselParameter) {
      return {...valid, [key]: value}
    }
    console.error('@Holo: unknown carousel Parameter', key)
    return valid
  }, {})

  // Return a new object with updated values
  return {...carouselParameter, ...validAttributes}
}

/**
 * Get element dimensions including margins
 */
export const _getItemWidthHeight = (e: HTMLElement): HoloDimensions => {
  if (!e) return {width: 0, height: 0}

  const outer: HoloDimensions = {
    width: e.offsetWidth,
    height: e.offsetHeight
  }

  const style = window.getComputedStyle(e, null)

  // Add margins to dimensions
  const marginLeft = parseInt(style.marginLeft) || 0
  const marginRight = parseInt(style.marginRight) || 0
  const marginTop = parseInt(style.marginTop) || 0
  const marginBottom = parseInt(style.marginBottom) || 0

  outer.width += marginLeft + marginRight
  outer.height += marginTop + marginBottom

  return outer
}

/**
 * Calculate slider position boundaries
 */
export const calculateSliderPosition = (virtual: HoloVirtual): HoloVirtual => {
  const updatedVirtual = {...virtual}

  if (updatedVirtual.transformX >= 100) {
    updatedVirtual.transformX = 100
    updatedVirtual.endOfSlide = 1 // Left end of the carousel
  } else if (
    updatedVirtual.transformX + 100 <=
    updatedVirtual.endOfSlidePosition!
  ) {
    updatedVirtual.transformX = updatedVirtual.endOfSlidePosition! - 100
    updatedVirtual.endOfSlide = -1 // Right end of the carousel
  } else {
    updatedVirtual.endOfSlide = 0 // In the middle of carousel
  }

  return updatedVirtual
}

/**
 * Manage active/highlighted slides
 * FIXED: Consistent event ID usage
 */
export const activate = ([element, virtual]: [
  HTMLElement,
  HoloVirtual
]): void => {
  const updatedVirtual = {
    ...virtual,
    transformX: -Math.abs(element.offsetLeft)
  }

  // Get the event ID from virtual state or create consistent ID
  const snapEventId = virtual.eventIds?.snap || `snap_${updatedVirtual.id}`

  cyre.call(snapEventId, updatedVirtual)
  element.classList.add('active')
}

/**
 * Go to previous slide
 * FIXED: Consistent event ID usage
 */
export const prvSlide = (virtual: HoloVirtual): void => {
  if (virtual.endOfSlide === 1) return // At left end, cannot go further left

  const updatedVirtual = {
    ...virtual,
    transformX: virtual.transformX + (virtual.carousel.width || 0),
    transformY: virtual.transformY + (virtual.carousel.height || 0)
  }

  // Get the event ID from virtual state or create consistent ID
  const snapEventId = virtual.eventIds?.snap || `snap_${updatedVirtual.id}`

  return cyre.call(snapEventId, updatedVirtual)
}

/**
 * Go to next slide
 * FIXED: Consistent event ID usage
 */
export const nxtSlide = (virtual: HoloVirtual): void => {
  if (virtual.endOfSlide === -1) return // At right end, cannot go further right

  const updatedVirtual = {
    ...virtual,
    transformX: virtual.transformX - (virtual.carousel.width || 0),
    transformY: virtual.transformY - (virtual.carousel.height || 0)
  }

  // Get the event ID from virtual state or create consistent ID
  const snapEventId = virtual.eventIds?.snap || `snap_${updatedVirtual.id}`

  return cyre.call(snapEventId, updatedVirtual)
}

/**
 * Jump to first slide
 * FIXED: Consistent event ID usage
 */
export const firstSlide = (virtual: HoloVirtual): void => {
  const updatedVirtual = {
    ...virtual,
    transformX: 0,
    transformY: 0,
    endOfSlide: 1
  }

  // Get the event ID from virtual state or create consistent ID
  const snapEventId = virtual.eventIds?.snap || `snap_${updatedVirtual.id}`

  return cyre.call(snapEventId, updatedVirtual)
}

/**
 * Jump to last slide
 * FIXED: Consistent event ID usage
 */
export const lastSlide = (virtual: HoloVirtual): void => {
  const updatedVirtual = {
    ...virtual,
    transformX: virtual.endOfSlidePosition!,
    transformY: virtual.endOfSlidePosition!,
    endOfSlide: -1
  }

  // Get the event ID from virtual state or create consistent ID
  const snapEventId = virtual.eventIds?.snap || `snap_${updatedVirtual.id}`

  return cyre.call(snapEventId, updatedVirtual)
}

/**
 * Animate slides forward
 * FIXED: Consistent event ID usage
 */
export const animateSlideForward = (virtual: HoloVirtual): void => {
  console.log('animating forward', virtual.id)

  // Get event IDs from virtual state or create consistent IDs
  const eventIds = virtual.eventIds || {
    firstSlide: `first_slide_${virtual.id}`,
    nextSlide: `next_slide_${virtual.id}`
  }

  if (virtual.endOfSlide === -1) {
    return cyre.call(eventIds.firstSlide, virtual)
  }

  return cyre.call(eventIds.nextSlide, virtual)
}

/**
 * Animate slides backward
 * FIXED: Consistent event ID usage
 */
export const animateSlideBackward = (virtual: HoloVirtual): void => {
  console.log('animating backward', virtual.id)

  // Get event IDs from virtual state or create consistent IDs
  const eventIds = virtual.eventIds || {
    lastSlide: `last_slide_${virtual.id}`,
    prevSlide: `prev_slide_${virtual.id}`
  }

  if (virtual.endOfSlide === 1) {
    return cyre.call(eventIds.lastSlide, virtual)
  }

  return cyre.call(eventIds.prevSlide, virtual)
}

/**
 * Mouse wheel controller
 * FIXED: Consistent event ID usage
 */
export const wheeler = (e: WheelEvent, id: string): void => {
  e.preventDefault()
  const virtual = _holo[id].getVirtual

  // Get event IDs from virtual state or create consistent IDs
  const eventIds = virtual.eventIds || {
    prevSlide: `prev_slide_${virtual.id}`,
    nextSlide: `next_slide_${virtual.id}`
  }

  if (e.deltaY < 0) {
    cyre.call(eventIds.prevSlide, virtual)
  } else if (e.deltaY > 0) {
    cyre.call(eventIds.nextSlide, virtual)
  }
}

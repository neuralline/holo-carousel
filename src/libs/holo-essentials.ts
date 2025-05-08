// src/libs/holo-essentials.ts

import {cyre} from 'cyre'
import type {
  HoloVirtual,
  HoloDimensions,
  HoloDatabase,
  HoloIOOptions
} from '../types/interface'
import {EVENTS} from '../config/holo-config'
import {safeEventCall} from '../core/holo-event-system'

/**
 * Main instance database - stores all carousel instances
 */
export const _holo: HoloDatabase = {}

/**
 * Snap position to grid
 */
export const snapToGrid = (position: number, gridSize: number): number => {
  if (!gridSize) return position
  return Math.round(position / gridSize) * gridSize
}

/**
 * Determines if interaction was a click based on time elapsed
 */
export const isClickEvent = (timeElapsed: number): number => {
  return timeElapsed < 250 ? 1 : 0
}

/**
 * Calculate swipe speed (pixels per millisecond)
 */
export const calculateSwipeSpeed = (
  distance: number,
  timeElapsed: number
): number => {
  if (!timeElapsed) return 0
  return distance / timeElapsed
}

/**
 * Get element dimensions including margins
 */
export const _getItemWidthHeight = (e: HTMLElement): HoloDimensions => {
  if (!e) return {width: 0, height: 0}

  // Get basic dimensions
  const outer: HoloDimensions = {
    width: e.offsetWidth,
    height: e.offsetHeight
  }

  try {
    const style = window.getComputedStyle(e, null)

    // Add margins to dimensions
    const marginLeft = parseInt(style.marginLeft) || 0
    const marginRight = parseInt(style.marginRight) || 0
    const marginTop = parseInt(style.marginTop) || 0
    const marginBottom = parseInt(style.marginBottom) || 0

    outer.width += marginLeft + marginRight
    outer.height += marginTop + marginBottom
  } catch (error) {
    console.warn('Error calculating element dimensions:', error)
  }

  return outer
}

/**
 * Calculate slider position boundaries
 */
export const calculateSliderPosition = (virtual: HoloVirtual): HoloVirtual => {
  const updatedVirtual = {...virtual}

  // Left/top boundary check
  if (updatedVirtual.transformX >= 0) {
    updatedVirtual.transformX = 0
    updatedVirtual.endOfSlide = 1 // Left/top end
  }
  // Right/bottom boundary check
  else if (updatedVirtual.transformX <= updatedVirtual.endOfSlidePosition) {
    updatedVirtual.transformX = updatedVirtual.endOfSlidePosition
    updatedVirtual.endOfSlide = -1 // Right/bottom end
  }
  // Middle position
  else {
    updatedVirtual.endOfSlide = 0
  }

  return updatedVirtual
}

/**
 * Activate/highlight selected slide
 */
export const activate = ([element, virtual]: [
  HTMLElement,
  HoloVirtual
]): void => {
  if (!element || !virtual?.id) {
    console.error('activate: Invalid parameters')
    return
  }

  // Update position to center the selected slide
  const updatedVirtual = {
    ...virtual,
    transformX: -Math.abs(element.offsetLeft)
  }

  // Get the event ID or create consistent ID
  const snapEventId = virtual.eventIds?.snap || `snap_${updatedVirtual.id}`

  // Call the snap event
  safeEventCall(snapEventId, EVENTS.SNAP, updatedVirtual)

  // Add active class
  element.classList.add('active')
}

/**
 * Go to previous slide
 */
export const prvSlide = (virtual: HoloVirtual): void => {
  if (!virtual?.id) {
    console.error('prvSlide: Invalid virtual state')
    return
  }

  // If already at left end, do nothing
  if (virtual.endOfSlide === 1) return

  // Move to previous slide
  const updatedVirtual = {
    ...virtual,
    transformX: virtual.transformX + (virtual.carousel.width || 0),
    transformY: virtual.transformY + (virtual.carousel.height || 0)
  }

  // Get the event ID or create consistent ID
  const snapEventId = virtual.eventIds?.snap || `snap_${updatedVirtual.id}`

  // Call the snap event
  safeEventCall(snapEventId, EVENTS.SNAP, updatedVirtual)
}

/**
 * Go to next slide
 */
export const nxtSlide = (virtual: HoloVirtual): void => {
  if (!virtual?.id) {
    console.error('nxtSlide: Invalid virtual state')
    return
  }

  // If already at right end, do nothing
  if (virtual.endOfSlide === -1) return

  // Move to next slide
  const updatedVirtual = {
    ...virtual,
    transformX: virtual.transformX - (virtual.carousel.width || 0),
    transformY: virtual.transformY - (virtual.carousel.height || 0)
  }

  // Get the event ID or create consistent ID
  const snapEventId = virtual.eventIds?.snap || `snap_${updatedVirtual.id}`

  // Call the snap event
  safeEventCall(snapEventId, EVENTS.SNAP, updatedVirtual)
}

/**
 * Jump to first slide
 */
export const firstSlide = (virtual: HoloVirtual): void => {
  if (!virtual?.id) {
    console.error('firstSlide: Invalid virtual state')
    return
  }

  // Move to first slide
  const updatedVirtual = {
    ...virtual,
    transformX: 0,
    transformY: 0,
    endOfSlide: 1
  }

  // Get the event ID or create consistent ID
  const snapEventId = virtual.eventIds?.snap || `snap_${updatedVirtual.id}`

  // Call the snap event
  safeEventCall(snapEventId, EVENTS.SNAP, updatedVirtual)
}

/**
 * Jump to last slide
 */
export const lastSlide = (virtual: HoloVirtual): void => {
  if (!virtual?.id) {
    console.error('lastSlide: Invalid virtual state')
    return
  }

  // Move to last slide
  const updatedVirtual = {
    ...virtual,
    transformX: virtual.endOfSlidePosition,
    transformY: virtual.endOfSlidePosition,
    endOfSlide: -1
  }

  // Get the event ID or create consistent ID
  const snapEventId = virtual.eventIds?.snap || `snap_${updatedVirtual.id}`

  // Call the snap event
  safeEventCall(snapEventId, EVENTS.SNAP, updatedVirtual)
}

/**
 * Animate slides forward
 */
export const animateSlideForward = (virtual: HoloVirtual): void => {
  if (!virtual?.id) {
    console.error('animateSlideForward: Invalid virtual state')
    return
  }

  // Get event IDs or create consistent IDs
  const eventIds = virtual.eventIds || {
    firstSlide: `first_slide_${virtual.id}`,
    nextSlide: `next_slide_${virtual.id}`
  }

  // If at right end, go to first slide
  if (virtual.endOfSlide === -1) {
    return safeEventCall(eventIds.firstSlide, EVENTS.FIRST_SLIDE, virtual)
  }

  // Otherwise go to next slide
  return safeEventCall(eventIds.nextSlide, EVENTS.NEXT_SLIDE, virtual)
}

/**
 * Animate slides backward
 */
export const animateSlideBackward = (virtual: HoloVirtual): void => {
  if (!virtual?.id) {
    console.error('animateSlideBackward: Invalid virtual state')
    return
  }

  // Get event IDs or create consistent IDs
  const eventIds = virtual.eventIds || {
    lastSlide: `last_slide_${virtual.id}`,
    prevSlide: `prev_slide_${virtual.id}`
  }

  // If at left end, go to last slide
  if (virtual.endOfSlide === 1) {
    return safeEventCall(eventIds.lastSlide, EVENTS.LAST_SLIDE, virtual)
  }

  // Otherwise go to previous slide
  return safeEventCall(eventIds.prevSlide, EVENTS.PREV_SLIDE, virtual)
}

/**
 * Mouse wheel controller
 */
export const wheeler = (e: WheelEvent, id: string): void => {
  if (!id || !_holo[id]?.getVirtual) {
    console.error('wheeler: Invalid carousel ID', id)
    return
  }

  e.preventDefault()
  const virtual = _holo[id].getVirtual

  // Get event IDs or create consistent IDs
  const eventIds = virtual.eventIds || {
    prevSlide: `prev_slide_${id}`,
    nextSlide: `next_slide_${id}`
  }

  // Up/left or down/right
  if (e.deltaY < 0) {
    safeEventCall(eventIds.prevSlide, EVENTS.PREV_SLIDE, virtual)
  } else if (e.deltaY > 0) {
    safeEventCall(eventIds.nextSlide, EVENTS.NEXT_SLIDE, virtual)
  }
}

/**
 * Performance monitoring utility for Holo carousels
 */
export const monitorPerformance = (id: string): void => {
  if (!cyre || !id || !_holo[id]) return

  try {
    // Get global Cyre performance metrics
    const metrics = cyre.getPerformanceState?.() || {stress: 0}

    // Log if stress is high
    if (metrics.stress > 0.8) {
      console.warn(
        `Performance warning for carousel ${id}: Stress level ${metrics.stress.toFixed(
          2
        )}`
      )

      // Apply optimizations if stress is too high
      const virtual = _holo[id].getVirtual

      _holo[id].setState = {
        ...virtual,
        io: {
          ...virtual.io,
          wheel: 0, // Disable wheel
          animate: 0, // Disable animation
          duration: 300 // Slow down transitions
        }
      }
    }
  } catch (error) {
    console.error('Error in performance monitoring:', error)
  }
}

/**
 * Clean up a carousel instance
 */
export const cleanupCarousel = (id: string): boolean => {
  if (!id || !_holo[id]) return false

  try {
    // Get all event IDs
    const eventIds = _holo[id].getVirtual.eventIds || {}

    // Forget all registered events
    Object.values(eventIds).forEach(eventId => {
      if (typeof eventId === 'string') {
        cyre.forget(eventId)
      }
    })

    // Remove from database
    delete _holo[id]

    return true
  } catch (error) {
    console.error(`Error cleaning up carousel ${id}:`, error)
    return false
  }
}

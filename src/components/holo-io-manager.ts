// src/components/holo-io-manager.ts

import {cyre} from 'cyre'
import type {HoloVirtual, HoloShadow} from '../types/interface'
import {Touch} from './holo-touch'
import {wheeler} from '../libs/holo-essentials'
import {EVENTS} from '../config/holo-config'
import {registerInstanceEvents, safeEventCall} from '../core/holo-event-system'

/**
 * H.O.L.O - C.A.R.O.U.S.E.L
 * Improved IO manager with error handling and cleanup
 */

/**
 * Setup input/output event handling for a carousel instance
 */
export const setupIOManager = (
  virtual: HoloVirtual,
  shadow: HoloShadow
): void => {
  // Validation
  if (!virtual) {
    console.error('IO Manager: Missing virtual state')
    return
  }

  if (!virtual.id) {
    console.error('IO Manager: Virtual state has no ID')
    return
  }

  if (!shadow?.carousel || !shadow?.container) {
    console.error('IO Manager: Invalid shadow DOM references', virtual.id)
    return
  }

  // Register instance-specific events with cyre
  const updatedVirtual = registerInstanceEvents(virtual)

  // Setup DOM event handlers if enabled
  if (updatedVirtual.io.enabled) {
    setupDomEventHandlers(updatedVirtual, shadow)
  }

  // Initial refresh
  safeEventCall(EVENTS.REFRESH_CAROUSEL, EVENTS.REFRESH_CAROUSEL, {
    virtual: updatedVirtual,
    shadow
  })
}

/**
 * Setup DOM event handlers with cleanup capabilities
 */
const setupDomEventHandlers = (
  virtual: HoloVirtual,
  shadow: HoloShadow
): (() => void) => {
  const cleanupFunctions: Array<() => void> = []

  // Mouse drag handler
  if (virtual.io.drag) {
    const handleMouseDown = (e: MouseEvent): void => {
      e.preventDefault()
      Touch._touchStart(e, virtual.id)
    }

    shadow.container.addEventListener('mousedown', handleMouseDown)
    cleanupFunctions.push(() => {
      shadow.container.removeEventListener('mousedown', handleMouseDown)
    })
  }

  // Touch drag handler
  if (virtual.io.drag) {
    const handleTouchStart = (e: TouchEvent): void => {
      e.preventDefault()
      Touch._touchStart(e, virtual.id)
    }

    shadow.container.addEventListener('touchstart', handleTouchStart, {
      passive: false
    })
    cleanupFunctions.push(() => {
      shadow.container.removeEventListener('touchstart', handleTouchStart)
    })
  }

  // Mouse wheel handler
  if (virtual.io.wheel) {
    const handleWheel = (e: WheelEvent): void => {
      wheeler(e, virtual.id)
    }

    shadow.carousel.addEventListener('wheel', handleWheel, {passive: false})
    cleanupFunctions.push(() => {
      shadow.carousel.removeEventListener('wheel', handleWheel)
    })
  }

  // Animation handler
  if (virtual.io.animate && virtual.eventIds?.animate) {
    cyre.call(virtual.eventIds.animate, virtual)
  }

  // Resize observer for better performance than resize event
  const resizeObserver = new ResizeObserver(
    throttle(() => {
      safeEventCall(EVENTS.REFRESH_CAROUSEL, EVENTS.REFRESH_CAROUSEL, {
        virtual,
        shadow
      })
    }, 100)
  )

  resizeObserver.observe(shadow.carousel)
  cleanupFunctions.push(() => resizeObserver.disconnect())

  // Return a cleanup function that removes all event listeners
  return () => cleanupFunctions.forEach(cleanup => cleanup())
}

/**
 * Simple throttle function to limit event firing
 */
const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false

  return function (this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export default setupIOManager

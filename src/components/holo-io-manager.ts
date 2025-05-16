//src/components/holo-io-manager.ts

import cyre from 'cyre'
import {VirtualDomState} from '../types/interface'
import {holoStore} from '../core/state'
import Touch from './holo-touch'
import {wheeler} from './holo-essentials'
import {EVENTS} from '../config/holo-config'
import {setupCarouselActions, refreshCarousel} from '../core/event-manager'

/**
 * Setup all event handlers and listeners for a carousel
 */
export const setupEventHandlers = (id: string): (() => void) => {
  const instance = holoStore.getInstance(id)
  if (!instance) {
    cyre.call(
      EVENTS.ERROR,
      '@Holo: Cannot setup events handler for missing carousel: ' + id
    )
    return () => {}
  }

  const {virtualDom, Dom} = instance

  // Setup carousel-specific actions
  setupCarouselActions(id, virtualDom)

  // Store event listeners for cleanup
  const cleanupFunctions: Array<() => void> = []

  // Only setup listeners if enabled
  if (virtualDom.io.enabled) {
    // Drag event listeners
    if (virtualDom.io.drag && Dom.container) {
      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault()
        Touch._touchStart(e, id)
      }

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault()
        Touch._touchStart(e, id)
      }

      Dom.container.addEventListener('mousedown', handleMouseDown)
      Dom.container.addEventListener('touchstart', handleTouchStart)

      cleanupFunctions.push(() => {
        Dom.container.removeEventListener('mousedown', handleMouseDown)
        Dom.container.removeEventListener('touchstart', handleTouchStart)
      })
    }

    // Wheel event listener
    if (virtualDom.io.wheel && Dom.carousel) {
      const handleWheel = (e: WheelEvent) => {
        wheeler(e, id)
      }

      Dom.carousel.addEventListener('wheel', handleWheel)

      cleanupFunctions.push(() => {
        Dom.carousel.removeEventListener('wheel', handleWheel)
      })
    }

    // Start animation if enabled
    if (virtualDom.io.animate) {
      cyre.call(EVENTS.ANIMATE, virtualDom)
    }

    // Resize listener
    const handleResize = () => {
      refreshCarousel(id)
    }

    Dom.container.addEventListener('resize', handleResize)

    cleanupFunctions.push(() => {
      Dom.container.removeEventListener('resize', handleResize)
    })
  }

  // Return cleanup function that calls all cleanup handlers
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup())
  }
}

export default {
  setupEventHandlers
}

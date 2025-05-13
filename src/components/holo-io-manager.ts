//src/components/holo-io-manager.ts

import {cyre, CyreLog} from 'cyre'
import type {HoloVirtual, HoloShadow} from '../types/interface'
import {handleTouchStart, handleNestedTouchStart} from './holo-touch'
import {handleWheel} from '../libs/holo-navigation'
import {initializeInstanceEvents} from '../core/holo-events'
import {EVENTS} from '../config/holo-config'
import {isChildOf} from './holo-relations'
import {initializeDeepLinking} from './holo-deep-link'
import {initializeAccordionMode} from './holo-accordion'

/**
 * H.O.L.O - C.A.R.O.U.S.E.L
 * IO manager
 * Setup input/output event handling for a carousel instance
 */
export const setupIOManager = (
  virtual: HoloVirtual,
  shadow: HoloShadow
): void => {
  if (!virtual) {
    CyreLog.error('@Holo: Major malfunctions - Virtual state is missing')
    return
  }

  if (!virtual.id || typeof virtual.id !== 'string') {
    CyreLog.error('@Holo: Virtual state has no valid ID', virtual)
    return
  }

  // Initialize instance-specific events using the enhanced event system
  try {
    initializeInstanceEvents(virtual.id, virtual.io)
  } catch (error) {
    CyreLog.error(
      `Error initializing events for carousel ${virtual.id}:`,
      error
    )
  }

  // Initialize accordion mode if enabled
  if (virtual.io.accordionMode) {
    initializeAccordionMode(virtual, shadow)
  }

  // Initialize deep linking if enabled
  if (virtual.io.deepLinking) {
    initializeDeepLinking(virtual.id)
  }

  // Setup DOM event handlers if enabled
  if (virtual.io.enabled) {
    setupDomEventHandlers(virtual, shadow)
  }

  // Initial refresh
  cyre.call(EVENTS.REFRESH_CAROUSEL, {virtual, shadow})
}

/**
 * Setup DOM event handlers for user interaction
 */
const setupDomEventHandlers = (
  virtual: HoloVirtual,
  shadow: HoloShadow
): void => {
  if (!virtual.id || !shadow || !shadow.carousel || !shadow.container) {
    CyreLog.error(
      `Cannot setup DOM handlers for carousel ${virtual?.id}: Invalid shadow elements`
    )
    return
  }

  CyreLog.info(`Setting up DOM handlers for carousel ${virtual.id}`)

  // Get event IDs from virtual
  const eventIds = virtual.eventIds || {}

  // Determine if this is a nested carousel
  const isNested = virtual.nestedLevel > 0 || !!virtual.parentId

  // Add data attribute for nested carousels
  if (isNested) {
    shadow.carousel.setAttribute('data-nested', 'true')

    if (virtual.parentId) {
      shadow.carousel.setAttribute('data-parent', virtual.parentId)
    }
  }

  // Mouse drag handler
  if (virtual.io.drag) {
    // Use different touch handlers based on nesting
    const handleMouseDown = (e: MouseEvent): void => {
      e.preventDefault()
      e.stopPropagation()

      if (isNested) {
        handleNestedTouchStart(e, virtual.id)
      } else {
        handleTouchStart(e, virtual.id)
      }

      // Log for debugging
      CyreLog.debug(`Mouse down detected on carousel ${virtual.id}`)
    }

    shadow.container.addEventListener('mousedown', handleMouseDown, {
      passive: false
    })

    // Add click handlers to individual slides
    const slideElements = shadow.container.querySelectorAll('.holo')
    slideElements.forEach((slide, index) => {
      slide.addEventListener(
        'click',
        e => {
          // If this is an accordion, don't handle here
          if (virtual.io.accordionMode) return

          // Otherwise process normally
          e.preventDefault()
          e.stopPropagation()

          CyreLog.debug(`Slide ${index} clicked in carousel ${virtual.id}`)

          if (eventIds.activate) {
            cyre.call(eventIds.activate, [slide as HTMLElement, virtual])
          }
        },
        {passive: false}
      )
    })
  }

  // Touch drag handler
  if (virtual.io.drag) {
    // Use different touch handlers based on nesting
    const touchStartHandler = (e: TouchEvent): void => {
      e.preventDefault()
      e.stopPropagation()

      if (isNested) {
        handleNestedTouchStart(e, virtual.id)
      } else {
        handleTouchStart(e, virtual.id)
      }

      // Log for debugging
      CyreLog.debug(`Touch start detected on carousel ${virtual.id}`)
    }

    shadow.container.addEventListener('touchstart', touchStartHandler, {
      passive: false
    })
  }

  // Mouse wheel handler - only for non-nested carousels
  if (virtual.io.wheel && !isNested) {
    const wheelHandler = (e: WheelEvent): void => {
      e.preventDefault()
      e.stopPropagation()
      handleWheel(e, virtual.id)

      // Log for debugging
      CyreLog.debug(`Wheel event detected on carousel ${virtual.id}`)
    }

    shadow.carousel.addEventListener('wheel', wheelHandler, {passive: false})
  }

  // Navigation buttons
  const prevButton = shadow.carousel.querySelector('.holo-prev')
  const nextButton = shadow.carousel.querySelector('.holo-next')

  if (prevButton) {
    prevButton.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      if (eventIds.prevSlide) {
        cyre.call(eventIds.prevSlide, virtual)
      }
    })
  }

  if (nextButton) {
    nextButton.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      if (eventIds.nextSlide) {
        cyre.call(eventIds.nextSlide, virtual)
      }
    })
  }

  // Animation handler - start animation if enabled
  if (virtual.io.animate && eventIds.animate) {
    cyre.call(eventIds.animate, virtual)
  }

  // Resize handler
  const handleResize = (): void => {
    cyre.call(EVENTS.REFRESH_CAROUSEL, {virtual, shadow})
  }

  // Add resize listener to window
  window.addEventListener('resize', handleResize, {passive: true})

  // Also refresh on orientation change
  window.addEventListener('orientationchange', handleResize, {passive: true})
}

export default setupIOManager

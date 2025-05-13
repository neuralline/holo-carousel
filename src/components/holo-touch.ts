//src/components/holo-touch.ts

import {cyre, CyreLog} from 'cyre'
import type {HoloVirtual, TouchState} from '../types/interface'
import {_holo} from '../libs/holo-essentials'
import {applyTransform} from './orientation-handler'
import {TOUCH_EVENTS, EVENTS, touchState} from '../config/holo-config'
import {
  isChildOf,
  pauseParentCarousels,
  resumeParentCarousels,
  getAncestors
} from './holo-relations'

/**
 * Initialize the touch system with Cyre events
 */
export const initializeTouchSystem = (): void => {
  CyreLog.info('Initializing touch system')

  try {
    registerTouchEventHandlers()
    registerDomEventListeners()
  } catch (error) {
    CyreLog.error('Error during touch system initialization:', error)
  }
}

/**
 * Register touch event handlers and intralink chains
 */
function registerTouchEventHandlers(): void {
  // Touch start handler
  cyre.on(
    TOUCH_EVENTS.TOUCH_START,
    (payload: {event: TouchEvent | MouseEvent; id: string; options?: any}) => {
      const {event, id, options = {}} = payload

      if (!_holo[id]?.getVirtual) {
        CyreLog.error(`No carousel found with ID: ${id}`)
        return
      }

      const virtual = _holo[id].getVirtual

      // Check if touch is disabled in options
      if (virtual.io.drag === 0 && virtual.io.swipe === 0) {
        return
      }

      // Check if this is a nested carousel
      const isNested = virtual.nestedLevel > 0 || !!virtual.parentId

      // If nested, pause parent carousel interactions
      if (isNested) {
        pauseParentCarousels(id)
      }

      // Get initial touch/mouse position
      const clientX =
        'touches' in event ? event.touches[0].clientX : event.clientX
      const clientY =
        'touches' in event ? event.touches[0].clientY : event.clientY

      // Update touch state
      touchState.id = id
      touchState.virtual = virtual
      touchState.startX = clientX
      touchState.startY = clientY
      touchState.currentX = clientX
      touchState.currentY = clientY
      touchState.lastX = clientX
      touchState.lastY = clientY
      touchState.distanceX = 0
      touchState.distanceY = 0
      touchState.directionX = 0
      touchState.directionY = 0
      touchState.velocityX = 0
      touchState.velocityY = 0
      touchState.startTransformX = virtual.transformX
      touchState.startTransformY = virtual.transformY
      touchState.pressed = true
      touchState.startTime = performance.now()
      touchState.orientation = !!virtual.io.orientation
      touchState.targetElement = event.target as HTMLElement
      touchState.moved = false
      touchState.isNested = isNested

      // Disable transitions during drag
      _holo[id].updateStyle = 0

      // Add active touch class
      document.getElementById(id)?.classList.add('holo-touch-active')

      // Continue chain to appropriate drag handler based on orientation
      return {
        id: touchState.orientation
          ? TOUCH_EVENTS.DRAG_VERTICAL
          : TOUCH_EVENTS.DRAG_HORIZONTAL,
        payload: touchState
      }
    }
  )

  // Horizontal drag handler
  cyre.on(TOUCH_EVENTS.DRAG_HORIZONTAL, (state: TouchState) => {
    if (!state.pressed || !state.id || !state.virtual) {
      return
    }

    // Calculate distance moved
    const distanceX = state.startX - state.currentX

    // Calculate direction explicitly by comparing with last position
    // This is key to fixing the direction detection issues
    if (state.currentX !== state.lastX) {
      touchState.directionX = state.currentX < state.lastX ? 1 : -1 // 1 = right, -1 = left
      touchState.lastX = state.currentX
      touchState.moved = true // Mark that we've actually moved
    }

    // Update touch state
    touchState.distanceX = distanceX

    // Calculate new transform position
    const newTransformX = state.startTransformX - distanceX * state.multiplier

    // Update virtual state with light transform (no snapping during drag)
    const updatedVirtual = {
      ...state.virtual,
      transformX: newTransformX
    }

    // Apply constraints through transform function
    const transformedVirtual = applyTransform(updatedVirtual, true)

    // Update state
    _holo[state.id].setState = transformedVirtual

    // Keep track of latest virtual state
    touchState.virtual = transformedVirtual

    // Keep tracking velocity during drag
    return {
      id: TOUCH_EVENTS.TRACK_VELOCITY,
      payload: touchState
    }
  })

  // Vertical drag handler
  cyre.on(TOUCH_EVENTS.DRAG_VERTICAL, (state: TouchState) => {
    if (!state.pressed || !state.id || !state.virtual) {
      return
    }

    // Calculate distance moved
    const distanceY = state.startY - state.currentY

    // Calculate direction explicitly
    if (state.currentY !== state.lastY) {
      touchState.directionY = state.currentY < state.lastY ? 1 : -1 // 1 = down, -1 = up
      touchState.lastY = state.currentY
      touchState.moved = true // Mark that we've actually moved
    }

    // Update touch state
    touchState.distanceY = distanceY

    // Calculate new transform position
    const newTransformY = state.startTransformY - distanceY * state.multiplier

    // Update virtual state with light transform (no snapping during drag)
    const updatedVirtual = {
      ...state.virtual,
      transformY: newTransformY
    }

    // Apply constraints through transform function
    const transformedVirtual = applyTransform(updatedVirtual, true)

    // Update state
    _holo[state.id].setState = transformedVirtual

    // Keep track of latest virtual state
    touchState.virtual = transformedVirtual

    // Keep tracking velocity during drag
    return {
      id: TOUCH_EVENTS.TRACK_VELOCITY,
      payload: touchState
    }
  })

  // Velocity tracking handler
  cyre.on(TOUCH_EVENTS.TRACK_VELOCITY, (state: TouchState) => {
    if (!state.pressed || !state.virtual) {
      return
    }

    const elapsed = performance.now() - state.startTime

    // Calculate velocity (pixels per millisecond)
    touchState.velocityX = calculateSwipeSpeed(state.distanceX, elapsed)
    touchState.velocityY = calculateSwipeSpeed(state.distanceY, elapsed)
  })

  // Touch end handler - CRITICAL FOR CORRECT BEHAVIOR
  cyre.on(TOUCH_EVENTS.TOUCH_END, () => {
    if (!touchState.id || !touchState.virtual) {
      return
    }

    // Calculate time elapsed for click detection
    const timeElapsed = performance.now() - touchState.startTime

    // Save a copy of relevant data before resetting state
    const touchData = {
      id: touchState.id,
      virtual: touchState.virtual,
      targetElement: touchState.targetElement,
      distanceX: touchState.distanceX,
      distanceY: touchState.distanceY,
      directionX: touchState.directionX,
      directionY: touchState.directionY,
      velocityX: touchState.velocityX,
      velocityY: touchState.velocityY,
      orientation: touchState.orientation,
      startTime: touchState.startTime,
      moved: touchState.moved, // Include the moved flag to distinguish real swipes
      isNested: touchState.isNested
    }

    // Remove active touch class
    document
      .getElementById(touchState.id)
      ?.classList.remove('holo-touch-active')

    // If nested, resume parent interactions
    if (touchState.isNested) {
      resumeParentCarousels(touchState.id)
    }

    // Reset pressed state immediately to prevent further movement
    touchState.pressed = false

    // Process the end of touch interaction
    return {
      id: TOUCH_EVENTS.PROCESS_TOUCH_END,
      payload: {
        touchState: touchData,
        timeElapsed
      }
    }
  })

  // Process touch end - conditional intralink pattern
  cyre.on(
    TOUCH_EVENTS.PROCESS_TOUCH_END,
    (payload: {touchState: any; timeElapsed: number}) => {
      const {touchState, timeElapsed} = payload

      if (!touchState.id || !touchState.virtual) {
        return
      }

      const carouselId = touchState.id
      const virtual = touchState.virtual
      const targetElement = touchState.targetElement

      // Determine velocity based on orientation
      const velocity = touchState.orientation
        ? touchState.velocityY
        : touchState.velocityX
      const absVelocity = Math.abs(velocity)

      // Get explicit direction from tracked state
      const direction = touchState.orientation
        ? touchState.directionY
        : touchState.directionX

      // Get event IDs from virtual state or use defaults
      const eventIds = virtual.eventIds || {
        nextSlide: `next_slide_${carouselId}`,
        prevSlide: `prev_slide_${carouselId}`,
        snap: `snap_${carouselId}`,
        activate: `activate_${carouselId}`
      }

      // Enable transitions for snapping
      _holo[carouselId].updateStyle = 1

      try {
        // CONDITIONAL INTRALINK: different actions based on gesture

        // Case 1: Swipe/flick (higher velocity) - IMPROVED DETECTION
        if (absVelocity > 0.5 && touchState.moved && virtual.io.swipe !== 0) {
          // Log the swipe for debugging
          CyreLog.info(
            `Swipe detected: direction=${direction}, velocity=${absVelocity}`
          )

          // Determine direction using our explicitly tracked direction
          if (direction > 0) {
            // Swipe right/down (positive direction)
            return {
              id: eventIds.nextSlide,
              payload: virtual
            }
          } else if (direction < 0) {
            // Swipe left/up (negative direction)
            return {
              id: eventIds.prevSlide,
              payload: virtual
            }
          }
        }
        // Case 2: It's a tap/click (short duration, minimal movement)
        else if (
          isClickEvent(timeElapsed) &&
          !touchState.moved && // Only count as click if we didn't really move
          targetElement &&
          virtual.io.onClick
        ) {
          // Find the closest carousel item
          const closestItem = targetElement.closest('.holo')

          if (closestItem) {
            return {
              id: eventIds.activate,
              payload: [closestItem as HTMLElement, virtual]
            }
          }
        }

        // Default case: Snap to nearest position if snap is enabled
        if (virtual.io.snap) {
          return {
            id: eventIds.snap,
            payload: virtual
          }
        }

        // Otherwise, apply transform constraints but don't snap
        const constrainedVirtual = applyTransform(virtual, false)
        _holo[carouselId].setState = constrainedVirtual
      } catch (error) {
        CyreLog.error('Error in touch end processing:', error)

        // Fallback to snap (safest option)
        return {
          id: eventIds.snap,
          payload: virtual
        }
      }
    }
  )

  // Configure touch event actions
  cyre.action([
    {
      id: TOUCH_EVENTS.TOUCH_START,
      throttle: 50 // Prevent double triggers
    },
    {
      id: TOUCH_EVENTS.DRAG_HORIZONTAL
    },
    {
      id: TOUCH_EVENTS.DRAG_VERTICAL
    },
    {
      id: TOUCH_EVENTS.TRACK_VELOCITY,
      throttle: 100 // Don't need constant updates
    },
    {
      id: TOUCH_EVENTS.TOUCH_END,
      throttle: 50
    },
    {
      id: TOUCH_EVENTS.PROCESS_TOUCH_END
    }
  ])
}

/**
 * Register document-level event listeners for touch/mouse
 */
function registerDomEventListeners(): void {
  // Mouse/touch move handler
  const handlePointerMove = (e: MouseEvent | TouchEvent): void => {
    if (!touchState.pressed || !touchState.id) return

    // Prevent default to avoid page scrolling during drag
    e.preventDefault()

    // Update current position
    if ('touches' in e && e.touches.length > 0) {
      touchState.currentX = e.touches[0].clientX
      touchState.currentY = e.touches[0].clientY
    } else if ('clientX' in e) {
      touchState.currentX = e.clientX
      touchState.currentY = e.clientY
    } else {
      // If no valid coordinates, end the touch interaction
      handlePointerEnd(e)
      return
    }

    // Call appropriate drag event based on orientation
    cyre.call(
      touchState.orientation
        ? TOUCH_EVENTS.DRAG_VERTICAL
        : TOUCH_EVENTS.DRAG_HORIZONTAL,
      touchState
    )
  }

  // Mouse/touch end handler
  const handlePointerEnd = (e: MouseEvent | TouchEvent): void => {
    // Only process if we're in a pressed state
    if (!touchState.pressed) return

    // Prevent default behavior
    e.preventDefault()

    // Call the touch end event
    cyre.call(TOUCH_EVENTS.TOUCH_END)
  }

  // Add document-level listeners to catch events even if they occur outside the element
  document.addEventListener('mousemove', handlePointerMove, {passive: false})
  document.addEventListener('touchmove', handlePointerMove, {passive: false})
  document.addEventListener('mouseup', handlePointerEnd, {passive: false})
  document.addEventListener('touchend', handlePointerEnd, {passive: false})
  document.addEventListener('touchcancel', handlePointerEnd, {passive: false})
  document.addEventListener('mouseleave', handlePointerEnd, {passive: false})
}

/**
 * Public handler for touch/mouse start events
 * Enhanced to support nested carousels
 */
export const handleTouchStart = (
  event: MouseEvent | TouchEvent,
  id: string,
  options: {stopPropagation?: boolean} = {}
): void => {
  // Prevent default behavior
  event.preventDefault()

  // Stop propagation if requested (needed for nested carousels)
  if (options.stopPropagation) {
    event.stopPropagation()
  }

  // Call the touch start event with event info and carousel ID
  cyre.call(TOUCH_EVENTS.TOUCH_START, {event, id, options})
}

/**
 * Special touch start handler for nested carousels
 * Always stops propagation
 */
export const handleNestedTouchStart = (
  event: MouseEvent | TouchEvent,
  id: string
): void => {
  event.stopPropagation()
  handleTouchStart(event, id, {stopPropagation: true})
}

/**
 * Calculates swipe speed from distance and time
 */
const calculateSwipeSpeed = (distance: number, timeElapsed: number): number => {
  return distance / (timeElapsed || 1)
}

/**
 * Determines if interaction was a click based on time elapsed
 */
const isClickEvent = (timeElapsed: number): boolean => {
  return timeElapsed < 300
}

/**
 * Add CSS for touch interactions
 */
export const injectTouchStyles = (): void => {
  if (document.getElementById('holo-touch-styles')) return

  const style = document.createElement('style')
  style.id = 'holo-touch-styles'

  style.textContent = `
    /* Base touch styles */
    .holo-touch-active {
      cursor: grabbing !important;
    }
    
    /* Nested carousel touch styles */
    .holo-carousel[data-nested="true"] {
      touch-action: none;
      z-index: 2;
    }
    
    /* Parent carousel with active child */
    .holo-carousel[data-child-active="true"] {
      pointer-events: none;
    }
    
    .holo-carousel[data-child-active="true"] .holo-container {
      transition: none !important;
    }
    
    /* But allow child events */
    .holo-carousel[data-child-active="true"] [data-nested="true"] {
      pointer-events: auto;
    }
  `

  document.head.appendChild(style)
}

// Inject touch styles on init
injectTouchStyles()

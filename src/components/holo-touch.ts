//src/components/holo-touch.ts

import {cyre, CyreLog} from 'cyre'
import type {HoloVirtual} from '../types/interface'
import {_holo} from '../libs/holo-essentials'
import {
  transformXLite,
  transformYLite,
  applyTransform
} from './orientation-handler'
import {TOUCH_EVENTS, EVENTS} from '../config/holo-config'

/**
 * TouchState interface for tracking touch interactions
 */
interface TouchState {
  id: string | null
  virtual: HoloVirtual | null
  startX: number
  startY: number
  currentX: number
  currentY: number
  distanceX: number
  distanceY: number
  velocityX: number
  velocityY: number
  startTransformX: number
  startTransformY: number
  pressed: boolean
  startTime: number
  multiplier: number
  orientation: boolean
  targetElement: HTMLElement | null
}

// Create shared touch state
const touchState: TouchState = {
  id: null,
  virtual: null,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  distanceX: 0,
  distanceY: 0,
  velocityX: 0,
  velocityY: 0,
  startTransformX: 0,
  startTransformY: 0,
  pressed: false,
  startTime: 0,
  multiplier: 1.5,
  orientation: false,
  targetElement: null
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
    (payload: {event: TouchEvent | MouseEvent; id: string}) => {
      const {event, id} = payload

      if (!_holo[id]?.getVirtual) {
        CyreLog.error(`No carousel found with ID: ${id}`)
        return
      }

      const virtual = _holo[id].getVirtual

      // Check if touch is disabled in options
      if (virtual.io.drag === 0 && virtual.io.swipe === 0) {
        return
      }

      // Update touch state
      touchState.id = id
      touchState.virtual = virtual
      touchState.startX =
        'touches' in event ? event.touches[0].clientX : event.clientX
      touchState.startY =
        'touches' in event ? event.touches[0].clientY : event.clientY
      touchState.currentX = touchState.startX
      touchState.currentY = touchState.startY
      touchState.distanceX = 0
      touchState.distanceY = 0
      touchState.velocityX = 0
      touchState.velocityY = 0
      touchState.startTransformX = virtual.transformX
      touchState.startTransformY = virtual.transformY
      touchState.pressed = true
      touchState.startTime = performance.now()
      touchState.orientation = !!virtual.io.orientation
      touchState.targetElement = event.target as HTMLElement

      // Disable transitions during drag
      _holo[id].updateStyle = 0

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

    // Update touch state
    touchState.distanceX = distanceX

    // Calculate new transform position
    const newTransformX = state.startTransformX - distanceX * state.multiplier

    // Apply constraints and update virtual state (without transitions)
    const updatedVirtual = transformXLite({
      ...state.virtual,
      transformX: newTransformX
    })

    // Update state
    _holo[state.id].setState = updatedVirtual

    // Keep track of latest virtual state
    touchState.virtual = updatedVirtual

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

    // Update touch state
    touchState.distanceY = distanceY

    // Calculate new transform position
    const newTransformY = state.startTransformY - distanceY * state.multiplier

    // Apply constraints and update virtual state (without transitions)
    const updatedVirtual = transformYLite({
      ...state.virtual,
      transformY: newTransformY
    })

    // Update state
    _holo[state.id].setState = updatedVirtual

    // Keep track of latest virtual state
    touchState.virtual = updatedVirtual

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

  // Touch end handler
  cyre.on(TOUCH_EVENTS.TOUCH_END, () => {
    if (!touchState.pressed || !touchState.id || !touchState.virtual) {
      return
    }

    // Reset pressed state
    touchState.pressed = false

    // Calculate time elapsed for click detection
    const timeElapsed = performance.now() - touchState.startTime

    // Determine the appropriate action based on context
    return {
      id: TOUCH_EVENTS.PROCESS_TOUCH_END,
      payload: {
        touchState: {...touchState}, // Send a copy to avoid mutation issues
        timeElapsed
      }
    }
  })

  // Process touch end - conditional intralink pattern
  cyre.on(
    TOUCH_EVENTS.PROCESS_TOUCH_END,
    (payload: {touchState: TouchState; timeElapsed: number}) => {
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

        // Case 1: Swipe/flick (higher velocity)
        if (absVelocity > 0.8 && virtual.io.swipe !== 0) {
          // Determine direction
          if (
            touchState.orientation
              ? touchState.distanceY > 0
              : touchState.distanceX > 0
          ) {
            // Swipe in positive direction (right/down)
            return {
              id: eventIds.nextSlide,
              payload: virtual
            }
          } else {
            // Swipe in negative direction (left/up)
            return {
              id: eventIds.prevSlide,
              payload: virtual
            }
          }
        }
        // Case 2: It's a tap/click (short duration)
        else if (
          isClickEvent(timeElapsed) &&
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

//src/components/holo-touch.ts

// In the registerDomEventListeners function:
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

  // Mouse/touch end handler - IMPORTANT FIX HERE
  const handlePointerEnd = (e: MouseEvent | TouchEvent): void => {
    // Only process if we're in a pressed state
    if (!touchState.pressed) return

    // Prevent default behavior
    e.preventDefault()

    // Call the touch end event
    cyre.call(TOUCH_EVENTS.TOUCH_END)

    // Immediately reset pressed state to prevent further movement
    touchState.pressed = false
    touchState.id = null
    touchState.virtual = null
  }

  // Add document-level listeners to catch events even if they occur outside the element
  document.addEventListener('mousemove', handlePointerMove, {passive: false})
  document.addEventListener('touchmove', handlePointerMove, {passive: false})
  document.addEventListener('mouseup', handlePointerEnd, {passive: false})
  document.addEventListener('touchend', handlePointerEnd, {passive: false})
  document.addEventListener('touchcancel', handlePointerEnd, {passive: false}) // Add this for better touch handling
  document.addEventListener('mouseleave', handlePointerEnd, {passive: false})
}

// Also fix the TOUCH_END event handler:
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
    velocityX: touchState.velocityX,
    velocityY: touchState.velocityY,
    orientation: touchState.orientation,
    startTime: touchState.startTime
  }

  // Process the end of touch interaction
  return {
    id: TOUCH_EVENTS.PROCESS_TOUCH_END,
    payload: {
      touchState: touchData,
      timeElapsed
    }
  }
})

/**
 * Public handler for touch/mouse start events
 */
export const handleTouchStart = (
  event: MouseEvent | TouchEvent,
  id: string
): void => {
  event.preventDefault()

  // Call the touch start event with event info and carousel ID
  cyre.call(TOUCH_EVENTS.TOUCH_START, {event, id})
}

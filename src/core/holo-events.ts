//src/core/holo-events.ts

import {cyre, CyreLog} from 'cyre'
import type {HoloVirtual, HoloShadow} from '../types/interface'
import {EVENTS, ANIMATION} from '../config/holo-config'
import {_holo} from '../libs/holo-essentials'
import {transformX, transformY} from '../components/orientation-handler'
import {
  calculateCarouselDimensions,
  isVisibilityAvailable
} from '../libs/holo-dom'
import {calculateCarouselDimensionsFixed} from '../libs/holo-dom-fix'

/**
 * Creates instance-specific event IDs for this carousel
 * @param id Carousel ID
 * @returns Object with event IDs for this instance
 */
export const createEventIds = (id: string) => ({
  animate: `animate_${id}`,
  snap: `snap_${id}`,
  prevSlide: `prev_slide_${id}`,
  nextSlide: `next_slide_${id}`,
  lastSlide: `last_slide_${id}`,
  firstSlide: `first_slide_${id}`,
  goToSlide: `go_to_slide_${id}`,
  activate: `activate_${id}`,
  refresh: `refresh_${id}`,
  transform: `transform_${id}`,
  stateUpdate: `state_update_${id}`,
  dimensionUpdate: `dimension_update_${id}`,
  error: `error_${id}`
})

/**
 * Safely calls a cyre event with fallback
 * @param eventId Primary event ID to call
 * @param payload Event payload
 * @param fallbackEventId Optional fallback event if primary fails
 * @returns Success indicator
 */
export const safeEventCall = (
  eventId: string,
  payload: any,
  fallbackEventId?: string
): boolean => {
  try {
    cyre.call(eventId, payload)
    return true
  } catch (error) {
    CyreLog.warn(`Failed to call event ${eventId}`, error)

    // Try fallback if provided
    if (fallbackEventId) {
      try {
        CyreLog.info(`Attempting fallback to ${fallbackEventId}`)
        cyre.call(fallbackEventId, payload)
        return true
      } catch (fallbackError) {
        CyreLog.error(
          `Fallback to ${fallbackEventId} also failed`,
          fallbackError
        )
      }
    }

    return false
  }
}

/**
 * Initialize the event system with centralized event handlers
 * All events are organized into logical groups with reusable listener patterns
 */
export const initializeEventSystem = (): void => {
  CyreLog.info('Initializing Holo event system')

  // Register event handlers
  registerStateEvents()
  registerDimensionEvents()
  registerNavigationEvents()
  registerTransformEvents()
  registerErrorEvents()
  registerPerformanceEvents()

  // Register global actions
  registerGlobalActions()
}

/**
 * Register state update events
 * These handle state synchronization between virtual and DOM
 */
function registerStateEvents() {
  // State batch update for multiple changes
  cyre.on(EVENTS.STATE_BATCH_UPDATE, payload => {
    if (!payload || !payload.id) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'state_batch_update',
          error: 'Invalid batch update payload',
          data: payload
        }
      }
    }

    const {id, changes} = payload
    const virtual = _holo[id]?.getVirtual

    if (!virtual) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'state_batch_update',
          error: `Carousel ${id} not found for batch update`,
          id
        }
      }
    }

    // Apply all changes at once
    _holo[id].setState = {...virtual, ...changes}

    // Return positioned state to trigger snap or rendering
    return {
      id: EVENTS.SNAP_TO_POSITION,
      payload: _holo[id].getVirtual
    }
  })

  // Single state update for a specific property
  cyre.on(EVENTS.STATE_UPDATE, payload => {
    if (!payload || !payload.id || !payload.property) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'state_update',
          error: 'Invalid state update payload',
          data: payload
        }
      }
    }

    const {id, property, value} = payload
    const virtual = _holo[id]?.getVirtual

    if (!virtual) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'state_update',
          error: `Carousel ${id} not found for state update`,
          id
        }
      }
    }

    // Update the specific property
    _holo[id].setState = {
      ...virtual,
      [property]: value
    }

    // Only return to snap if position-related property
    if (['transformX', 'transformY'].includes(property)) {
      return {
        id: EVENTS.SNAP_TO_POSITION,
        payload: _holo[id].getVirtual
      }
    }
  })
}

/**
 * Register dimension calculation events
 * These handle calculating and updating carousel dimensions
 */
function registerDimensionEvents() {
  // Initial dimension calculation after DOM is ready
  cyre.on(EVENTS.INIT_DIMENSIONS, payload => {
    if (!payload || !payload.id) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'init_dimensions',
          error: 'Invalid init dimensions payload',
          data: payload
        }
      }
    }

    const {id} = payload

    if (!_holo[id]) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'init_dimensions',
          error: `Carousel ${id} not found for dimension init`,
          id
        }
      }
    }

    const virtual = _holo[id].getVirtual
    const shadow = _holo[id].getShadow

    // Ensure we have DOM access
    if (!isVisibilityAvailable()) {
      // Queue for later when DOM is available
      CyreLog.info(
        `Deferring dimensions calculation for ${id} until DOM is visible`
      )
      setTimeout(() => cyre.call(EVENTS.INIT_DIMENSIONS, {id}), 100)
      return
    }

    try {
      // Try the fixed calculation method first
      const updatedVirtual = calculateCarouselDimensionsFixed(virtual, shadow)

      if (updatedVirtual) {
        // Store updated dimensions
        _holo[id].setDimension = {...updatedVirtual}

        // Continue to position carousel
        return {
          id: EVENTS.SNAP_TO_POSITION,
          payload: updatedVirtual
        }
      }

      // If that failed, try the original method as fallback
      const fallbackVirtual = calculateCarouselDimensions(virtual, shadow)

      if (fallbackVirtual) {
        // Store updated dimensions
        _holo[id].setDimension = {...fallbackVirtual}

        // Continue to position carousel
        return {
          id: EVENTS.SNAP_TO_POSITION,
          payload: fallbackVirtual
        }
      }

      // If we're still here, neither method worked - retry with a delay
      setTimeout(() => {
        cyre.call(EVENTS.INIT_DIMENSIONS, {id})
      }, 300)
    } catch (error) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'dimension_calculation',
          id,
          error
        }
      }
    }
  })

  // Carousel refresh handler (recalculates dimensions)
  cyre.on(
    EVENTS.REFRESH_CAROUSEL,
    (state: {virtual: HoloVirtual; shadow: HoloShadow}) => {
      try {
        const {virtual, shadow} = state

        if (!virtual?.id) {
          return {
            id: EVENTS.ERROR_HANDLER,
            payload: {
              source: 'refresh_carousel',
              error: 'Invalid virtual state',
              data: {virtualId: virtual?.id}
            }
          }
        }

        // Reset container styles for fresh measurement
        shadow.container.setAttribute('style', '')

        // Use the fixed calculation method first
        const updatedVirtual = calculateCarouselDimensionsFixed(virtual, shadow)

        if (updatedVirtual) {
          // Store updated state
          _holo[virtual.id].setDimension = {...updatedVirtual}
        } else {
          // If fixed method fails, try original method
          const fallbackVirtual = calculateCarouselDimensions(virtual, shadow)

          if (!fallbackVirtual) {
            // If both methods fail, report error and retry with delay
            setTimeout(() => {
              // One last attempt with delay
              const delayedVirtual = calculateCarouselDimensionsFixed(
                virtual,
                shadow
              )
              if (delayedVirtual) {
                _holo[virtual.id].setDimension = {...delayedVirtual}
                // Continue with the updated state
                cyre.call(EVENTS.SNAP_TO_POSITION, delayedVirtual)
              }
            }, 300)

            return {
              id: EVENTS.ERROR_HANDLER,
              payload: {
                source: 'refresh_carousel',
                error: 'Failed to calculate dimensions',
                id: virtual.id
              }
            }
          }

          // Store updated state from fallback
          _holo[virtual.id].setDimension = {...fallbackVirtual}
        }

        // Continue the event chain to positioning
        return {
          id: EVENTS.SNAP_TO_POSITION,
          payload: updatedVirtual || virtual
        }
      } catch (error) {
        return {
          id: EVENTS.ERROR_HANDLER,
          payload: {
            source: 'refresh_carousel',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    }
  )

  // Handle screen refresh (window resize)
  cyre.on(EVENTS.REFRESH_SCREEN, () => {
    // Get all carousel IDs
    const carouselIds = Object.keys(_holo)

    CyreLog.info(`Refreshing ${carouselIds.length} carousels`)

    // Refresh each carousel
    carouselIds.forEach(id => {
      cyre.call(EVENTS.REFRESH_CAROUSEL, _holo[id].getState)
    })
  })
}

/**
 * Register navigation events
 * These handle movement between slides
 */
function registerNavigationEvents() {
  // Go to next slide
  //src/core/holo-events.ts

  // Update in the registerNavigationEvents function:

  // Go to next slide
  cyre.on(EVENTS.NEXT_SLIDE, (virtual: HoloVirtual) => {
    if (!virtual?.id) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'next_slide',
          error: 'Invalid virtual state in next slide'
        }
      }
    }

    // Check if at the end
    if (virtual.endOfSlide === -1 && !virtual.io.loop) {
      // Already at the end and no loop configured
      return
    }

    // Loop back to start if needed
    if (virtual.endOfSlide === -1 && virtual.io.loop) {
      return {
        id: EVENTS.FIRST_SLIDE,
        payload: virtual
      }
    }

    // Calculate slide width/height based on orientation
    const slideDimension = virtual.io.orientation
      ? virtual.item.height || 0
      : virtual.item.width || 0

    if (!slideDimension) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'next_slide',
          error: `Carousel ${virtual.id} item ${
            virtual.io.orientation ? 'height' : 'width'
          } not calculated yet`,
          id: virtual.id
        }
      }
    }

    // IMPROVED: Calculate the current position and determine next slide position
    const currentPosition = virtual.io.orientation
      ? virtual.transformY
      : virtual.transformX

    const currentIndex = Math.round(Math.abs(currentPosition) / slideDimension)
    const nextIndex = currentIndex + 1

    // Calculate the new transform position
    const newTransform = -Math.abs(nextIndex * slideDimension)

    // Ensure we don't go beyond limits
    const minPosition = virtual.io.orientation
      ? virtual.endOfSlidePosition
      : virtual.endOfSlidePosition

    const newPosition = Math.max(newTransform, minPosition)

    // Create updated virtual state with new position
    const updatedVirtual = {
      ...virtual,
      transformX: virtual.io.orientation ? virtual.transformX : newPosition,
      transformY: virtual.io.orientation ? newPosition : virtual.transformY
    }

    // Log navigation for debugging
    CyreLog.info(
      `Navigating to next slide: ${currentIndex} -> ${nextIndex}, position: ${currentPosition} -> ${newPosition}`
    )

    // Go to snap position
    return {
      id: EVENTS.SNAP_TO_POSITION,
      payload: updatedVirtual
    }
  })

  // Same improvements needed for PREV_SLIDE and GO_TO_SLIDE events

  // Go to previous slide
  cyre.on(EVENTS.PREV_SLIDE, (virtual: HoloVirtual) => {
    if (!virtual?.id) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'prev_slide',
          error: 'Invalid virtual state in previous slide'
        }
      }
    }

    // Check if at the beginning
    if (virtual.endOfSlide === 1 && !virtual.io.loop) {
      return
    }

    // Loop to end if needed
    if (virtual.endOfSlide === 1 && virtual.io.loop) {
      return {
        id: EVENTS.LAST_SLIDE,
        payload: virtual
      }
    }

    // Calculate slide width/height based on orientation
    const slideDimension = virtual.io.orientation
      ? virtual.item.height || 0
      : virtual.item.width || 0

    if (!slideDimension) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'prev_slide',
          error: `Carousel ${virtual.id} item ${
            virtual.io.orientation ? 'height' : 'width'
          } not calculated yet`,
          id: virtual.id
        }
      }
    }

    // Create updated virtual state with new position
    const updatedVirtual = {
      ...virtual,
      transformX: virtual.io.orientation
        ? virtual.transformX
        : virtual.transformX + slideDimension,
      transformY: virtual.io.orientation
        ? virtual.transformY + slideDimension
        : virtual.transformY
    }

    // Go to snap position
    return {
      id: EVENTS.SNAP_TO_POSITION,
      payload: updatedVirtual
    }
  })

  // Go to first slide
  cyre.on(EVENTS.FIRST_SLIDE, (virtual: HoloVirtual) => {
    if (!virtual?.id) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'first_slide',
          error: 'Invalid virtual state in first slide'
        }
      }
    }

    // Create updated virtual state with start position
    const updatedVirtual = {
      ...virtual,
      transformX: 0,
      transformY: 0,
      endOfSlide: 1 // At the start
    }

    // Go to snap position
    return {
      id: EVENTS.SNAP_TO_POSITION,
      payload: updatedVirtual
    }
  })

  // Go to last slide
  cyre.on(EVENTS.LAST_SLIDE, (virtual: HoloVirtual) => {
    if (!virtual?.id) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'last_slide',
          error: 'Invalid virtual state in last slide'
        }
      }
    }

    if (virtual.endOfSlidePosition === undefined) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'last_slide',
          error: `Carousel ${virtual.id} end position not calculated`,
          id: virtual.id
        }
      }
    }

    // Create updated virtual state with end position
    const updatedVirtual = {
      ...virtual,
      transformX: virtual.io.orientation ? 0 : virtual.endOfSlidePosition,
      transformY: virtual.io.orientation ? virtual.endOfSlidePosition : 0,
      endOfSlide: -1 // At the end
    }

    // Go to snap position
    return {
      id: EVENTS.SNAP_TO_POSITION,
      payload: updatedVirtual
    }
  })

  // Go to specific slide index
  cyre.on(
    EVENTS.GO_TO_SLIDE,
    (payload: {virtual: HoloVirtual; index: number}) => {
      if (!payload || !payload.virtual || !payload.virtual.id) {
        return {
          id: EVENTS.ERROR_HANDLER,
          payload: {
            source: 'go_to_slide',
            error: 'Invalid payload for go to slide'
          }
        }
      }

      const {virtual, index} = payload

      // Calculate slide width/height based on orientation
      const slideDimension = virtual.io.orientation
        ? virtual.item.height || 0
        : virtual.item.width || 0

      if (!slideDimension) {
        return {
          id: EVENTS.ERROR_HANDLER,
          payload: {
            source: 'go_to_slide',
            error: `Carousel ${virtual.id} item ${
              virtual.io.orientation ? 'height' : 'width'
            } not calculated yet`,
            id: virtual.id
          }
        }
      }

      // Create updated virtual state with calculated position
      const updatedVirtual = {
        ...virtual,
        transformX: virtual.io.orientation
          ? 0
          : -Math.abs(index * slideDimension),
        transformY: virtual.io.orientation
          ? -Math.abs(index * slideDimension)
          : 0
      }

      // Go to snap position
      return {
        id: EVENTS.SNAP_TO_POSITION,
        payload: updatedVirtual
      }
    }
  )

  // Activate specific slide (focus on click)
  cyre.on(EVENTS.ACTIVATE, (payload: [HTMLElement, HoloVirtual]) => {
    const [element, virtual] = payload

    if (!element || !virtual || !virtual.id) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'activate',
          error: 'Invalid activate payload'
        }
      }
    }

    // Get offset positions of all slides
    const {offsets, selectedIndex} = getSlideOffsets(virtual, element)

    if (selectedIndex === -1) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'activate',
          error: 'Could not determine slide index',
          id: virtual.id
        }
      }
    }

    // Update active class
    document.querySelectorAll(`#${virtual.id} .holo`).forEach(el => {
      el.classList.remove('active')
    })
    element.classList.add('active')

    // Create updated virtual state with new position based on offset
    const updatedVirtual = {
      ...virtual,
      transformX: virtual.io.orientation
        ? virtual.transformX
        : -Math.abs(offsets[selectedIndex]),
      transformY: virtual.io.orientation
        ? -Math.abs(offsets[selectedIndex])
        : virtual.transformY
    }

    // Go to snap position
    return {
      id: EVENTS.SNAP_TO_POSITION,
      payload: updatedVirtual
    }
  })

  // Auto-animate forward
  cyre.on(EVENTS.ANIMATE_FORWARD, (virtual: HoloVirtual) => {
    if (!virtual || !virtual.id) return

    if (virtual.endOfSlide === -1 && virtual.io.loop) {
      // Loop back to start when at the end
      return {
        id: EVENTS.FIRST_SLIDE,
        payload: virtual
      }
    } else {
      // Go to next slide
      return {
        id: EVENTS.NEXT_SLIDE,
        payload: virtual
      }
    }
  })

  // Auto-animate backward
  cyre.on(EVENTS.ANIMATE_BACKWARD, (virtual: HoloVirtual) => {
    if (!virtual || !virtual.id) return

    if (virtual.endOfSlide === 1 && virtual.io.loop) {
      // Loop to end when at the start
      return {
        id: EVENTS.LAST_SLIDE,
        payload: virtual
      }
    } else {
      // Go to previous slide
      return {
        id: EVENTS.PREV_SLIDE,
        payload: virtual
      }
    }
  })
}

/**
 * Register transform events
 * These handle the actual DOM transformations
 */
function registerTransformEvents() {
  // Snap to position handler
  cyre.on(EVENTS.SNAP_TO_POSITION, (virtual: HoloVirtual) => {
    // Just forward to SNAP (simpler name and logic separation)
    return {
      id: EVENTS.SNAP,
      payload: virtual
    }
  })

  // Snap handler (final step in the chain)
  cyre.on(EVENTS.SNAP, (virtual: HoloVirtual) => {
    if (!virtual?.id) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'snap',
          error: 'Invalid virtual state in SNAP event'
        }
      }
    }

    CyreLog.info(
      `SNAP event for ${virtual.id}: transformX=${virtual.transformX}, transformY=${virtual.transformY}`
    )

    try {
      // Validate dimensions first to prevent NaN errors
      if (
        virtual.io.orientation &&
        (!virtual.item.height || isNaN(virtual.item.height))
      ) {
        CyreLog.warn(
          `Carousel ${virtual.id} item height not calculated yet. Attempting to fix...`
        )
        // Try to recalculate dimensions
        setTimeout(() => {
          cyre.call(EVENTS.REFRESH_CAROUSEL, _holo[virtual.id].getState)
        }, 100)
        return
      }

      if (
        !virtual.io.orientation &&
        (!virtual.item.width || isNaN(virtual.item.width))
      ) {
        CyreLog.warn(
          `Carousel ${virtual.id} item width not calculated yet. Attempting to fix...`
        )
        // Try to recalculate dimensions
        setTimeout(() => {
          cyre.call(EVENTS.REFRESH_CAROUSEL, _holo[virtual.id].getState)
        }, 100)
        return
      }

      // Update style to enable transitions
      _holo[virtual.id].updateStyle = 1

      // Apply orientation-specific transforms
      const transformedVirtual = virtual.io.orientation
        ? transformY(virtual)
        : transformX(virtual)

      // Safety check for NaN values
      if (
        isNaN(transformedVirtual.transformX) ||
        isNaN(transformedVirtual.transformY)
      ) {
        CyreLog.error(
          `NaN transform values detected for ${virtual.id}: X=${transformedVirtual.transformX}, Y=${transformedVirtual.transformY}`
        )
        // Try to repair
        transformedVirtual.transformX = isNaN(transformedVirtual.transformX)
          ? 0
          : transformedVirtual.transformX
        transformedVirtual.transformY = isNaN(transformedVirtual.transformY)
          ? 0
          : transformedVirtual.transformY
      }

      // Update state immutably
      _holo[virtual.id].setState = {...transformedVirtual}

      // CRITICAL: Direct DOM manipulation for immediate visual feedback
      const carousel = document.getElementById(virtual.id)
      if (carousel) {
        const container = carousel.querySelector(
          '.holo-container'
        ) as HTMLElement
        if (container) {
          // Ensure we're never passing NaN values to CSS
          const safeX = isNaN(transformedVirtual.transformX)
            ? 0
            : transformedVirtual.transformX
          const safeY = isNaN(transformedVirtual.transformY)
            ? 0
            : transformedVirtual.transformY

          container.style.transform = `translate3d(${safeX}px, ${safeY}px, 0px)`
          CyreLog.debug(
            `Applied direct transform: translate3d(${safeX}px, ${safeY}px, 0px)`
          )
        }
      }

      // Return the event for visualization or UI updates if needed
      return {
        id: EVENTS.TRANSFORM_COMPLETE,
        payload: {
          id: virtual.id,
          position: virtual.io.orientation
            ? Math.abs(
                Math.round(
                  transformedVirtual.transformY /
                    (transformedVirtual.item.height || 1)
                )
              )
            : Math.abs(
                Math.round(
                  transformedVirtual.transformX /
                    (transformedVirtual.item.width || 1)
                )
              )
        }
      }
    } catch (error) {
      return {
        id: EVENTS.ERROR_HANDLER,
        payload: {
          source: 'snap',
          error: error instanceof Error ? error.message : 'Error in SNAP event',
          id: virtual.id
        }
      }
    }
  })

  // Transform complete handler (for UI updates)
  cyre.on(EVENTS.TRANSFORM_COMPLETE, payload => {
    // No additional action needed, but can be subscribed to by UI components
    // for updating indicators or other UI elements
  })
}

/**
 * Register error handling events
 */
function registerErrorEvents() {
  // Central error handler
  cyre.on(EVENTS.ERROR_HANDLER, payload => {
    const {source, error, id} = payload

    CyreLog.error(`Holo Error [${source}]:`, error)

    // For ID-specific errors, we can try recovery actions
    if (id && _holo[id]) {
      // Example recovery: Try to refresh the carousel
      if (source === 'dimension_calculation') {
        CyreLog.info(`Attempting to recover ${id} via refresh`)
        setTimeout(
          () => cyre.call(EVENTS.REFRESH_CAROUSEL, _holo[id].getState),
          200
        )
      }
    }
  })
}

/**
 * Register performance monitoring events
 */
function registerPerformanceEvents() {
  // Performance monitor
  cyre.on(EVENTS.PERFORMANCE_MONITOR, payload => {
    const {id} = payload

    if (!id || !_holo[id]) return

    // Get Cyre performance metrics
    const metrics = cyre.getPerformanceState()

    // If stress is high, apply optimizations
    if (metrics.stress > 0.8) {
      return {
        id: EVENTS.PERFORMANCE_OPTIMIZE,
        payload: {
          id,
          stress: metrics.stress,
          level: 'high'
        }
      }
    } else if (metrics.stress > 0.5) {
      return {
        id: EVENTS.PERFORMANCE_OPTIMIZE,
        payload: {
          id,
          stress: metrics.stress,
          level: 'medium'
        }
      }
    }
  })

  // Performance optimization
  cyre.on(EVENTS.PERFORMANCE_OPTIMIZE, payload => {
    const {id, level} = payload

    if (!id || !_holo[id]) return

    const virtual = _holo[id].getVirtual

    // Apply optimizations based on level
    switch (level) {
      case 'high':
        // Disable animations, increase throttling
        _holo[id].setState = {
          ...virtual,
          io: {
            ...virtual.io,
            animate: 0,
            wheel: 0,
            duration: Math.max(400, virtual.io.duration || 0)
          }
        }
        break
      case 'medium':
        // Slow down animations
        _holo[id].setState = {
          ...virtual,
          io: {
            ...virtual.io,
            duration: Math.max(300, virtual.io.duration || 0)
          }
        }
        break
    }
  })
}

/**
 * Register global actions with appropriate protection settings
 */
function registerGlobalActions() {
  cyre.action([
    // Core state events
    {
      id: EVENTS.STATE_UPDATE,
      detectChanges: true, // Only process if data changed
      throttle: 50 // Prevent rapid updates
    },
    {
      id: EVENTS.STATE_BATCH_UPDATE,
      detectChanges: true
    },

    // Dimension events
    {
      id: EVENTS.INIT_DIMENSIONS,
      throttle: 100
    },
    {
      id: EVENTS.REFRESH_CAROUSEL,
      throttle: 100
    },
    {
      id: EVENTS.REFRESH_SCREEN,
      throttle: 200 // Limit excessive resize handling
    },

    // Navigation events
    {
      id: EVENTS.NEXT_SLIDE,
      throttle: 300 // Prevent rapid clicking
    },
    {
      id: EVENTS.PREV_SLIDE,
      throttle: 300
    },
    {
      id: EVENTS.FIRST_SLIDE
    },
    {
      id: EVENTS.LAST_SLIDE
    },
    {
      id: EVENTS.GO_TO_SLIDE,
      throttle: 300
    },
    {
      id: EVENTS.ACTIVATE,
      throttle: 300
    },

    // Transform events
    {
      id: EVENTS.SNAP_TO_POSITION,
      throttle: 50
    },
    {
      id: EVENTS.SNAP,
      throttle: 50
    },
    {
      id: EVENTS.TRANSFORM_COMPLETE
    },

    // Error handling
    {
      id: EVENTS.ERROR_HANDLER
    },

    // Performance events
    {
      id: EVENTS.PERFORMANCE_MONITOR,
      interval: 5000, // Check every 5 seconds
      repeat: true // Run continuously
    },
    {
      id: EVENTS.PERFORMANCE_OPTIMIZE,
      throttle: 1000 // Apply optimizations at most once per second
    }
  ])
}

/**
 * Initialize event handlers for a specific carousel instance
 * Creates custom event IDs for this instance and links them to global handlers
 */
export const initializeInstanceEvents = (
  id: string,
  options: any = {}
): void => {
  if (!id || typeof id !== 'string') {
    CyreLog.error(`Cannot initialize events for invalid carousel: ${id}`)
    return
  }

  if (!_holo[id]) {
    CyreLog.error(`Carousel ${id} not found for event initialization`)
    return
  }

  const virtual = _holo[id].getVirtual

  // Create instance-specific event IDs
  const eventIds = createEventIds(id)

  // Store these IDs in the virtual state for reference
  _holo[id].setState = {
    ...virtual,
    eventIds
  }

  // Register instance-specific handlers that forward to global ones
  cyre.on(eventIds.animate, payload => {
    return {
      id:
        virtual.io.animateDirection > 0
          ? EVENTS.ANIMATE_FORWARD
          : EVENTS.ANIMATE_BACKWARD,
      payload
    }
  })

  cyre.on(eventIds.snap, payload => {
    return {
      id: EVENTS.SNAP,
      payload
    }
  })

  cyre.on(eventIds.prevSlide, payload => {
    return {
      id: EVENTS.PREV_SLIDE,
      payload
    }
  })

  cyre.on(eventIds.nextSlide, payload => {
    return {
      id: EVENTS.NEXT_SLIDE,
      payload
    }
  })

  cyre.on(eventIds.firstSlide, payload => {
    return {
      id: EVENTS.FIRST_SLIDE,
      payload
    }
  })

  cyre.on(eventIds.lastSlide, payload => {
    return {
      id: EVENTS.LAST_SLIDE,
      payload
    }
  })

  cyre.on(eventIds.goToSlide, payload => {
    return {
      id: EVENTS.GO_TO_SLIDE,
      payload: {
        virtual: _holo[id].getVirtual,
        index: payload.index
      }
    }
  })

  cyre.on(eventIds.activate, payload => {
    return {
      id: EVENTS.ACTIVATE,
      payload
    }
  })

  cyre.on(eventIds.refresh, payload => {
    return {
      id: EVENTS.REFRESH_CAROUSEL,
      payload: payload || _holo[id].getState
    }
  })

  cyre.on(eventIds.error, payload => {
    return {
      id: EVENTS.ERROR_HANDLER,
      payload: {
        ...payload,
        id
      }
    }
  })

  // Configure instance-specific actions
  cyre.action([
    {
      id: eventIds.animate,
      interval: options.duration || ANIMATION.DURATION,
      repeat: options.loop || 0,
      log: false
    },
    {
      id: eventIds.snap,
      throttle: 50
    },
    {
      id: eventIds.prevSlide,
      throttle: 300
    },
    {
      id: eventIds.nextSlide,
      throttle: 300
    },
    {
      id: eventIds.firstSlide
    },
    {
      id: eventIds.lastSlide
    },
    {
      id: eventIds.goToSlide,
      throttle: 300
    },
    {
      id: eventIds.activate,
      throttle: 300
    },
    {
      id: eventIds.refresh,
      throttle: 100
    },
    {
      id: eventIds.error
    }
  ])

  // Start auto-animation if enabled
  if (options.animate && options.duration) {
    cyre.call(eventIds.animate, virtual)
  }

  // Start performance monitoring if enabled
  if (options.performance !== 0) {
    // Schedule periodic performance checks
    cyre.action({
      id: `performance_monitor_${id}`,
      interval: 5000,
      repeat: true
    })

    cyre.on(`performance_monitor_${id}`, () => {
      return {
        id: EVENTS.PERFORMANCE_MONITOR,
        payload: {id}
      }
    })

    // Start monitoring
    cyre.call(`performance_monitor_${id}`)
  }
}

/**
 * Get offsets for all slides in a carousel
 * Used to determine positions for navigation
 */
export const getSlideOffsets = (
  virtual: HoloVirtual,
  selectedElement?: HTMLElement
): {offsets: number[]; selectedIndex: number} => {
  if (!virtual?.id) {
    return {offsets: [], selectedIndex: -1}
  }

  const container = document.querySelector(`#${virtual.id} .holo-container`)
  if (!container) {
    return {offsets: [], selectedIndex: -1}
  }

  const slides = Array.from(container.children) as HTMLElement[]
  const offsets = slides.map(slide => {
    if (virtual.io.orientation) {
      return slide.offsetTop || 0
    } else {
      return slide.offsetLeft || 0
    }
  })

  // Find the index of the selected element
  let selectedIndex = -1
  if (selectedElement) {
    selectedIndex = slides.findIndex(slide => slide === selectedElement)
  }

  return {offsets, selectedIndex}
}

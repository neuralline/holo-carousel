//src/app.ts

/* 
    Neural Line
    Reactive Carousel
    H.O.L.O - C.A.R.O.U.S.E.L
    Version 3.5.0 (2025)
*/

import {cyre, CyreLog} from 'cyre'
import type {HoloIOOptions, HoloVirtual} from './types/interface'
import {holoCreateElement} from './components/holo-create-element'
import {_holo} from './libs/holo-essentials'
import {holoInitiate} from './components/holo-initiate'
import {EVENTS, DEFAULT_IO_OPTIONS, CSS_CLASSES} from './config/holo-config'
import {
  safeEventCall,
  createEventIds,
  initializeEventSystem,
  initializeInstanceEvents
} from './core/holo-events'
import {handleTouchStart, initializeTouchSystem} from './components/holo-touch'
import {getCurrentSlideIndex, updateActiveSlide} from './libs/holo-dom'
import {
  initializePerformanceMonitoring,
  getPerformanceHistory,
  optimizeCarousel
} from './core/holo-performance'
import {forceRefreshAllCarousels} from './libs/holo-dom-fix'
import {initializeDebugTools} from './libs/debug'

/**
 * Update carousel options with proper validation
 */
function updateCarouselOptions(
  id: string,
  options: Partial<HoloIOOptions> = {}
): {ok: boolean; data: HoloIOOptions | string} {
  try {
    if (!_holo[id]) {
      return {ok: false, data: `Carousel with ID ${id} not found`}
    }

    const virtual = _holo[id].getVirtual

    // Filter valid options
    const validOptions = Object.entries(options).reduce((acc, [key, value]) => {
      if (key in DEFAULT_IO_OPTIONS) {
        return {...acc, [key]: value}
      }
      CyreLog.warn(`Invalid option ignored: ${key}`)
      return acc
    }, {})

    // Create updated options
    const updatedIO = {
      ...virtual.io,
      ...validOptions
    }

    // Update state
    _holo[id].setState = {
      ..._holo[id].getVirtual,
      io: updatedIO
    }

    // Initialize instance events with new options
    initializeInstanceEvents(id, updatedIO)

    return {ok: true, data: updatedIO}
  } catch (error) {
    CyreLog.error('Error updating carousel options:', error)
    return {
      ok: false,
      data: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get carousel dimensions and state
 */
function getCarouselDimensions(id: string) {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return null
  }
  return _holo[id].getDimensions
}

/**
 * Get carousel state
 */
function getCarouselState(id: string): HoloVirtual | null {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return null
  }
  return _holo[id].getVirtual
}

/**
 * Refresh all carousels with more robust error handling
 */
function refreshAllCarousels(): void {
  try {
    const carouselIds = Object.keys(_holo)
    if (carouselIds.length === 0) {
      CyreLog.info('No carousels to refresh')
      return
    }

    CyreLog.info(`Refreshing ${carouselIds.length} carousels`)

    // First trigger a global refresh
    cyre.call(EVENTS.REFRESH_SCREEN)

    // Then refresh each carousel individually to ensure all are updated
    carouselIds.forEach(id => {
      try {
        if (!_holo[id]?.getShadow?.carousel) {
          CyreLog.warn(
            `Missing DOM elements for carousel ${id}, skipping refresh`
          )
          return
        }

        // Ensure the carousel element is visible in the DOM
        const isVisible =
          _holo[id].getShadow.carousel.offsetWidth > 0 ||
          _holo[id].getShadow.carousel.offsetHeight > 0

        if (!isVisible) {
          CyreLog.warn(`Carousel ${id} not visible in DOM, skipping refresh`)
          return
        }

        // Call refresh with current state
        cyre.call(EVENTS.REFRESH_CAROUSEL, _holo[id].getState)
      } catch (innerError) {
        CyreLog.error(`Error refreshing carousel ${id}:`, innerError)
      }
    })
  } catch (error) {
    CyreLog.error('Error in global refresh:', error)
  }
}

/**
 * Setup window resize handler
 */
function setupWindowResizeHandler(): void {
  // Configure resize event with throttling
  cyre.action({
    id: 'window-resize',
    throttle: 200,
    log: false
  })

  // Register resize handler
  cyre.on('window-resize', () => {
    return {
      id: EVENTS.REFRESH_SCREEN,
      payload: null
    }
  })

  // Add event listener
  window.addEventListener(
    'resize',
    () => {
      cyre.call('window-resize')
    },
    {passive: true}
  )
}

/**
 * Initialize the Holo carousel system
 * Prepares the global event system
 */
function initialize(selector: string = CSS_CLASSES.CAROUSEL): string {
  CyreLog.info(`Initializing Holo with selector: ${selector}`)

  // Schedule a refresh when everything is loaded
  window.addEventListener('load', () => {
    // First fast refresh
    refreshAllCarousels()

    // Then a more thorough refresh with delay to ensure dimensions are calculated
    setTimeout(() => {
      forceRefreshAllCarousels().then(() => {
        CyreLog.info('Force refresh completed successfully')
      })
    }, 300)
  })

  // Return the selector for chaining
  return selector
}

/**
 * Navigate to next slide
 */
function nextSlide(id: string): void {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return
  }

  const virtual = _holo[id].getVirtual

  // Use event IDs from virtual state or fallback to standard naming
  const eventId = virtual.eventIds?.nextSlide || `next_slide_${id}`

  // Call next slide event
  safeEventCall(eventId, virtual, EVENTS.NEXT_SLIDE)
}

/**
 * Navigate to previous slide
 */
function prevSlide(id: string): void {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return
  }

  const virtual = _holo[id].getVirtual

  // Use event IDs from virtual state or fallback to standard naming
  const eventId = virtual.eventIds?.prevSlide || `prev_slide_${id}`

  // Call previous slide event
  safeEventCall(eventId, virtual, EVENTS.PREV_SLIDE)
}

/**
 * Go to first slide
 */
function firstSlide(id: string): void {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return
  }

  const virtual = _holo[id].getVirtual

  // Use event IDs from virtual state or fallback to standard naming
  const eventId = virtual.eventIds?.firstSlide || `first_slide_${id}`

  // Call first slide event
  safeEventCall(eventId, virtual, EVENTS.FIRST_SLIDE)
}

/**
 * Go to last slide
 */
function lastSlide(id: string): void {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return
  }

  const virtual = _holo[id].getVirtual

  // Use event IDs from virtual state or fallback to standard naming
  const eventId = virtual.eventIds?.lastSlide || `last_slide_${id}`

  // Call last slide event
  safeEventCall(eventId, virtual, EVENTS.LAST_SLIDE)
}

/**
 * Go to specific slide index
 */
function goToSlide(id: string, index: number): void {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return
  }

  const virtual = _holo[id].getVirtual

  // Check if we can access goToSlide event
  if (virtual.eventIds?.goToSlide) {
    // Use instance-specific event
    safeEventCall(virtual.eventIds.goToSlide, {index}, EVENTS.GO_TO_SLIDE)
    return
  }

  // Fallback to direct calculation if item width exists
  if (virtual.item.width) {
    // Calculate position based on index and orientation
    const updatedVirtual = {
      ...virtual,
      transformX: virtual.io.orientation
        ? 0
        : -Math.abs(index * virtual.item.width),
      transformY: virtual.io.orientation
        ? -Math.abs(index * virtual.item.height)
        : 0
    }

    // Call snap event
    const snapEventId = virtual.eventIds?.snap || `snap_${id}`
    safeEventCall(snapEventId, updatedVirtual, EVENTS.SNAP)
    return
  }

  // Item width not calculated yet - warn and try to refresh
  CyreLog.warn(`Carousel ${id} item width not calculated yet`)

  // Try to refresh and retry
  cyre.call(EVENTS.REFRESH_CAROUSEL, _holo[id].getState)
  setTimeout(() => {
    if (_holo[id]?.getVirtual?.item?.width) {
      goToSlide(id, index)
    }
  }, 100)
}

/**
 * Get current position index
 */
function getCurrentPosition(id: string): number {
  if (!_holo[id]) return 0

  const virtual = _holo[id].getVirtual
  return getCurrentSlideIndex(virtual)
}

/**
 * Apply performance optimizations to a carousel
 */
function optimizeCarouselPerformance(
  id: string,
  level: 'light' | 'medium' | 'aggressive'
): void {
  optimizeCarousel(id, level)
}

// Initialize the event system immediately
CyreLog.info(
  '%c HOLO - Initializing Holo Carousel v3.5.0 ',
  'background: #022d5f; color: white; display: block;'
)

// Enable debug tools (can be toggled via query param ?debug=true)
const urlParams =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null
const debugEnabled = urlParams?.has('debug') || false
initializeDebugTools(debugEnabled)

// Initialize core systems
initializeEventSystem()

// Initialize the touch system
initializeTouchSystem()

// Initialize performance monitoring
initializePerformanceMonitoring()

// Register window resize handler
setupWindowResizeHandler()

// Create and export the Holo API
const Holo = {
  // Core initialization
  INIT: initialize,
  AUTO: holoInitiate,
  BUILD: holoCreateElement,

  // Configuration and state access
  carousel: updateCarouselOptions,
  dimensions: getCarouselDimensions,
  getState: getCarouselState,
  getPosition: getCurrentPosition,

  // Navigation
  next: nextSlide,
  prev: prevSlide,
  first: firstSlide,
  last: lastSlide,
  goTo: goToSlide,

  // System operations
  refresh: refreshAllCarousels,
  getPerformanceHistory,
  optimize: optimizeCarouselPerformance,

  // Touch handling
  handleTouchStart,

  // Constants
  EVENTS
}

// Export for module use
export default Holo

// Also expose to window for UMD/browser usage
if (typeof window !== 'undefined') {
  ;(window as any).Holo = Holo
}

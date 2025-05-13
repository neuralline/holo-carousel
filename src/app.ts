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
import {
  getCurrentSlideIndex,
  updateActiveSlide,
  forceRefreshAllCarousels,
  calculateCarouselDimensions
} from './libs/holo-dom'
import {
  initializePerformanceMonitoring,
  getPerformanceHistory,
  optimizeCarousel
} from './core/holo-performance'
import {
  goToNextSlide,
  goToPrevSlide,
  goToFirstSlide,
  goToLastSlide,
  goToSlide
} from './libs/holo-navigation'
import {initializeDebugTools} from './libs/debug'

// Update the updateCarouselOptions function in app.ts

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

    // CRITICAL FIX: Special handling for animation
    if ('animate' in validOptions) {
      // Clean up any existing animation event
      if (virtual.eventIds?.animate) {
        cyre.forget(virtual.eventIds.animate)
        CyreLog.info(`Removed existing animation for carousel ${id}`)
      }
    }

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

    // Re-initialize instance events with new options
    // This will properly set up the animation if enabled
    initializeInstanceEvents(id, updatedIO)

    CyreLog.info(`Carousel ${id} options updated successfully`)

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

  // Use the navigation function from our shared library
  goToNextSlide(_holo[id].getVirtual)
}

/**
 * Navigate to previous slide
 */
function prevSlide(id: string): void {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return
  }

  // Use the navigation function from our shared library
  goToPrevSlide(_holo[id].getVirtual)
}

/**
 * Go to first slide
 */
function firstSlide(id: string): void {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return
  }

  // Use the navigation function from our shared library
  goToFirstSlide(_holo[id].getVirtual)
}

/**
 * Go to last slide
 */
function lastSlide(id: string): void {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return
  }

  // Use the navigation function from our shared library
  goToLastSlide(_holo[id].getVirtual)
}

/**
 * Go to specific slide index
 */
function goToSlideById(id: string, index: number): void {
  if (!_holo[id]) {
    CyreLog.warn(`Carousel with ID ${id} not found`)
    return
  }

  // Use the navigation function from our shared library
  goToSlide(_holo[id].getVirtual, index)
}

/**
 * Get current position index
 */
function getCurrentPosition(id: string): number {
  if (!_holo[id]) return 0

  // Use the slide index calculation from our shared library
  return getCurrentSlideIndex(_holo[id].getVirtual)
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
  goTo: goToSlideById,

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

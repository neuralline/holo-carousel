// src/app.ts

/* 
    Neural Line
    Reactive carousel
    H.O.L.O - C.A.R.O.U.S.E.L
    Version 3.0.0 2025
*/

import {cyre} from 'cyre'
import type {HoloIOOptions, HoloVirtual} from './types/interface'
import {holoCreateElement} from './components/holo-create-element'
import {_holo, _getItemWidthHeight} from './libs/holo-essentials'
import {holoInitiate} from './components/holo-initiate'
import {Touch, setupGlobalTouchListeners} from './components/holo-touch'
import {transformX, transformY} from './components/orientation-handler'
import {EVENTS, SELECTORS} from './config/holo-config'
import {registerGlobalEvents, safeEventCall} from './core/holo-event-system'
import {updateHoloInstance} from './core/holo-state'

/**
 * Calculate number of slots that fit in parent container
 */
const calculateNumberOfSlots = (
  parent: number,
  item: number,
  max?: number
): number => {
  const slots = Math.floor(parent / item) || 1
  return max ? Math.min(slots, max) : slots
}

/**
 * Main Holo carousel module
 */
const createHoloCarousel = () => {
  // Register core event handlers
  registerGlobalEvents()

  // Register refresh handler
  cyre.on(
    EVENTS.REFRESH_CAROUSEL,
    (state: {virtual: HoloVirtual; shadow: any}) => {
      const {virtual, shadow} = state

      if (!virtual?.id || !shadow?.container) {
        console.error('Holo carousel refresh error:', virtual?.id)
        return
      }

      // Reset container style
      shadow.container.setAttribute('style', '')

      // Get first item dimensions if available
      const firstItem = shadow.container.children[0] as HTMLElement
      const {height = 0, width = 0} = firstItem
        ? _getItemWidthHeight(firstItem)
        : {height: 0, width: 0}

      // Calculate parent container width
      const parentWidth = shadow.carousel.parentNode?.clientWidth || 0

      // Update virtual state with new dimensions
      const updatedVirtual = {
        ...virtual,
        item: {
          ...virtual.item,
          height,
          width
        },
        numberOfSlots: calculateNumberOfSlots(
          parentWidth,
          width,
          virtual.item.max
        )
      }

      // Calculate carousel dimensions
      const calcCarouselWidth =
        updatedVirtual.numberOfSlots * updatedVirtual.item.width
      const innerCarouselWidth = shadow.carousel.clientWidth
      const calcWidth =
        shadow.container.children.length * updatedVirtual.item.width
      const innerWidth = shadow.container.clientWidth || calcWidth

      // Update with calculated dimensions
      const carouselRefreshed = {
        ...updatedVirtual,
        carousel: {
          width: calcCarouselWidth || innerCarouselWidth,
          height: updatedVirtual.item.height || shadow.carousel.clientHeight
        },
        container: {
          width: updatedVirtual.io.orientation
            ? shadow.carousel.width
            : innerWidth,
          height:
            shadow.container.clientHeight || updatedVirtual.item.height || 0
        }
      }

      // Calculate end position based on orientation
      carouselRefreshed.endOfSlidePosition = carouselRefreshed.io.orientation
        ? -Math.abs(
            (carouselRefreshed.container.height || 0) -
              (carouselRefreshed.carousel.height || 0)
          )
        : -Math.abs(
            (carouselRefreshed.container.width || 0) -
              (carouselRefreshed.carousel.width || 0)
          )

      // Update dimensions
      _holo[virtual.id].setDimension = {...carouselRefreshed}

      // Call snap handler with fallback
      return safeEventCall(
        EVENTS.SNAP_TO_POSITION,
        EVENTS.SNAP,
        carouselRefreshed
      )
    }
  )

  // Snap to grid handler
  cyre.on(EVENTS.SNAP, (virtual: HoloVirtual) => {
    if (!virtual?.id || !_holo[virtual.id]) {
      console.error('Holo snap error: Invalid state')
      return
    }

    // Enable transition animation
    _holo[virtual.id].updateStyle = 1

    // Apply transformation based on orientation
    const transformedVirtual = virtual.io.orientation
      ? transformY(virtual)
      : transformX(virtual)

    // Update state
    _holo[virtual.id].setState = {...transformedVirtual}
  })

  // Add direct handler for SNAP_TO_POSITION
  cyre.on(EVENTS.SNAP_TO_POSITION, (virtual: HoloVirtual) => {
    // Forward to SNAP handler
    return safeEventCall(EVENTS.SNAP, EVENTS.SNAP, virtual)
  })

  // Register actions for core events
  cyre.action([
    {id: EVENTS.REFRESH_CAROUSEL, throttle: 100},
    {id: EVENTS.REFRESH_SCREEN, throttle: 100},
    {id: EVENTS.SNAP_TO_POSITION, throttle: 100},
    {id: EVENTS.SNAP, throttle: 100}
  ])

  /**
   * Update carousel options
   */
  const updateCarouselOptions = (
    id: string,
    io: Partial<HoloIOOptions> = {}
  ): {ok: boolean; data: HoloIOOptions} => {
    if (!id || !_holo[id]) {
      console.error('updateCarouselOptions: Invalid carousel ID', id)
      return {ok: false, data: {} as HoloIOOptions}
    }

    // Update the instance with new options
    updateHoloInstance(_holo[id], io)

    return {ok: true, data: _holo[id].getVirtual.io}
  }

  /**
   * Get carousel dimensions
   */
  const getCarouselDimensions = (id: string) => {
    if (!id || !_holo[id]) {
      console.error('getCarouselDimensions: Invalid carousel ID', id)
      return null
    }

    return _holo[id].getDimensions
  }

  /**
   * Initialize the Holo carousel system
   */
  const initialize = (selector: string = SELECTORS.CAROUSEL_CLASS): void => {
    console.log(
      '%c HOLO - Initiating holo v3.0.0 ',
      'background: #022d5f; color: white; display: block;'
    )

    // Setup global touch event handlers
    setupGlobalTouchListeners()

    // Setup screen refresh handling
    cyre.on(EVENTS.REFRESH_SCREEN, refreshAllCarousels)

    // Initialize all carousels with the selector
    holoInitiate(selector)
  }

  /**
   * Refresh all carousels
   */
  const refreshAllCarousels = (): void => {
    Object.keys(_holo).forEach(id => {
      if (!_holo[id]) return

      try {
        safeEventCall(
          EVENTS.REFRESH_CAROUSEL,
          EVENTS.REFRESH_CAROUSEL,
          _holo[id].getState
        )
      } catch (error) {
        console.error(`Error refreshing carousel ${id}:`, error)
      }
    })
  }

  // Window resize handler with throttling
  const throttledResize = (() => {
    let resizeTimeout: number | null = null

    return () => {
      if (resizeTimeout === null) {
        resizeTimeout = window.setTimeout(() => {
          resizeTimeout = null
          safeEventCall(EVENTS.REFRESH_SCREEN, EVENTS.REFRESH_SCREEN, null)
        }, 100)
      }
    }
  })()

  window.addEventListener('resize', throttledResize, {passive: true})

  // Public API
  return {
    TOUCH: Touch,
    INIT: initialize,
    BUILD: holoCreateElement,
    AUTO: holoInitiate,
    carousel: updateCarouselOptions,
    refresh: refreshAllCarousels,
    dimensions: getCarouselDimensions,
    // Export event constants for reuse
    EVENTS
  }
}

// Create the Holo instance
const Holo = createHoloCarousel()

export default Holo

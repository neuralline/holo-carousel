//src/app.ts

/* 
    Neural Line
    Reactive carousel
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
    Version 2 2025
*/

import {cyre} from 'cyre'
import type {HoloIOOptions, HoloVirtual} from './types/interface'
import {holoCreateElement} from './components/holo-create-element'
import {_holo, _getItemWidthHeight} from './libs/holo-essentials'
import {holoInitiate} from './components/holo-initiate'
import {Touch} from './components/holo-touch'
import {transformX, transformY} from './components/orientation-handler'
import {setupTouchManager} from './components/touch-manager'

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
 * Add shake animation to element
 */
const addShakeAnimation = (payload: unknown): void => {
  const [element, virtual] = payload as [HTMLElement, HoloVirtual]
  console.log('shaking')
  // Implementation would go here
}

/**
 * Main Holo carousel module
 */
const createHoloCarousel = () => {
  // Define consistent event names - keeping naming conventions from legacy code
  const EVENTS = {
    REFRESH_CAROUSEL: 'refresh_carousel',
    REFRESH_SCREEN: 'refresh_screen',
    SNAP_TO_POSITION: 'snap_to_position',
    SNAP: 'SNAP',
    SHAKE: 'SHAKE',
    // Add all global event types for consistency
    ANIMATE_FORWARD: 'AnimateForward',
    ANIMATE_BACKWARD: 'AnimateBackward',
    NEXT_SLIDE: 'nxtSlide',
    PREV_SLIDE: 'prvSlide',
    FIRST_SLIDE: 'firstSlide',
    LAST_SLIDE: 'lastSlide',
    ACTIVATE: 'activate',
    BRING_TO_FOCUS: 'bringToFocus',
    WHEELER: 'wheeler'
  }

  // Carousel refresh handler
  cyre.on(
    EVENTS.REFRESH_CAROUSEL,
    (state: {virtual: HoloVirtual; shadow: any}) => {
      const {virtual, shadow} = state

      if (!virtual.id) {
        console.error('Holo carousel refresh error', virtual.id)
        return
      }

      shadow.container.setAttribute('style', '')
      const {height, width} = _getItemWidthHeight(
        shadow.container.children[0] as HTMLElement
      )

      // Update virtual state with new dimensions
      const updatedVirtual = {
        ...virtual,
        item: {
          ...virtual.item,
          height,
          width
        },
        numberOfSlots: calculateNumberOfSlots(
          shadow.carousel.parentNode.clientWidth,
          width,
          virtual.item.max
        )
      }

      const calcCarouselWidth =
        updatedVirtual.numberOfSlots * updatedVirtual.item.width
      const innerCarouselWidth = shadow.carousel.clientWidth
      const calcWidth =
        shadow.container.children.length * updatedVirtual.item.width
      const innerWidth = shadow.container.clientWidth || calcWidth

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

      carouselRefreshed.endOfSlidePosition = carouselRefreshed.io.orientation
        ? -Math.abs(
            (carouselRefreshed.container.height || 0) -
              (carouselRefreshed.carousel.height || 0)
          )
        : -Math.abs(
            (carouselRefreshed.container.width || 0) -
              (carouselRefreshed.carousel.width || 0)
          )

      _holo[virtual.id].setDimension = {...carouselRefreshed}

      // CRITICAL FIX: Try/catch to handle potential missing subscribers
      try {
        return cyre.call(EVENTS.SNAP_TO_POSITION, carouselRefreshed)
      } catch (error) {
        console.warn(
          'Could not call snap_to_position, falling back to direct SNAP'
        )
        return cyre.call(EVENTS.SNAP, carouselRefreshed)
      }
    }
  )

  // Snap to grid handler - this one is called directly
  cyre.on(EVENTS.SNAP, (virtual: HoloVirtual) => {
    if (!virtual.id) {
      console.error('Holo snap error')
      return
    }

    _holo[virtual.id].updateStyle = 1
    const transformedVirtual = virtual.io.orientation
      ? transformY(virtual)
      : transformX(virtual)

    _holo[virtual.id].setState = {...transformedVirtual}
  })

  // CRITICAL FIX: Add a direct handler for SNAP_TO_POSITION
  cyre.on(EVENTS.SNAP_TO_POSITION, (virtual: HoloVirtual) => {
    // Simply forward to SNAP handler
    return cyre.call(EVENTS.SNAP, virtual)
  })

  // Register shake animation handler
  cyre.on(EVENTS.SHAKE, addShakeAnimation)

  // CRITICAL FIX: Register actions for all registered event handlers
  // Actions must come AFTER their corresponding on() handlers are registered
  cyre.action([
    {id: EVENTS.REFRESH_CAROUSEL},
    {id: EVENTS.REFRESH_SCREEN, log: true},
    {id: EVENTS.SNAP_TO_POSITION, type: EVENTS.SNAP},
    {id: EVENTS.SNAP},
    {id: EVENTS.SHAKE},
    // Make sure all global events have actions registered
    {id: EVENTS.ANIMATE_FORWARD},
    {id: EVENTS.ANIMATE_BACKWARD},
    {id: EVENTS.NEXT_SLIDE},
    {id: EVENTS.PREV_SLIDE},
    {id: EVENTS.FIRST_SLIDE},
    {id: EVENTS.LAST_SLIDE},
    {id: EVENTS.ACTIVATE},
    {id: EVENTS.BRING_TO_FOCUS},
    {id: EVENTS.WHEELER}
  ])

  /**
   * Update carousel options
   */
  const updateCarouselOptions = (
    id: string,
    io: Partial<HoloIOOptions> = {}
  ): {ok: boolean; data: HoloIOOptions} => {
    const virtual = _holo[id].getVirtual

    const updatedIO = Object.entries(io).reduce((acc, [key, value]) => {
      if (key in virtual.io) {
        return {...acc, [key]: value}
      }
      return acc
    }, virtual.io)

    _holo[id].setState = {
      ..._holo[id].getVirtual,
      io: updatedIO
    }

    return {ok: true, data: updatedIO}
  }

  /**
   * Get carousel dimensions
   */
  const getCarouselDimensions = (id: string) => {
    return _holo[id].getDimensions
  }

  /**
   * Initialize the Holo carousel system
   */
  const initialize = (selector: string = 'holo-carousel'): void => {
    console.log(
      '%c HOLO - Initiating holo v2.3.4 ',
      'background: #022d5f; color: white; display: block;'
    )

    setupTouchManager(selector)

    // Setup screen on initiation
    cyre.on(EVENTS.REFRESH_SCREEN, refreshAllCarousels)
  }

  /**
   * Refresh all carousels
   */
  const refreshAllCarousels = (): void => {
    Object.keys(_holo).forEach(id => {
      console.log('@holo refreshing:', id)
      try {
        cyre.call(EVENTS.REFRESH_CAROUSEL, _holo[id].getState)
      } catch (error) {
        console.error(`Error refreshing carousel ${id}:`, error)
      }
    })
  }

  // Window resize handler
  window.addEventListener(
    'resize',
    () => {
      try {
        cyre.call(EVENTS.REFRESH_SCREEN)
      } catch (error) {
        console.error('Error handling resize:', error)
        // Attempt direct refresh as fallback
        refreshAllCarousels()
      }
    },
    false
  )

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

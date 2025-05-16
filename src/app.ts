/** @format */

//src/app.ts
'use strict'
//Project HOLO-CAROUSEL 2019

// jscs:enabled
// @flow
// @ts-check

/* 
    Neural Line
    Reactive carousel
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import cyre from 'cyre'
import {holoStore} from './core/state'
import holoCreateElement from './components/holo-create-element'
import holoInitiate from './components/holo-initiate'
import Touch from './components/holo-touch'
import {HoloIOOptions} from './types/interface'
import {EVENTS} from './config/holo-config'
import {initializeEvents, refreshCarousel} from './core/event-manager'

// Track initialization
let isInitialized = false

// Holo Carousel module
const Holo = (() => {
  // Set up global touch event listeners
  const touchCleanup = Touch.setupGlobalTouchListeners()

  /**
   * Update carousel options
   */
  const _carousel = (
    id: string,
    io: Partial<HoloIOOptions> = {}
  ): {ok: boolean; data: HoloIOOptions} => {
    const virtualDom = holoStore.getVirtualDom(id)
    if (!virtualDom) {
      return {ok: false, data: {} as HoloIOOptions}
    }

    // Apply options that exist in current IO
    const updatedIO = {...virtualDom.io}

    for (const attribute in io) {
      if (attribute in updatedIO) {
        updatedIO[attribute] = io[attribute]
      }
    }

    // Update store
    holoStore.updateVirtualDom(id, {io: updatedIO})

    return {ok: true, data: updatedIO}
  }

  /**
   * Get carousel dimensions
   */
  const getDimensions = (id: string) => {
    return holoStore.getDimensions(id)
  }

  /**
   * Refresh all carousels
   */
  const _refresh = () => {
    cyre.call(EVENTS.REFRESH_SCREEN)
  }

  /**
   * Initialize Holo carousel
   */
  const init = (carouselClassName = 'holo-carousel') => {
    // Only initialize once
    if (isInitialized) {
      console.log('@Holo: Already initialized')
      return
    }

    console.log(
      '%c HOLO - Initiating holo v2.3.4 ',
      'background: #022d5f; color: white; display: block;'
    )

    // Initialize all event handlers (only once)
    initializeEvents()

    // Set up window resize handler
    window.addEventListener(
      'resize',
      () => {
        cyre.call(EVENTS.REFRESH_SCREEN)
      },
      false
    )

    // Auto-initialize carousels with the specified class
    holoInitiate(carouselClassName)

    isInitialized = true
  }

  // Public API
  return {
    TOUCH: Touch,
    INIT: init,
    BUILD: holoCreateElement,
    AUTO: holoInitiate,
    carousel: _carousel,
    refresh: _refresh,
    dimensions: getDimensions,

    // Cleanup function for when Holo is no longer needed
    cleanup: () => {
      touchCleanup()
      window.removeEventListener('resize', () =>
        cyre.call(EVENTS.REFRESH_SCREEN)
      )
      isInitialized = false
    }
  }
})()

// Export for module use
export default Holo

// Also expose to window for UMD/browser usage
if (typeof window !== 'undefined') {
  ;(window as any).Holo = Holo
}

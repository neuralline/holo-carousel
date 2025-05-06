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
  // Carousel refresh handler
  cyre.on('refresh carousel', (state: {virtual: HoloVirtual; shadow: any}) => {
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
        height: shadow.container.clientHeight || updatedVirtual.item.height || 0
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
    return cyre.call('snap to position', carouselRefreshed)
  })

  // Snap to grid handler
  cyre.on('SNAP', (virtual: HoloVirtual) => {
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

    // Initialize microservice
    cyre.action([
      {id: 'refresh screen', log: true}, // Adjust width
      {id: 'refresh carousel'},
      {id: 'snap to position', type: 'SNAP'}
    ])

    cyre.on('SHAKE', addShakeAnimation)

    // Setup screen on initiation
    cyre.on('refresh screen', refreshAllCarousels)
  }

  /**
   * Refresh all carousels
   */
  const refreshAllCarousels = (): void => {
    Object.keys(_holo).forEach(id => {
      console.log('@holo refreshing:', id)
      cyre.call('refresh carousel', _holo[id].getState)
    })
  }

  // Window resize handler
  window.addEventListener(
    'resize',
    () => {
      cyre.call('refresh screen')
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
    dimensions: getCarouselDimensions
  }
}

// Create the Holo instance
const Holo = createHoloCarousel()

export default Holo

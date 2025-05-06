//src/app.ts

//Project HOLO-CAROUSEL 2019

// jscs:enabled
// @flow
// @ts-check

/* 
    Neural Line
    Reactive carousel
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
    Version 2 2025

  

    
*/

//HOLO self invoking function

import {cyre} from 'cyre'
import {HoloIOOptions, HoloVirtual} from './types/interface'
import holoCreateElement from './components/holo-create-element'
import {_holo, _getItemWidthHeight} from './libs/holo-essentials'
import holoInitiate from './components/holo-initiate'
import Touch from './components/holo-touch'
import {_transformX, _transformY} from './components/orientation-handler'
import {TouchManager} from './components/touch-manager'

/**
 * Calculate number of slots that fit in parent container
 * @param parent - Parent width
 * @param item - Item width
 * @param max - Maximum number of slots
 */
const _numberOfSlots = (parent: number, item: number, max?: number): number => {
  let slots = Math.floor(parent / item)

  if (max) {
    if (slots > max) {
      return max || 1
    }
  }

  return slots || 1
}

/**
 * Add shake animation to element
 * @param payload - Element and virtual state
 */
const _addShake = (payload: unknown): void => {
  const [element, virtual] = payload as [HTMLElement, HoloVirtual]
  console.log('shaking')
}

/**
 * Main Holo carousel module
 */
const Holo = (() => {
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

    virtual.item.height = height
    virtual.item.width = width
    virtual.numberOfSlots =
      _numberOfSlots(
        shadow.carousel.parentNode.clientWidth,
        virtual.item.width,
        virtual.item.max
      ) || 1

    const calcCarouselWidth = virtual.numberOfSlots * virtual.item.width
    const innerCarouselWidth = shadow.carousel.clientWidth
    const calcWidth = shadow.container.children.length * virtual.item.width
    const innerWidth = shadow.container.clientWidth || calcWidth

    virtual.carousel.width = calcCarouselWidth || innerCarouselWidth
    virtual.carousel.height =
      virtual.item.height || shadow.carousel.clientHeight
    virtual.container.width = virtual.io.orientation
      ? shadow.carousel.width
      : innerWidth
    virtual.container.height =
      shadow.container.clientHeight || virtual.item.height || 0

    virtual.endOfSlidePosition = virtual.io.orientation
      ? -Math.abs(
          (virtual.container.height || 0) - (virtual.carousel.height || 0)
        )
      : -Math.abs(
          (virtual.container.width || 0) - (virtual.carousel.width || 0)
        )

    _holo[virtual.id].setDimension = {...virtual}
    return cyre.call('snap to position', virtual)
  })

  // Snap to grid handler
  cyre.on('SNAP', (virtual: HoloVirtual) => {
    if (!virtual.id) {
      console.error('Holo snap error')
      return
    }

    _holo[virtual.id].updateStyle = 1
    virtual = virtual.io.orientation
      ? _transformY(virtual)
      : _transformX(virtual)

    _holo[virtual.id].setState = {...virtual}
  })

  /**
   * Update carousel options
   * @param id - Carousel ID
   * @param io - New options
   */
  const _carousel = (
    id: string,
    io: Partial<HoloIOOptions> = {}
  ): {ok: boolean; data: HoloIOOptions} => {
    const virtual = _holo[id].getVirtual

    for (const attribute in io) {
      if (virtual.io.hasOwnProperty(attribute)) {
        ;(virtual.io as any)[attribute] = (io as any)[attribute]
      }
    }

    return {ok: true, data: virtual.io}
  }

  /**
   * Get carousel dimensions
   * @param id - Carousel ID
   */
  const getDimensions = (id: string) => {
    return _holo[id].getDimensions
  }

  /**
   * Initialize the Holo carousel system
   * @param au - Class selector for carousels
   */
  const init = (au: string = 'holo-carousel'): void => {
    console.log(
      '%c HOLO - Initiating holo v2.3.4 ',
      'background: #022d5f; color: white; display: block;'
    )

    TouchManager(au)

    // Initialize microservice
    cyre.action([
      {id: 'refresh screen', log: true}, // Adjust width
      {id: 'refresh carousel'},
      {id: 'snap to position', type: 'SNAP'}
    ])

    cyre.on('SHAKE', _addShake as (payload: unknown) => void)

    // Setup screen on initiation
    cyre.on('refresh screen', _refresh)
  }

  // DOM content loaded handler
  document.addEventListener('DOMContentLoaded', () => {}, false)

  /**
   * Refresh all carousels
   */
  const _refresh = (): void => {
    for (let id in _holo) {
      console.log('@holo refreshing:', id)
      cyre.call('refresh carousel', _holo[id].getState)
    }
  }

  // Window resize handler
  window.addEventListener(
    'resize',
    () => {
      cyre.call('refresh screen')
    },
    false
  )

  // Window load handler
  window.onload = () => {
    // cyre.dispatch({id: 'app loaded', type: 'LOADED'})
  }

  // Public API
  return {
    TOUCH: Touch,
    INIT: init,
    BUILD: holoCreateElement,
    AUTO: holoInitiate,
    carousel: _carousel,
    refresh: _refresh,
    dimensions: getDimensions
  }
})()

export default Holo

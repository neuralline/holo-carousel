//src/components/touch-manager.ts

import {cyre} from 'cyre'
import {
  goToFirstSlide,
  goToLastSlide,
  goToNextSlide,
  goToPrevSlide,
  activateSlide,
  animateCarousel,
  handleWheel
} from '../libs/holo-navigation'

/**
 * Setup touch and event handlers for the carousel (legacy support)
 * @param selector - Optional class selector for carousels
 */
export const setupTouchManager = (selector?: string): boolean => {
  // Register global event handlers with cyre for backward compatibility
  cyre.on('AnimateForward', virtual => animateCarousel(virtual, true))
  cyre.on('AnimateBackward', virtual => animateCarousel(virtual, false))
  cyre.on('nxtSlide', goToNextSlide)
  cyre.on('prvSlide', goToPrevSlide)
  cyre.on('firstSlide', goToFirstSlide)
  cyre.on('lastSlide', goToLastSlide)
  cyre.on('bringToFocus', payload => {
    const [element, virtual] = payload
    activateSlide(element, virtual)
  })
  cyre.on('wheeler', payload => {
    const [e, id] = payload
    handleWheel(e, id)
  })
  cyre.on('activate', payload => {
    const [element, virtual] = payload
    activateSlide(element, virtual)
  })

  // Register corresponding actions for each handler
  cyre.action([
    {id: 'AnimateForward'},
    {id: 'AnimateBackward'},
    {id: 'nxtSlide'},
    {id: 'prvSlide'},
    {id: 'firstSlide'},
    {id: 'lastSlide'},
    {id: 'bringToFocus'},
    {id: 'wheeler'},
    {id: 'activate'}
  ])

  return true
}

//src/libs/holo-essentials.ts

import {cyre} from 'cyre'
import {
  HoloVirtual,
  HoloDimensions,
  HoloDatabase,
  HoloIOOptions
} from '../types/interface'

/**
    H.O.L.O -  
    essential functions
*/

/**
 * Main instance - holo database object
 */
export const _holo: HoloDatabase = {}

/**
 * Snap position to grid
 * @param position - Current position
 * @param gridSize - Size of grid unit
 */
export const _snap = (position: number, gridSize: number): number => {
  return Math.round(position / gridSize) * gridSize
}

/**
 * Determines if interaction was a click based on time elapsed
 * @param timeElapsed - Time in ms
 */
export const _isClicked = (timeElapsed: number): number => {
  return timeElapsed < 250 ? 1 : 0 ///handle click, touch, double click or long-touch events
}

/**
 * Calculate swipe speed
 * @param distance - Distance traveled
 * @param timeElapsed - Time taken
 */
export const _swipe = (distance: number, timeElapsed: number): number => {
  return distance / timeElapsed
}

/**
 * Update IO parameters
 * @param carouselParameter - Original parameters
 * @param io - New parameters to apply
 */
export const ioData = (
  carouselParameter: HoloIOOptions = {} as HoloIOOptions,
  io: Partial<HoloIOOptions> = {}
): HoloIOOptions => {
  //input output data
  for (const attribute in io) {
    if (attribute in carouselParameter) {
      carouselParameter[attribute as keyof HoloIOOptions] = io[
        attribute as keyof HoloIOOptions
      ] as any
    } else {
      console.error('@Holo: unknown carousel Parameter', attribute)
    }
  }
  return carouselParameter
}

/**
 * Get element dimensions including margins
 * @param e - HTML Element
 */
export const _getItemWidthHeight = (e: HTMLElement): HoloDimensions => {
  if (!e) return {width: 0, height: 0}

  const outer: HoloDimensions = {
    width: e.offsetWidth,
    height: e.offsetHeight
  }

  const style = window.getComputedStyle(e, null)
  outer.width += parseInt(style.marginLeft) + parseInt(style.marginRight)
  outer.height += parseInt(style.marginTop) + parseInt(style.marginBottom)

  return outer
}

/**
 * Calculate slider position boundaries
 * @param virtual - Virtual state
 */
export const _sliderPosition = (virtual: HoloVirtual): HoloVirtual => {
  if (virtual.transformX >= 100) {
    virtual.transformX = 100
    virtual.endOfSlide = 1 //Left EnD of the carousel
  } else if (virtual.transformX + 100 <= virtual.endOfSlidePosition!) {
    virtual.transformX = virtual.endOfSlidePosition! - 100
    virtual.endOfSlide = -1 //Right end of the carousel
  } else {
    virtual.endOfSlide = 0 //in the middle carousel
  }
  return virtual
}

/**
 * Manage active/highlighted slides
 * @param payload - Element and virtual state
 */
export const activate = ([element, virtual]: [
  HTMLElement,
  HoloVirtual
]): void => {
  virtual.transformX = -Math.abs(element.offsetLeft)
  cyre.call('SNAP' + virtual.id, virtual)
  element.classList.add('active')
}

/**
 * Go to previous slide
 * @param virtual - Virtual state
 */
export const prvSlide = (virtual: HoloVirtual): void => {
  if (virtual.endOfSlide === 1) return //console.error('shake');
  virtual.transformX += virtual.carousel.width || 0
  virtual.transformY += virtual.carousel.height || 0
  return cyre.call('SNAP' + virtual.id, virtual)
}

/**
 * Go to next slide
 * @param virtual - Virtual state
 */
export const nxtSlide = (virtual: HoloVirtual): void => {
  if (virtual.endOfSlide === -1) return //console.error('shake');
  virtual.transformX -= virtual.carousel.width || 0
  virtual.transformY -= virtual.carousel.height || 0
  return cyre.call('SNAP' + virtual.id, virtual)
}

/**
 * Jump to first slide
 * @param virtual - Virtual state
 */
export const firstSlide = (virtual: HoloVirtual): void => {
  virtual.transformX = 0
  virtual.transformY = 0
  virtual.endOfSlide = 1
  return cyre.call('SNAP' + virtual.id, virtual)
}

/**
 * Jump to last slide
 * @param virtual - Virtual state
 */
export const lastSlide = (virtual: HoloVirtual): void => {
  virtual.transformX = virtual.endOfSlidePosition!
  virtual.transformY = virtual.endOfSlidePosition!
  virtual.endOfSlide = -1
  return cyre.call('SNAP' + virtual.id, virtual)
}

/**
 * Animate slides forward
 * @param virtual - Virtual state
 */
export const animateSlideForward = (virtual: HoloVirtual): void => {
  console.log('animating', virtual)
  if (virtual.endOfSlide === -1) {
    return cyre.call('firstSlide' + virtual.id, virtual)
  }
  return cyre.call('nxtSlide' + virtual.id, virtual)
}

/**
 * Animate slides backward
 * @param virtual - Virtual state
 */
export const animateSlideBackward = (virtual: HoloVirtual): void => {
  if (virtual.endOfSlide === 1) {
    return cyre.call('lastSlide' + virtual.id, virtual)
  }
  return cyre.call('prvSlide' + virtual.id, virtual)
}

/**
 * Mouse wheel controller
 * @param e - Wheel event
 * @param id - Carousel ID
 */
export const wheeler = (e: WheelEvent, id: string): void => {
  e.preventDefault()
  const virtual = _holo[id].getVirtual
  if (e.deltaY < 0) {
    cyre.call('prvSlide' + virtual.id, virtual)
  } else if (e.deltaY > 0) {
    cyre.call('nxtSlide' + virtual.id, virtual)
  }
}

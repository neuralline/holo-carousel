/** @format */

//src/components/

import cyre from 'cyre'
//@ts-check
/**

     H.O.L.O -  essential functions

*/

/**
 * @param{object} _holo holo database object
 */
const _holo = {} //main instance
/**
 *
 * @param {string} id holo[id]
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */

/**
 *
 * @param {number} parent parent width
 * @param {number} item child width
 */
const _snap = (parent, item) => {
  return Math.round(parent / item) * item
}

const _isClicked = timeElapsed => {
  return timeElapsed < 250 ? 1 : 0 ///handle click, touch, double click or long-touch events
}

/**
 *
 * @param {number} distance
 * @param {number} timeElapsed
 */
const _swipe = (distance, timeElapsed) => {
  return distance / timeElapsed
}

const ioData = (carouselParameter = {}, io = {}) => {
  //input output data
  for (const attribute in io) {
    carouselParameter[attribute]
      ? (carouselParameter[attribute] = io[attribute])
      : console.error('@Holo: unknown carousel Parameter', attribute)
  }
  return carouselParameter
}

//pure function
const _getItemWidthHeight = e => {
  if (!e) return 0
  const outer = {}
  outer.width = e.offsetWidth
  outer.height = e.offsetHeight
  const style = window.getComputedStyle(e, null)
  outer.width += parseInt(style.marginLeft) + parseInt(style.marginRight)
  outer.height += parseInt(style.marginTop) + parseInt(style.marginBottom)
  return outer
}

const _sliderPosition = virtual => {
  if (virtual.transform >= 100) {
    virtual.transform = 100
    virtual.endOfSlide = 1 //Left EnD of the carousel
  } else if (virtual.transform + 100 <= virtual.endOfSlidePosition) {
    virtual.transform = virtual.endOfSlidePosition - 100
    virtual.endOfSlide = -1 //Right end of the carousel
  } else {
    virtual.endOfSlide = 0 //in the middle carousel
  }
  return virtual
}

//manage active/highlighted slides
const activate = ([element, virtual]) => {
  virtual.transformX = -Math.abs(element.offsetLeft)
  cyre.call('SNAP' + virtual.id, virtual)
  element.classList.add('active')
}

//previous slide operator
const prvSlide = virtual => {
  if (virtual.endOfSlide === 1) return //console.error('shake');
  virtual.transformX += virtual.carousel.width || 0
  virtual.transformY += virtual.carousel.height || 0
  return cyre.call('SNAP' + virtual.id, virtual)
}

//next slide operator
const nxtSlide = virtual => {
  if (virtual.endOfSlide === -1) return //console.error('shake');
  virtual.transformX -= virtual.carousel.width || 0
  virtual.transformY -= virtual.carousel.height || 0
  return cyre.call('SNAP' + virtual.id, virtual)
}

//jump to first slide operator
const firstSlide = virtual => {
  virtual.transformX = 0
  virtual.transformY = 0
  virtual.endOfSlide = 1
  return cyre.call('SNAP' + virtual.id, virtual)
}

//jump to last slide operator
const lastSlide = virtual => {
  virtual.transformX = virtual.endOfSlidePosition
  virtual.transformY = virtual.endOfSlidePosition
  virtual.endOfSlide = -1
  return cyre.call('SNAP' + virtual.id, virtual)
}

//animate slides
const animateSlideForward = virtual => {
  console.log('animating', virtual)
  if (virtual.endOfSlide === -1) {
    return cyre.call('firstSlide' + virtual.id, virtual)
  }
  return cyre.call('nxtSlide' + virtual.id, virtual)
}

const animateSlideBackward = virtual => {
  if (virtual.endOfSlide === 1) {
    return cyre.call('lastSlide' + virtual.id, virtual)
  }
  return cyre.call('prvSlide' + virtual.id, virtual)
}

//mouse 3rd button 'wheel' controller
const wheeler = (e, id) => {
  e.preventDefault()
  const virtual = _holo[id].getVirtual
  if (e.deltaY < 0) {
    cyre.call('prvSlide' + virtual.id, virtual)
  } else if (e.deltaY > 0) {
    cyre.call('nxtSlide' + virtual.id, virtual)
  }
}

export {
  _holo,
  _snap,
  _isClicked,
  _sliderPosition,
  _swipe,
  ioData,
  _getItemWidthHeight,
  wheeler,
  animateSlideBackward,
  animateSlideForward,
  lastSlide,
  firstSlide,
  nxtSlide,
  prvSlide,
  activate
}

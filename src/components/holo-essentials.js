/** @format */

'use strict'
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
const _transform = (id, x = 0, y = 0, z = 0) => {
  _holo[id].shadow.container.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`
}

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

export {_holo, _transform, _snap, _isClicked, _swipe, ioData, _getItemWidthHeight}

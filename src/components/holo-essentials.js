/** @format */

'use strict'
//@ts-check
/**

     H.O.L.O -  essential functions

*/
const _holo = {} //main instance
const _transform = (id, x = 0, y = 0, z = 0) => {
  _holo[id]._state.elm.container.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`
}

const _snap = (parent, item) => {
  return Math.round(parent / item) * item
}

const _isClicked = timeElapsed => {
  return timeElapsed < 250 ? 1 : 0 ///handle click, touch, double click or long-touch events
}

const _swipe = (distance, timeElapsed) => {
  return distance / timeElapsed
}

const ioData = (carouselParameter = {}, io = {}) => {
  //input output data
  for (const attribute in io) {
    carouselParameter[attribute] ? (carouselParameter[attribute] = io[attribute]) : console.error('@Holo: unknown carousel Parameter', attribute)
  }
  return carouselParameter
}

export {_holo, _transform, _snap, _isClicked, _swipe, ioData}

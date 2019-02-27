/** @format */
'use strict'
//Project HOLO-CAROUSEL 2019

// jscs:enabled
// @flow
// @ts-check

/*

        H.O.L.O - C.A.R.O.U.S.E.L
        BY DARIK HART
        @git NeuralLine


*/

//HOLO self invoking function

import {cyre} from 'cyre'
import holoCreateElement from './components/holo-create-element'
import {_holo, _transform, _getItemWidthHeight} from './components/holo-essentials'
import holoInitiate from './components/holo-initiate'
import Touch from './components/holo-touch'
import {_transformX, _transformY} from './components/orientation-handler'
import {TouchManager} from './components/touch-manager'

const Holo = (() => {
  cyre.on('refresh carousel', state => {
    const {virtual, shadow} = state
    if (!virtual.id) return console.error('Holo carousel refresh error ', virtual.id)
    shadow.container.setAttribute('style', '')
    const {height, width} = _getItemWidthHeight(shadow.container.children[0])
    virtual.item.height = height
    virtual.item.width = width
    virtual.numberOfSlots =
      _numberOfSlots(shadow.carousel.parentNode.clientWidth, virtual.item.width, virtual.item.max) || 1
    const calcCarouselWidth = virtual.numberOfSlots * virtual.item.width
    const innerCarouselWidth = shadow.carousel.clientWidth
    const calcWidth = shadow.container.children.length * virtual.item.width
    const innerWidth = shadow.container.clientWidth || calcWidth
    virtual.carousel.width = calcCarouselWidth || innerCarouselWidth
    virtual.carousel.height = virtual.item.height || shadow.carousel.clientHeight
    virtual.container.width = virtual.io.orientation ? shadow.carousel.width : innerWidth
    virtual.container.height = shadow.container.clientHeight || virtual.item.height || 0
    virtual.endNumber = virtual.io.orientation
      ? -Math.abs(virtual.container.height - virtual.carousel.height)
      : -Math.abs(virtual.container.width - virtual.carousel.width)
    return (_holo[virtual.id].setState = virtual), cyre.call('snap to position', virtual)
  })

  //snap to grid
  cyre.on('SNAP', virtual => {
    //manages container
    _holo[virtual.id].updateStyle = 1
    if (!virtual.id) return console.error('Holo snap error')
    virtual = virtual.io.orientation ? _transformY(virtual) : _transformX(virtual)
    _holo[virtual.id].setState = virtual
    return _transform(virtual.id, virtual.transformX, virtual.transformY)
  })

  const _carousel = (id, io = {}) => {
    //_holo[id]?
    const virtual = _holo[id].virtual
    for (const attribute in io) {
      virtual.io[attribute] ? (virtual.io[attribute] = io[attribute]) : false
    }
    return {ok: true, data: virtual.io}
  }
  /**
   *
   * @param {string} id
   */
  const getDimensions = id => {
    return _holo[id].getDimensions
  }
  /**
   *
   * @param {number} parent
   * @param {number} item
   * @param {number} max
   */
  const _numberOfSlots = (parent, item, max) => {
    let slots = Math.floor(parent / item)
    if (max) {
      if (slots > max) {
        slots = max
      }
    }
    return slots || 1
  }

  /**
   *
   * @param {object} _e
   */
  const _addShake = _e => {
    /*     _e.elm.container.classList.add('shake-off')
    let shake = setTimeout(() => {
      clearTimeout(shake)
      _e.elm.container.classList.remove('shake-off')
      return 0
    }, 1000) */

    console.log('shaking')
  }

  /**
   *
   * @param {string} au
   */
  const init = (au = 'holo-carousel') => {
    console.log('%c HOLO - Initiating holo v2.2 ', 'background: #022d5f; color: white; display: block;')
    TouchManager(au)
    //listen for events
    cyre.action({id: 'refresh screen', interval: 250}) //adjust width
    cyre.action({id: 'refresh carousel', interval: 250})
    cyre.action({id: 'snap to position', type: 'SNAP'})
    cyre.on('SHAKE', _addShake)
    cyre.on('refresh screen', _refresh)
  }

  document.addEventListener('DOMContentLoaded', () => {}, false) //when dom loads do something

  const _refresh = () => {
    for (let id in _holo) {
      cyre.call('refresh carousel', _holo[id].getState)
    }
  }

  window.addEventListener(
    //when window resizes do something
    'resize',
    () => {
      cyre.call('refresh screen')
    },
    false
  )

  window.onload = () => {
    cyre.dispatch({id: 'app loaded', type: 'LOADED'})
  }

  return {
    TOUCH: Touch,
    INIT: init,
    dimensions: getDimensions,
    BUILD: holoCreateElement,
    AUTO: holoInitiate,
    carousel: _carousel,
    refresh: _refresh
  }
})()

export default Holo

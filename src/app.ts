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

//HOLO self invoking function

import cyre from 'cyre'
import holoCreateElement from './components/holo-create-element'
import {_holo, _getItemWidthHeight} from './components/holo-essentials'
import holoInitiate from './components/holo-initiate'
import Touch from './components/holo-touch'
import {_transformX, _transformY} from './components/orientation-handler'
import {TouchManager} from './components/holo-touch-manager'

const Holo = (() => {
  cyre.on('refresh carousel', state => {
    const {virtual, shadow} = state
    if (!virtual.id)
      return console.error('Holo carousel refresh error ', virtual.id)
    shadow.container.setAttribute('style', '')
    const {height, width} = _getItemWidthHeight(shadow.container.children[0])
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
      ? -Math.abs(virtual.container.height - virtual.carousel.height)
      : -Math.abs(virtual.container.width - virtual.carousel.width)
    return (
      (_holo[virtual.id].setDimension = {...virtual}),
      cyre.call('SNAP', virtual)
    )
  })

  //snap to grid
  //manages container
  cyre.on('SNAP', virtual => {
    if (!virtual.id) return {id: 'holo-error', payload: 'Holo snap error'}
    _holo[virtual.id].updateStyle = 1
    virtual = virtual.io.orientation
      ? _transformY(virtual)
      : _transformX(virtual)
    return (_holo[virtual.id].setState = {...virtual})
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
        return max || 1
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
    console.log(
      '%c HOLO - Initiating holo v2.3.4 ',
      'background: #022d5f; color: white; display: block;'
    )
    TouchManager(au)
    //init microService
    cyre.action([
      {id: 'refresh screen', debounce: 300}, //adjust width
      {id: 'refresh carousel'},
      {id: 'holo-error', log: true}
    ])
    cyre.on('SHAKE', _addShake)

    //setup screen on initiation
    cyre.on('refresh screen', _refresh)
  }

  //when dom loads do something
  document.addEventListener('DOMContentLoaded', () => {}, false)

  const _refresh = () => {
    for (let id in _holo) {
      cyre.call('refresh carousel', _holo[id].getState)
    }
  }

  //when window resizes do something
  window.addEventListener(
    'resize',
    () => {
      cyre.call('refresh screen')
    },
    false
  )

  //when window loads do something
  window.onload = () => {
    // cyre.dispatch({id: 'app loaded', type: 'LOADED'})
  }

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

// Export for module use
export default Holo

// Also expose to window for UMD/browser usage
if (typeof window !== 'undefined') {
  ;(window as any).Holo = Holo
}

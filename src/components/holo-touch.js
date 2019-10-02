/** @format */

'use strict'
//@ts-check
// @git NeuralLine
// @02/01/2019
import {cyre} from 'cyre'
import {_holo, _isClicked, _swipe} from './holo-essentials'
import {_transformXLite, _transformY} from './orientation-handler'
class TouchClass {
  /*

     H.O.L.O TOUCH EVENTS HANDLER

    */
  constructor() {
    this.positionX = 0
    this.positionY = 0
    this.pressed = 0
    this.virtual = {}
    this.multiplier = 1.482
    this.touch = {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup',
      enter: 'mouseenter'
    }
    this.targetHoloComponent = 0
  }

  //register if touch/click has occurred
  _touchStart(e = window.event, id = 0) {
    if (!id || this.pressed) return console.error('Holo touch : not my business')
    this.TouchStartTimeStamp = performance.now() //snap timer on touch start
    //reset default
    this.virtual = _holo[id].getVirtual
    this.pressed = 1
    this.positionX = e.clientX || e.touches[0].clientX
    this.positionY = e.clientY || e.touches[0].clientY
    this.id = this.virtual.id
    this.currentX = e.clientX || e.touches[0].clientX
    this.currentY = e.clientY || e.touches[0].clientY
    this.snapShotWidth = this.virtual.transformX || 0
    this.snapShotHeight = this.virtual.transformY || 0
    return (
      this.virtual.io.orientation
        ? (this._dragScrollVertical(e), e.preventDefault())
        : (this._dragScrollHorizontal(e), e.preventDefault()),
      (_holo[this.id].updateStyle = 0)
    ) //look into this
  }
  /*
         @dragScroll : handles horizontal drag touch moves
  */
  _dragScrollHorizontal(e) {
    if (!this.pressed) return {ok: false, data: 'not active'}
    this.distance = this.positionX - this.currentX
    this.virtual.transformX = this.snapShotWidth - this.distance * this.multiplier || 0
    _holo[this.id].setState = _transformXLite(this.virtual)
    requestAnimationFrame(this._dragScrollHorizontal.bind(this))
  }

  //@dragScroll : handles vertical drag touch moves
  _dragScrollVertical(e) {
    if (!this.pressed) return {ok: false, data: 'not active'}
    this.distance = this.positionY - this.currentY
    this.virtual.transformY = this.snapShotHeight - this.distance * this.multiplier || 0
    _holo[this.id].setState = {..._transformY(this.virtual)}
    requestAnimationFrame(this._dragScrollVertical.bind(this))
  }

  //Register event/mouse position when touch/drag ends
  _touchEnd(e) {
    if (!this.pressed) return {ok: false, data: 'not active'}
    const touchEndTimeStamp = performance.now()
    e.preventDefault()
    this.pressed = 0 //reset after drag event ended
    const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp
    const speed = _swipe(this.distance, timeElapsed)

    if (speed > 1.2) {
      cyre.call('nxtSlide' + this.id, this.virtual)
    } else if (speed < -1.2) {
      cyre.call('prvSlide' + this.id, this.virtual)
    } else if (_isClicked(timeElapsed)) {
      this.focus(e)
    } else {
      return cyre.call('SNAP' + this.id, this.virtual)
    }
  }

  //highlight active/ selected slide
  focus(e) {
    if (!e.target.closest('li.holo')) return false
    this.targetHoloComponent ? this.targetHoloComponent.classList.remove('active') : false
    this.targetHoloComponent = e.target.closest('li.holo')
    return cyre.call('activate' + this.id, [this.targetHoloComponent, this.virtual])
  }
}
const Touch = new TouchClass()
export default Touch

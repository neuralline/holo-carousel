/** @format */

'use strict'
//@ts-check
// @git NeuralLine
// @02/01/2019
import {cyre} from 'cyre'
import {_holo, _isClicked, _swipe, _transform} from './holo-essentials'

class TouchClass {
  /*

     H.O.L.O TOUCH EVENTS HANDLER

    */
  constructor() {
    this.positionX = 0
    this.positionY = 0
    this.pressed = 0
    this.touch = {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup',
      enter: 'mouseenter'
    }
    this.targetHoloComponent = 0
  }

  //register if touch/click has occured
  _touchStart(e = window.event, id = 0) {
    if (!id || this.pressed) {
      return console.error('Holo touch : not my business')
    }
    this.TouchStartTimeStamp = performance.now() //snap timer on touch start
    e.preventDefault() //reset default
    this.virtual = _holo[id].getVirtual
    this.pressed = 1
    // this.targetHoloComponent = e.target
    this.positionX = e.clientX || e.touches[0].clientX
    this.positionY = e.clientY || e.touches[0].clientY
    this.id = this.virtual.id
    this.currentX = e.clientX || e.touches[0].clientX
    this.currentY = e.clientY || e.touches[0].clientY
    this.snapWidth = this.virtual.transformX || 0
    this.snapHeight = this.virtual.transformY || 0
    return (
      this.virtual.io.orientation === true ? this._dragScrollVertical(e) : this._dragScroll(e),
      (_holo[this.virtual.id].updateStyle = 0)
    ) //look into this
  }
  /*
         @dragScroll : handles drag touch moves
    */
  _dragScroll(e) {
    if (!this.pressed) return {ok: false, data: 'not active'}
    this.distance = this.positionX - this.currentX
    this.virtual.transformX = this.snapWidth - this.distance * 1.482 || 0
    if (this.virtual.transformX >= 100) {
      this.virtual.transformX = 100
      this.virtual.endOfSlide = 1 //Left EnD of the carousel
    } else if (this.virtual.transformX + 100 <= this.virtual.endNumber) {
      this.virtual.transformX = this.virtual.endNumber - 100
      this.virtual.endOfSlide = -1 //Right end of the carousel
    } else {
      this.virtual.endOfSlide = 0 //in the middle carousel
    }
    _transform(this.id, this.virtual.transformX, 0, 0)
    requestAnimationFrame(this._dragScroll.bind(this))
  }

  //@dragScroll : handles vertical drag touch moves
  _dragScrollVertical(e) {
    if (!this.pressed) return 0
    this.distance = this.positionY - this.currentY
    this.virtual.transformY = this.snapHeight - this.distance * 1.482 || 0
    _transform(this.virtual.id, 0, this.virtual.transformY, 0)
    requestAnimationFrame(this._dragScrollVertical.bind(this))
  }

  //Register event/mouse position when touch/drag ends
  _touchEnd(e) {
    const touchEndTimeStamp = performance.now()
    e.preventDefault()
    if (!this.pressed) return 0
    this.pressed = 0 //reset after drag event ended
    const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp
    const speed = _swipe(this.distance, timeElapsed)

    if (speed > 1.2) {
      cyre.emit('nxtSlide' + this.virtual.id, this.virtual)
    } else if (speed < -1.2) {
      cyre.emit('prvSlide' + this.virtual.id, this.virtual)
    } else if (_isClicked(timeElapsed)) {
      this.focus(e)
    } else {
      //if it is a single click
    }
    return cyre.emit('SNAP' + this.virtual.id, this.virtual)
  }

  //highlight active/ selected slide
  focus(e) {
    //bring selected element to view
    if (!e.target.closest('li.holo')) return false
    this.targetHoloComponent ? this.targetHoloComponent.classList.remove('active') : false
    this.targetHoloComponent = e.target.closest('li.holo')
    try {
      PROTVJS.PLAY_THIS(this.targetHoloComponent.id)
    } catch (f) {
      //console.log('@playthis not found : ', this.targetHoloComponent.id);
    }
    return cyre.emit('activate' + this.virtual.id, [this.targetHoloComponent, this.virtual])
  }

  //manage active/highlighted slides
  activate([element, virtual]) {
    virtual.transformX = -Math.abs(element.offsetLeft)
    cyre.emit('SNAP' + virtual.id, virtual)
    element.classList.add('active')
  }

  //previous slide operator
  prvSlide(virtual) {
    if (virtual.endOfSlide === 1) return //console.error('shake');
    virtual.transformX += virtual.carousel.width || 0
    virtual.transformY += virtual.carousel.height || 0
    return cyre.emit('SNAP' + virtual.id, virtual)
  }

  //next slide operator
  nxtSlide(virtual) {
    if (virtual.endOfSlide === -1) return //console.error('shake');
    virtual.transformX -= virtual.carousel.width || 0
    virtual.transformY -= virtual.carousel.height || 0
    return cyre.emit('SNAP' + virtual.id, virtual)
  }

  //jump to first slide operator
  firstSlide(virtual) {
    virtual.transformX = 0
    virtual.transformY = 0
    virtual.endOfSlide = 1
    return cyre.emit('SNAP' + virtual.id, virtual)
  }

  //jump to last slide operator
  lastSlide(virtual) {
    virtual.transformX = virtual.endNumber
    virtual.transformY = virtual.endNumber
    virtual.endOfSlide = -1
    return cyre.emit('SNAP' + virtual.id, virtual)
  }

  //animate slides
  animateSlideForward(virtual) {
    console.log('animating', virtual)
    if (virtual.endOfSlide === -1) {
      return cyre.emit('firstSlide' + virtual.id, virtual)
    }
    return cyre.emit('nxtSlide' + virtual.id, virtual)
  }

  animateSlideBackward(virtual) {
    if (virtual.endOfSlide === 1) {
      return cyre.emit('lastSlide' + virtual.id, virtual)
    }
    return cyre.emit('prvSlide' + virtual.id, virtual)
  }

  //mouse 3rd button 'wheel' controller
  wheeler(e, id) {
    e.preventDefault()
    const virtual = _holo[id].getVirtual
    if (e.deltaY < 0) {
      cyre.emit('prvSlide' + virtual.id, virtual)
    } else if (e.deltaY > 0) {
      cyre.emit('nxtSlide' + virtual.id, virtual)
    }
  }
}
const Touch = new TouchClass()
export default Touch

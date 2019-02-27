/** @format */

'use strict'
//@ts-check
import HoloCli from './holo-cli'

class Aure extends HoloCli {
  /*

     H.O.L.O - A.U.R.E`
     aka holo-create-carousel

     */
  constructor(slide, io = {}) {
    super()
    if (!slide) {
      return console.error('@Holo: Oh putain` problame with the given slider ')
    }
    if (!slide.id) {
      console.error('@Holo: oh putain` carousel has no ID ')
      id = 'OhPutain' + performance.now()
      this.id = id
      side.id = this.id
    }
    // console.log('@Aure`  Initializing slider       ---2.0.1');
    this.shadow.carousel = slide
    this.id = slide.id
    this.shadow.container = this.shadow.carousel.getElementsByClassName('holo-container')[0] || 0
    this.shadow.container ? this.initializeHolo() : console.error('@Holo : holo-container is empty : ', this.id)
  }

  initializeHolo() {
    this.shadow.carousel.width = this.shadow.carousel.clientWidth || 0 //initializeHolo
    if (!this.shadow.container.children.length) {
      return console.error('@Holo: no holo element found  : ', this.id)
    }
    this.virtual.id = this.id
    this.virtual.childLength = this.shadow.container.children.length
    this.virtual.carousel.width = this.shadow.container.clientWidth
    this.virtual.carousel.height = this.shadow.container.clientHeight
    this.virtual.startNumber = 0
    this.virtual.endNumber = 0
    this.virtual.item.min = 1
    /* 
   this.virtual.item.max = this.virtual.carousel.dataset.max || 0
    this.virtual.io.wheel = !!this.virtual.carousel.dataset.wheel
    this.virtual.io.orientation = !!this.virtual.carousel.dataset.orientation    
    this.virtual.io.animate = Number(this.virtual.carousel.dataset.animate) || 0
    this.virtual.io.duration = Number(this.virtual.carousel.dataset.duration) || 0
    this.virtual.io.loop = Number(this.virtual.carousel.dataset.loop) || 0
    this.virtual.io.focus = this.virtual.carousel.dataset.focus || 0 */
  }

  get getVirtual() {
    //provide virtual dom state upon request
    return this.virtual
  }
  get getShadow() {
    //provide shadow dom state upon request
    return this.shadow
  }
  get getState() {
    //provide shadow dom state upon request
    return {virtual: this.virtual, shadow: this.shadow}
  }
  get getDimensions() {
    return {
      car: {
        w: this.shadow.carousel.width,
        h: this.shadow.carousel.height
      },
      con: {
        w: this.shadow.container.width,
        h: this.shadow.container.height,
        x: this.shadow.transformX,
        y: this.shadow.transformY,
        s: {}
      }
    }
  }

  //update _state object
  set setState(state) {
    if (!state) return false
    this.virtual = {...state}
    this.virtual.io.orientation ? 0 : (this.shadow.carousel.style.width = state.carousel.width + 'px')
    this.virtual.io.orientation ? (this.shadow.carousel.style.height = state.carousel.height + 'px') : 0
    //END OF DOM ACCESS
  }
  /**
   *
   * @param {number} on 1 = add style 0 = remove style
   */
  set updateStyle(on = 0) {
    //add or remove transition duration to container
    if (on) {
      this.shadow.container.style.transitionDuration = this.virtual.duration + 'ms'
      this.shadow.container.style.transitionTimingFunction = 'cubic-bezier(0.215, 0.61, 0.355, 1)'
    } else {
      this.shadow.container.style.transitionDuration = '0ms'
      this.shadow.container.style.transitionTimingFunction = 'linear'
    }
  }
}
export default Aure

//src/components/core
import HoloCli from './holo-cli'

class Aure extends HoloCli {
  /*

     H.O.L.O - A.U.R.E`
     aka holo-create-carousel

     */
  constructor(slide, io = {}) {
    super()
    if (!slide) console.error('@Holo: Oh putain` no slide')

    // console.log('@Aure`  Initializing slider       ---2.0.1');
    this.id = slide.id || 'OhPutain' + performance.now()
    this.shadow.carousel = slide
    this.shadow.container =
      this.shadow.carousel.getElementsByClassName('holo-container')[0] || 0
    this.shadow.container
      ? this.initializeHolo()
      : console.error('@Holo : Oh Putain` holo-container not found : ', this.id)
  }

  initializeHolo() {
    this.shadow.carousel.width = this.shadow.carousel.clientWidth || 0 //initializeHolo
    if (!this.shadow.container.children.length) {
      this.virtual.noOfChildren = 0
      return console.error(
        '@Holo: Oh Putain`  holo-container is empty  : ',
        this.id
      )
    }
    this.virtual.id = this.id
    this.virtual.noOfChildren = this.shadow.container.children.length
    this.virtual.carousel.width = this.shadow.container.clientWidth
    this.virtual.carousel.height = this.shadow.container.clientHeight
    this.virtual.startNumber = 0
    this.virtual.endOfSlidePosition = 0
    this.virtual.item.min = 1
  }

  get getVirtual() {
    //provide virtual dom state upon request
    return {...this.virtual}
  }
  get getShadow() {
    //provide shadow dom state upon request
    return this.shadow
  }
  get getState() {
    //provide shadow dom state upon request
    return {virtual: this.getVirtual, shadow: this.getShadow}
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
        z: this.shadow.transformZ
      }
    }
  }

  //update _state object
  set setState(virtual) {
    if (!virtual) return false
    this.virtual = {...this.virtual, ...virtual}
    this.shadow.container.style.transform = `translate3d(${this.virtual.transformX}px, ${this.virtual.transformY}px, ${this.virtual.transformZ}px)`
    //END OF DOM ACCESS
  }
  //update _state object
  set setDimension(virtual) {
    if (!virtual) return false
    this.virtual = {...this.virtual, ...virtual, ...virtual.io}
    this.virtual.io.orientation
      ? 0
      : (this.shadow.carousel.style.width = this.virtual.carousel.width + 'px')
    this.virtual.io.orientation
      ? (this.shadow.carousel.style.height =
          this.virtual.carousel.height + 'px')
      : 0
    //END OF DOM ACCESS
  }
  /**
   *
   * @param {number} on 1 = add style 0 = remove style
   */
  set updateStyle(on = 0) {
    //add or remove transition duration to container
    if (on) {
      this.shadow.container.style.transitionDuration =
        this.virtual.duration + 'ms'
      this.shadow.container.style.transitionTimingFunction =
        this.virtual.transitionTiming
    } else {
      this.shadow.container.style.transitionDuration = '0ms'
      this.shadow.container.style.transitionTimingFunction = 'linear'
    }
  }
}
export default Aure

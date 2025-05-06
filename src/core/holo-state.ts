//src/core/holo-state.ts

import {
  HoloVirtual,
  HoloShadow,
  HoloInstance,
  HoloIOOptions
} from '../types/interface'

/**
 * Create default virtual state
 */
export const createDefaultVirtual = (id: string = ''): HoloVirtual => {
  return {
    id: id,
    carousel: {},
    container: {},
    io: createDefaultIOOptions(id),
    title: null,
    description: null,
    duration: 600,
    transitionTiming: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    transformX: 0,
    transformY: 0,
    transformZ: 0,
    numberOfSlots: 0,
    endOfSlide: 0,
    item: {
      max: 8
    }
  }
}

/**
 * Create default IO options
 */
export const createDefaultIOOptions = (id: string = ''): HoloIOOptions => {
  return {
    id: id,
    enabled: 1,
    wheel: 0,
    controller: 0,
    drag: 1,
    swipe: 1,
    snap: 3,
    focus: 1,
    animate: 1,
    animateDirection: 1,
    duration: 0,
    loop: 200,
    orientation: 0,
    active: true,
    onClick: true,
    onDoubleClick: true
  }
}

/**
 * Create default shadow state
 */
export const createDefaultShadow = (): HoloShadow => {
  return {
    carousel: {} as HTMLElement,
    container: {} as HTMLElement
  }
}

/**
 * Create a new Holo instance (functional replacement for Aure class)
 */
export const createHoloInstance = (
  slide: HTMLElement,
  io: Partial<HoloIOOptions> = {}
): HoloInstance => {
  const id = slide.id || 'holo-' + performance.now()

  const virtual = createDefaultVirtual(id)
  const shadow: HoloShadow = {
    carousel: slide,
    container: slide.getElementsByClassName('holo-container')[0] as HTMLElement
  }

  // Apply custom IO options
  virtual.io = {...virtual.io, ...io, id}

  // Initialize properties
  if (shadow.container) {
    virtual.carousel.width = shadow.carousel.clientWidth || 0

    if (shadow.container.children.length) {
      virtual.id = id
      virtual.noOfChildren = shadow.container.children.length
      virtual.carousel.width = shadow.container.clientWidth
      virtual.carousel.height = shadow.container.clientHeight
      virtual.startNumber = 0
      virtual.endOfSlidePosition = 0
      virtual.item.min = 1
    } else {
      virtual.noOfChildren = 0
      console.error('@Holo: holo-container is empty:', id)
    }
  } else {
    console.error('@Holo: holo-container not found:', id)
  }

  // Create the interface for the instance
  const instance: HoloInstance = {
    virtual,
    shadow,

    get getVirtual(): HoloVirtual {
      return {...this.virtual}
    },

    get getShadow(): HoloShadow {
      return this.shadow
    },

    get getState() {
      return {virtual: this.getVirtual, shadow: this.getShadow}
    },

    get getDimensions() {
      return {
        car: {
          w: this.shadow.carousel.clientWidth || 0,
          h: this.shadow.carousel.clientHeight || 0
        },
        con: {
          w: this.shadow.container.clientWidth || 0,
          h: this.shadow.container.clientHeight || 0,
          x: this.virtual.transformX,
          y: this.virtual.transformY,
          z: this.virtual.transformZ
        }
      }
    },

    set setState(updatedVirtual: HoloVirtual) {
      if (!updatedVirtual) return

      this.virtual = {...this.virtual, ...updatedVirtual}
      this.shadow.container.style.transform = `translate3d(${this.virtual.transformX}px, ${this.virtual.transformY}px, ${this.virtual.transformZ}px)`
    },

    set setDimension(updatedVirtual: HoloVirtual) {
      if (!updatedVirtual) return

      this.virtual = {...this.virtual, ...updatedVirtual}

      if (this.virtual.io.orientation) {
        this.shadow.carousel.style.height = `${this.virtual.carousel.height}px`
      } else {
        this.shadow.carousel.style.width = `${this.virtual.carousel.width}px`
      }
    },

    set updateStyle(on: number) {
      if (on) {
        this.shadow.container.style.transitionDuration = `${this.virtual.duration}ms`
        this.shadow.container.style.transitionTimingFunction =
          this.virtual.transitionTiming
      } else {
        this.shadow.container.style.transitionDuration = '0ms'
        this.shadow.container.style.transitionTimingFunction = 'linear'
      }
    }
  }

  return instance
}

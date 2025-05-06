/**
 *  default entries
 *
 * @format
 */

class HoloCli {
  /*

     H.O.L.O -  C.L.I
     constrictor and default values

     */

  constructor() {
    this.id = 0
    this.virtual = {
      id: this.id || 0,
      carousel: {},
      container: {},
      io: {},
      title: null,
      description: null,
      duration: 600,
      transitionTiming: 'cubic- bezier(0.215, 0.61, 0.355, 1)',
      transformX: 0,
      transformY: 0,
      transformZ: 0,
      numberOfSlots: 0,
      endOfSlide: 0,
      item: {
        max: 8
      }
    }

    this.shadow = {
      carousel: {},
      container: {}
    }

    this.virtual.io = {
      id: this.id || 0,
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

    this.style = {}
  }
}

export default HoloCli

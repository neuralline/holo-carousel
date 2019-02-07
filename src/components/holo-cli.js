/**

 *  deafualt entries
 */
class HoloCli {
  /*

     H.O.L.O -  C.L.I

     */

  constructor() {
    this.id = 0;
    this._state = {
      id: 0,
      carousel: {},
      duration: 600,
      container: {},
      transformX: 0,
      transformY: 0,
      numberOfSlots: 0,
      sliderEnd: 0,
      item: {
        max: 8
      }
    };

    this._state.io = {
      id: null,
      title: null,
      description: null,
      enabled: 1,
      wheel: 1,
      controller: 0,
      drag: 1,
      swipe: 0,
      snap: 0,
      focus: 0,
      animate: 1,
      animateDirection: 0,
      duration: 0,
      loop: 0,
      orientation: 0,
      active: true,
      onClick: true,
      onDoubleClick: true
    };
    this._state.elm = {
      container: 1,
      carousel: 0
    };

    this.style = {};
  }
}

export default HoloCli;

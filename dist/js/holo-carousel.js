(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('cyre')) :
typeof define === 'function' && define.amd ? define(['cyre'], factory) :
(global = global || self, global.Holo = factory(global.cyre));
}(this, (function (cyre) { 'use strict';

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
    this.id = 0;
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
    };

    this.shadow = {
      carousel: {},
      container: {}
    };

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
    };

    this.style = {};
  }
}

/** @format */

class Aure extends HoloCli {
  /*

     H.O.L.O - A.U.R.E`
     aka holo-create-carousel

     */
  constructor(slide, io = {}) {
    super();
    if (!slide) console.error('@Holo: Oh putain` no slide');

    // console.log('@Aure`  Initializing slider       ---2.0.1');
    this.id = slide.id || 'OhPutain' + performance.now();
    this.shadow.carousel = slide;
    this.shadow.container = this.shadow.carousel.getElementsByClassName('holo-container')[0] || 0;
    this.shadow.container
      ? this.initializeHolo()
      : console.error('@Holo : Oh Putain` holo-container not found : ', this.id);
  }

  initializeHolo() {
    this.shadow.carousel.width = this.shadow.carousel.clientWidth || 0; //initializeHolo
    if (!this.shadow.container.children.length) {
      this.virtual.noOfChildren = 0;
      return console.error('@Holo: Oh Putain`  holo-container is empty  : ', this.id)
    }
    this.virtual.id = this.id;
    this.virtual.noOfChildren = this.shadow.container.children.length;
    this.virtual.carousel.width = this.shadow.container.clientWidth;
    this.virtual.carousel.height = this.shadow.container.clientHeight;
    this.virtual.startNumber = 0;
    this.virtual.endOfSlidePosition = 0;
    this.virtual.item.min = 1;
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
    this.virtual = {...this.virtual, ...virtual};
    this.shadow.container.style.transform = `translate3d(${this.virtual.transformX}px, ${this.virtual.transformY}px, ${
      this.virtual.transformZ
    }px)`;
    //END OF DOM ACCESS
  }
  //update _state object
  set setDimension(virtual) {
    if (!virtual) return false
    this.virtual = {...this.virtual, ...virtual, ...virtual.io};
    this.virtual.io.orientation ? 0 : (this.shadow.carousel.style.width = this.virtual.carousel.width + 'px');
    this.virtual.io.orientation ? (this.shadow.carousel.style.height = this.virtual.carousel.height + 'px') : 0;
    //END OF DOM ACCESS
  }
  /**
   *
   * @param {number} on 1 = add style 0 = remove style
   */
  set updateStyle(on = 0) {
    //add or remove transition duration to container
    if (on) {
      this.shadow.container.style.transitionDuration = this.virtual.duration + 'ms';
      this.shadow.container.style.transitionTimingFunction = this.virtual.transitionTiming;
    } else {
      this.shadow.container.style.transitionDuration = '0ms';
      this.shadow.container.style.transitionTimingFunction = 'linear';
    }
  }
}

/** @format */
//@ts-check
/**

     H.O.L.O -  essential functions

*/

/**
 * @param{object} _holo holo database object
 */
const _holo = {}; //main instance
/**
 *
 * @param {string} id holo[id]
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */

/**
 *
 * @param {number} parent parent width
 * @param {number} item child width
 */
const _snap = (parent, item) => {
  return Math.round(parent / item) * item
};

const _isClicked = timeElapsed => {
  return timeElapsed < 250 ? 1 : 0 ///handle click, touch, double click or long-touch events
};

/**
 *
 * @param {number} distance
 * @param {number} timeElapsed
 */
const _swipe = (distance, timeElapsed) => {
  return distance / timeElapsed
};

//pure function
const _getItemWidthHeight = e => {
  if (!e) return 0
  const outer = {};
  outer.width = e.offsetWidth;
  outer.height = e.offsetHeight;
  const style = window.getComputedStyle(e, null);
  outer.width += parseInt(style.marginLeft) + parseInt(style.marginRight);
  outer.height += parseInt(style.marginTop) + parseInt(style.marginBottom);
  return outer
};

//manage active/highlighted slides
const activate = ([element, virtual]) => {
  virtual.transformX = -Math.abs(element.offsetLeft);
  cyre.cyre.call('SNAP' + virtual.id, virtual);
  element.classList.add('active');
};

//previous slide operator
const prvSlide = virtual => {
  if (virtual.endOfSlide === 1) return //console.error('shake');
  virtual.transformX += virtual.carousel.width || 0;
  virtual.transformY += virtual.carousel.height || 0;
  return cyre.cyre.call('SNAP' + virtual.id, virtual)
};

//next slide operator
const nxtSlide = virtual => {
  if (virtual.endOfSlide === -1) return //console.error('shake');
  virtual.transformX -= virtual.carousel.width || 0;
  virtual.transformY -= virtual.carousel.height || 0;
  return cyre.cyre.call('SNAP' + virtual.id, virtual)
};

//jump to first slide operator
const firstSlide = virtual => {
  virtual.transformX = 0;
  virtual.transformY = 0;
  virtual.endOfSlide = 1;
  return cyre.cyre.call('SNAP' + virtual.id, virtual)
};

//jump to last slide operator
const lastSlide = virtual => {
  virtual.transformX = virtual.endOfSlidePosition;
  virtual.transformY = virtual.endOfSlidePosition;
  virtual.endOfSlide = -1;
  return cyre.cyre.call('SNAP' + virtual.id, virtual)
};

//animate slides
const animateSlideForward = virtual => {
  console.log('animating', virtual);
  if (virtual.endOfSlide === -1) {
    return cyre.cyre.call('firstSlide' + virtual.id, virtual)
  }
  return cyre.cyre.call('nxtSlide' + virtual.id, virtual)
};

const animateSlideBackward = virtual => {
  if (virtual.endOfSlide === 1) {
    return cyre.cyre.call('lastSlide' + virtual.id, virtual)
  }
  return cyre.cyre.call('prvSlide' + virtual.id, virtual)
};

//mouse 3rd button 'wheel' controller
const wheeler = (e, id) => {
  e.preventDefault();
  const virtual = _holo[id].getVirtual;
  if (e.deltaY < 0) {
    cyre.cyre.call('prvSlide' + virtual.id, virtual);
  } else if (e.deltaY > 0) {
    cyre.cyre.call('nxtSlide' + virtual.id, virtual);
  }
};

/** @format */
/**
 *
 * @param {object} virtual
 */
const _transformX = virtual => {
  virtual.transformX = virtual.io.snap ? _snap(virtual.transformX, virtual.item.width) : virtual.transformX;
  virtual.transformY = 0;
  if (virtual.transformX >= 0) {
    virtual.transformX = 0;
    virtual.endOfSlide = 1; //Left EnD of the carousel
  } else if (virtual.transformX <= virtual.endOfSlidePosition) {
    virtual.transformX = virtual.endOfSlidePosition;
    virtual.endOfSlide = -1; //Right end of the carousel
  } else {
    virtual.endOfSlide = 0; //in the middle carousel
  }
  return virtual
};

const _transformXLite = virtual => {
  virtual.transformY = 0;
  if (virtual.transformX >= 0) {
    virtual.transformX = 0;
  } else if (virtual.transformX <= virtual.endOfSlidePosition) {
    virtual.transformX = virtual.endOfSlidePosition;
  }
  return virtual
};

/**
 *
 * @param {object} virtual
 */
const _transformY = virtual => {
  virtual.transformY = virtual.io.snap ? _snap(virtual.transformY, virtual.item.height) : virtual.transformY;
  virtual.transformX = 0;
  if (virtual.transformY >= 0) {
    virtual.transformY = 0;
    virtual.endOfSlide = 1; //Left EnD of the carousel
  } else if (virtual.transformY <= virtual.endOfSlidePosition) {
    virtual.transformY = virtual.endOfSlidePosition;
    virtual.endOfSlide = -1; //Right end of the carousel
  } else {
    virtual.endOfSlide = 0; //in the middle carousel
  }
  return virtual
};

/** @format */
class TouchClass {
  /*

     H.O.L.O TOUCH EVENTS HANDLER

    */
  constructor() {
    this.positionX = 0;
    this.positionY = 0;
    this.pressed = 0;
    this.virtual = {};
    this.multiplier = 1.482;
    this.touch = {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup',
      enter: 'mouseenter'
    };
    this.targetHoloComponent = 0;
  }

  //register if touch/click has occurred
  _touchStart(e = window.event, id = 0) {
    if (!id || this.pressed) return console.error('Holo touch : not my business')
    this.TouchStartTimeStamp = performance.now(); //snap timer on touch start
    //reset default
    this.virtual = _holo[id].getVirtual;
    this.pressed = 1;
    this.positionX = e.clientX || e.touches[0].clientX;
    this.positionY = e.clientY || e.touches[0].clientY;
    this.id = this.virtual.id;
    this.currentX = e.clientX || e.touches[0].clientX;
    this.currentY = e.clientY || e.touches[0].clientY;
    this.snapShotWidth = this.virtual.transformX || 0;
    this.snapShotHeight = this.virtual.transformY || 0;
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
    this.distance = this.positionX - this.currentX;
    this.virtual.transformX = this.snapShotWidth - this.distance * this.multiplier || 0;
    _holo[this.id].setState = _transformXLite(this.virtual);
    requestAnimationFrame(this._dragScrollHorizontal.bind(this));
  }

  //@dragScroll : handles vertical drag touch moves
  _dragScrollVertical(e) {
    if (!this.pressed) return {ok: false, data: 'not active'}
    this.distance = this.positionY - this.currentY;
    this.virtual.transformY = this.snapShotHeight - this.distance * this.multiplier || 0;
    _holo[this.id].setState = {..._transformY(this.virtual)};
    requestAnimationFrame(this._dragScrollVertical.bind(this));
  }

  //Register event/mouse position when touch/drag ends
  _touchEnd(e) {
    if (!this.pressed) return {ok: false, data: 'not active'}
    const touchEndTimeStamp = performance.now();
    e.preventDefault();
    this.pressed = 0; //reset after drag event ended
    const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp;
    const speed = _swipe(this.distance, timeElapsed);

    if (speed > 1.2) {
      cyre.cyre.call('nxtSlide' + this.id, this.virtual);
    } else if (speed < -1.2) {
      cyre.cyre.call('prvSlide' + this.id, this.virtual);
    } else if (_isClicked(timeElapsed)) {
      this.focus(e);
    } else {
      return cyre.cyre.call('SNAP' + this.id, this.virtual)
    }
  }

  //highlight active/ selected slide
  focus(e) {
    if (!e.target.closest('li.holo')) return false
    this.targetHoloComponent ? this.targetHoloComponent.classList.remove('active') : false;
    this.targetHoloComponent = e.target.closest('li.holo');
    return cyre.cyre.call('activate' + this.id, [this.targetHoloComponent, this.virtual])
  }
}
const Touch = new TouchClass();

/** @format */

/**
 *
 * @param {object} virtual  holo[id].virtual
 * @param {object} shadow  holo[id].shadow
 */

const ManageIO = (virtual, shadow) => {
  if (!virtual) return console.error('@Holo : Major malfunctions')
  cyre.cyre.action([
    {
      id: 'Animate' + virtual.id,
      type: virtual.io.animateDirection > 0 ? 'AnimateForward' : 'AnimateBackward',
      payload: virtual,
      interval: virtual.io.duration,
      repeat: virtual.io.loop,
      log: true
    },
    {
      id: 'SNAP' + virtual.id,
      type: 'SNAP',
      payload: virtual
    },
    {
      id: 'prvSlide' + virtual.id,
      type: 'prvSlide',
      payload: virtual
    },
    {
      id: 'nxtSlide' + virtual.id,
      type: 'nxtSlide',
      payload: virtual
    },
    {
      id: 'lastSlide' + virtual.id,
      type: 'lastSlide',
      payload: virtual
    },
    {
      id: 'firstSlide' + virtual.id,
      type: 'firstSlide',
      payload: virtual
    },
    {
      id: 'activate' + virtual.id,
      type: 'activate',
      payload: virtual
    }
  ]);

  if (virtual.io.enabled) {
    virtual.io.drag
      ? shadow.container.addEventListener('mousedown', e => {
          e.preventDefault();
          Touch._touchStart(e, virtual.id);
        })
      : false;

    virtual.io.drag
      ? shadow.container.addEventListener('touchstart', e => {
          e.preventDefault();
          Touch._touchStart(e, virtual.id);
        })
      : false;

    virtual.io.wheel
      ? shadow.carousel.addEventListener('wheel', e => {
          wheeler(e, virtual.id);
        })
      : false;

    virtual.io.animate ? cyre.cyre.call('Animate' + virtual.id, virtual) : false;

    shadow.container.addEventListener(
      //when window resizes do something
      'resize',
      () => {
        cyre.cyre.call('refresh carousel', {virtual, shadow});
      },
      false
    );
  }

  cyre.cyre.call('refresh carousel', {virtual, shadow});
};

/** @format */
/**
@param{object} slide single element of halo
@param{object} io holo input output parameters/options
*/
const holoCreateElement = (slide, io) => {
  _holo[slide.id] = new Aure(slide, io); //register found carousels

  ManageIO(_holo[slide.id].getVirtual, _holo[slide.id].getShadow);
};

/** @format */

//holo Locate all holo carousel structures ByClassName
/**
 * @param{string} carouselName get all carousels by this class name
 */
const holoInitiate = carouselName => {
  console.log('@holo holo auto activated :', carouselName);
  const carousels = document.getElementsByClassName(carouselName);
  if (carousels.length) {
    for (let slide of carousels) {
      holoCreateElement(slide, {});
    }
  } else {
    return console.log('@Holo : carousel structure not found')
  }
};

/** @format */

const TouchManager = () => {
  document.addEventListener('mousemove', e => {
    if (Touch.pressed) {
      Touch.currentX = e.clientX;
      Touch.currentY = e.clientY;
    }
  });

  document.addEventListener('mouseup', e => {
    e.preventDefault();
    Touch.pressed ? Touch._touchEnd(e) : false;
  });

  document.addEventListener('touchmove', e => {
    if (Touch.pressed) {
      Touch.currentX = e.touches[0].clientX;
      Touch.currentY = e.touches[0].clientY;
    }
  });

  document.addEventListener('touchend', e => {
    Touch.pressed ? Touch._touchEnd(e) : false;
  });

  cyre.cyre.on('AnimateForward', animateSlideForward);
  cyre.cyre.on('AnimateBackward', animateSlideBackward);
  cyre.cyre.on('nxtSlide', nxtSlide);
  cyre.cyre.on('prvSlide', prvSlide);
  cyre.cyre.on('firstSlide', firstSlide);
  cyre.cyre.on('lastSlide', lastSlide);
  cyre.cyre.on('bringToFocus', Touch.focus);
  cyre.cyre.on('wheeler', wheeler);
  cyre.cyre.on('activate', activate);
  return true
};

/** @format */

const Holo = (() => {
  cyre.cyre.on('refresh carousel', state => {
    const {virtual, shadow} = state;
    if (!virtual.id) return console.error('Holo carousel refresh error ', virtual.id)
    shadow.container.setAttribute('style', '');
    const {height, width} = _getItemWidthHeight(shadow.container.children[0]);
    virtual.item.height = height;
    virtual.item.width = width;
    virtual.numberOfSlots =
      _numberOfSlots(shadow.carousel.parentNode.clientWidth, virtual.item.width, virtual.item.max) || 1;
    const calcCarouselWidth = virtual.numberOfSlots * virtual.item.width;
    const innerCarouselWidth = shadow.carousel.clientWidth;
    const calcWidth = shadow.container.children.length * virtual.item.width;
    const innerWidth = shadow.container.clientWidth || calcWidth;
    virtual.carousel.width = calcCarouselWidth || innerCarouselWidth;
    virtual.carousel.height = virtual.item.height || shadow.carousel.clientHeight;
    virtual.container.width = virtual.io.orientation ? shadow.carousel.width : innerWidth;
    virtual.container.height = shadow.container.clientHeight || virtual.item.height || 0;
    virtual.endOfSlidePosition = virtual.io.orientation
      ? -Math.abs(virtual.container.height - virtual.carousel.height)
      : -Math.abs(virtual.container.width - virtual.carousel.width);
    return (_holo[virtual.id].setDimension = {...virtual}), cyre.cyre.call('snap to position', virtual)
  });

  //snap to grid
  //manages container
  cyre.cyre.on('SNAP', virtual => {
    if (!virtual.id) return console.error('Holo snap error')
    _holo[virtual.id].updateStyle = 1;
    virtual = virtual.io.orientation ? _transformY(virtual) : _transformX(virtual);
    return (_holo[virtual.id].setState = {...virtual})
  });

  const _carousel = (id, io = {}) => {
    //_holo[id]?
    const virtual = _holo[id].virtual;
    for (const attribute in io) {
      virtual.io[attribute] ? (virtual.io[attribute] = io[attribute]) : false;
    }
    return {ok: true, data: virtual.io}
  };
  /**
   *
   * @param {string} id
   */
  const getDimensions = id => {
    return _holo[id].getDimensions
  };
  /**
   *
   * @param {number} parent
   * @param {number} item
   * @param {number} max
   */

  const _numberOfSlots = (parent, item, max) => {
    let slots = Math.floor(parent / item);
    if (max) {
      if (slots > max) {
        return max || 1
      }
    }
    return slots || 1
  };

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

    console.log('shaking');
  };

  /**
   *
   * @param {string} au
   */
  const init = (au = 'holo-carousel') => {
    console.log('%c HOLO - Initiating holo v2.3.4 ', 'background: #022d5f; color: white; display: block;');
    TouchManager();
    //init microService
    cyre.cyre.action([
      {id: 'refresh screen', log:true}, //adjust width
      {id: 'refresh carousel'},
      {id: 'snap to position', type: 'SNAP'}
    ]);
    cyre.cyre.on('SHAKE', _addShake);

    //setup screen on initiation
    cyre.cyre.on('refresh screen', _refresh);
  };

  //when dom loads do something
  document.addEventListener('DOMContentLoaded', () => {}, false);

  const _refresh = () => {
    for (let id in _holo) {
      console.log('@holo refreshing : ', id);
      cyre.cyre.call('refresh carousel', _holo[id].getState);
    }
  };

  //when window resizes do something
  window.addEventListener(
    'resize',
    () => {
      cyre.cyre.call('refresh screen');
    },
    false
  );

  //when window loads do something
  window.onload = () => {
    // cyre.dispatch({id: 'app loaded', type: 'LOADED'})
  };



  
  return {
    TOUCH: Touch,
    INIT: init,
    BUILD: holoCreateElement,
    AUTO: holoInitiate,
    carousel: _carousel,
    refresh: _refresh,
    dimensions: getDimensions
  }
})();

return Holo;

})));

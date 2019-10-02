import { cyre } from 'cyre';

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

/**
 *  default entries
 *
 * @format
 */
var HoloCli =
/*
     H.O.L.O -  C.L.I
   constrictor and default values
     */
function HoloCli() {
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
};

/** @format */

var Aure =
/*#__PURE__*/
function (_HoloCli) {
  _inheritsLoose(Aure, _HoloCli);

  /*
       H.O.L.O - A.U.R.E`
     aka holo-create-carousel
       */
  function Aure(slide, io) {
    var _this;

    _this = _HoloCli.call(this) || this;
    if (!slide) console.error('@Holo: Oh putain` no slide'); // console.log('@Aure`  Initializing slider       ---2.0.1');

    _this.id = slide.id || 'OhPutain' + performance.now();
    _this.shadow.carousel = slide;
    _this.shadow.container = _this.shadow.carousel.getElementsByClassName('holo-container')[0] || 0;
    _this.shadow.container ? _this.initializeHolo() : console.error('@Holo : Oh Putain` holo-container not found : ', _this.id);
    return _this;
  }

  var _proto = Aure.prototype;

  _proto.initializeHolo = function initializeHolo() {
    this.shadow.carousel.width = this.shadow.carousel.clientWidth || 0; //initializeHolo

    if (!this.shadow.container.children.length) {
      this.virtual.noOfChildren = 0;
      return console.error('@Holo: Oh Putain`  holo-container is empty  : ', this.id);
    }

    this.virtual.id = this.id;
    this.virtual.noOfChildren = this.shadow.container.children.length;
    this.virtual.carousel.width = this.shadow.container.clientWidth;
    this.virtual.carousel.height = this.shadow.container.clientHeight;
    this.virtual.startNumber = 0;
    this.virtual.endOfSlidePosition = 0;
    this.virtual.item.min = 1;
  };

  _createClass(Aure, [{
    key: "getVirtual",
    get: function get() {
      //provide virtual dom state upon request
      return _extends({}, this.virtual);
    }
  }, {
    key: "getShadow",
    get: function get() {
      //provide shadow dom state upon request
      return this.shadow;
    }
  }, {
    key: "getState",
    get: function get() {
      //provide shadow dom state upon request
      return {
        virtual: this.getVirtual,
        shadow: this.getShadow
      };
    }
  }, {
    key: "getDimensions",
    get: function get() {
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
      };
    } //update _state object

  }, {
    key: "setState",
    set: function set(virtual) {
      if (!virtual) return false;
      this.virtual = _extends({}, this.virtual, {}, virtual);
      this.shadow.container.style.transform = "translate3d(" + this.virtual.transformX + "px, " + this.virtual.transformY + "px, " + this.virtual.transformZ + "px)"; //END OF DOM ACCESS
    } //update _state object

  }, {
    key: "setDimension",
    set: function set(virtual) {
      if (!virtual) return false;
      this.virtual = _extends({}, this.virtual, {}, virtual, {}, virtual.io);
      this.virtual.io.orientation ? 0 : this.shadow.carousel.style.width = this.virtual.carousel.width + 'px';
      this.virtual.io.orientation ? this.shadow.carousel.style.height = this.virtual.carousel.height + 'px' : 0; //END OF DOM ACCESS
    }
    /**
     *
     * @param {number} on 1 = add style 0 = remove style
     */

  }, {
    key: "updateStyle",
    set: function set(on) {
      if (on === void 0) {
        on = 0;
      }

      //add or remove transition duration to container
      if (on) {
        this.shadow.container.style.transitionDuration = this.virtual.duration + 'ms';
        this.shadow.container.style.transitionTimingFunction = this.virtual.transitionTiming;
      } else {
        this.shadow.container.style.transitionDuration = '0ms';
        this.shadow.container.style.transitionTimingFunction = 'linear';
      }
    }
  }]);

  return Aure;
}(HoloCli);

/** @format */

/**

     H.O.L.O -  essential functions

*/

/**
 * @param{object} _holo holo database object
 */

var _holo = {}; //main instance

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

var _snap = function _snap(parent, item) {
  return Math.round(parent / item) * item;
};

var _isClicked = function _isClicked(timeElapsed) {
  return timeElapsed < 250 ? 1 : 0; ///handle click, touch, double click or long-touch events
};
/**
 *
 * @param {number} distance
 * @param {number} timeElapsed
 */


var _swipe = function _swipe(distance, timeElapsed) {
  return distance / timeElapsed;
};


var _getItemWidthHeight = function _getItemWidthHeight(e) {
  if (!e) return 0;
  var outer = {};
  outer.width = e.offsetWidth;
  outer.height = e.offsetHeight;
  var style = window.getComputedStyle(e, null);
  outer.width += parseInt(style.marginLeft) + parseInt(style.marginRight);
  outer.height += parseInt(style.marginTop) + parseInt(style.marginBottom);
  return outer;
};


var activate = function activate(_ref) {
  var element = _ref[0],
      virtual = _ref[1];
  virtual.transformX = -Math.abs(element.offsetLeft);
  cyre.call('SNAP' + virtual.id, virtual);
  element.classList.add('active');
}; //previous slide operator


var prvSlide = function prvSlide(virtual) {
  if (virtual.endOfSlide === 1) return; //console.error('shake');

  virtual.transformX += virtual.carousel.width || 0;
  virtual.transformY += virtual.carousel.height || 0;
  return cyre.call('SNAP' + virtual.id, virtual);
}; //next slide operator


var nxtSlide = function nxtSlide(virtual) {
  if (virtual.endOfSlide === -1) return; //console.error('shake');

  virtual.transformX -= virtual.carousel.width || 0;
  virtual.transformY -= virtual.carousel.height || 0;
  return cyre.call('SNAP' + virtual.id, virtual);
}; //jump to first slide operator


var firstSlide = function firstSlide(virtual) {
  virtual.transformX = 0;
  virtual.transformY = 0;
  virtual.endOfSlide = 1;
  return cyre.call('SNAP' + virtual.id, virtual);
}; //jump to last slide operator


var lastSlide = function lastSlide(virtual) {
  virtual.transformX = virtual.endOfSlidePosition;
  virtual.transformY = virtual.endOfSlidePosition;
  virtual.endOfSlide = -1;
  return cyre.call('SNAP' + virtual.id, virtual);
}; //animate slides


var animateSlideForward = function animateSlideForward(virtual) {
  console.log('animating', virtual);

  if (virtual.endOfSlide === -1) {
    return cyre.call('firstSlide' + virtual.id, virtual);
  }

  return cyre.call('nxtSlide' + virtual.id, virtual);
};

var animateSlideBackward = function animateSlideBackward(virtual) {
  if (virtual.endOfSlide === 1) {
    return cyre.call('lastSlide' + virtual.id, virtual);
  }

  return cyre.call('prvSlide' + virtual.id, virtual);
}; //mouse 3rd button 'wheel' controller


var wheeler = function wheeler(e, id) {
  e.preventDefault();
  var virtual = _holo[id].getVirtual;

  if (e.deltaY < 0) {
    cyre.call('prvSlide' + virtual.id, virtual);
  } else if (e.deltaY > 0) {
    cyre.call('nxtSlide' + virtual.id, virtual);
  }
};

/** @format */
/**
 *
 * @param {object} virtual
 */

var _transformX = function _transformX(virtual) {
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

  return virtual;
};
var _transformXLite = function _transformXLite(virtual) {
  virtual.transformY = 0;

  if (virtual.transformX >= 0) {
    virtual.transformX = 0;
  } else if (virtual.transformX <= virtual.endOfSlidePosition) {
    virtual.transformX = virtual.endOfSlidePosition;
  }

  return virtual;
};
/**
 *
 * @param {object} virtual
 */

var _transformY = function _transformY(virtual) {
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

  return virtual;
};

/** @format */

var TouchClass =
/*#__PURE__*/
function () {
  /*
       H.O.L.O TOUCH EVENTS HANDLER
      */
  function TouchClass() {
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
  } //register if touch/click has occurred


  var _proto = TouchClass.prototype;

  _proto._touchStart = function _touchStart(e, id) {
    if (e === void 0) {
      e = window.event;
    }

    if (id === void 0) {
      id = 0;
    }

    if (!id || this.pressed) return console.error('Holo touch : not my business');
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
    return this.virtual.io.orientation ? (this._dragScrollVertical(e), e.preventDefault()) : (this._dragScrollHorizontal(e), e.preventDefault()), _holo[this.id].updateStyle = 0; //look into this
  }
  /*
         @dragScroll : handles horizontal drag touch moves
  */
  ;

  _proto._dragScrollHorizontal = function _dragScrollHorizontal(e) {
    if (!this.pressed) return {
      ok: false,
      data: 'not active'
    };
    this.distance = this.positionX - this.currentX;
    this.virtual.transformX = this.snapShotWidth - this.distance * this.multiplier || 0;
    _holo[this.id].setState = _transformXLite(this.virtual);
    requestAnimationFrame(this._dragScrollHorizontal.bind(this));
  } //@dragScroll : handles vertical drag touch moves
  ;

  _proto._dragScrollVertical = function _dragScrollVertical(e) {
    if (!this.pressed) return {
      ok: false,
      data: 'not active'
    };
    this.distance = this.positionY - this.currentY;
    this.virtual.transformY = this.snapShotHeight - this.distance * this.multiplier || 0;
    _holo[this.id].setState = _extends({}, _transformY(this.virtual));
    requestAnimationFrame(this._dragScrollVertical.bind(this));
  } //Register event/mouse position when touch/drag ends
  ;

  _proto._touchEnd = function _touchEnd(e) {
    if (!this.pressed) return {
      ok: false,
      data: 'not active'
    };
    var touchEndTimeStamp = performance.now();
    e.preventDefault();
    this.pressed = 0; //reset after drag event ended

    var timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp;

    var speed = _swipe(this.distance, timeElapsed);

    if (speed > 1.2) {
      cyre.call('nxtSlide' + this.id, this.virtual);
    } else if (speed < -1.2) {
      cyre.call('prvSlide' + this.id, this.virtual);
    } else if (_isClicked(timeElapsed)) {
      this.focus(e);
    } else {
      return cyre.call('SNAP' + this.id, this.virtual);
    }
  } //highlight active/ selected slide
  ;

  _proto.focus = function focus(e) {
    if (!e.target.closest('li.holo')) return false;
    this.targetHoloComponent ? this.targetHoloComponent.classList.remove('active') : false;
    this.targetHoloComponent = e.target.closest('li.holo');
    return cyre.call('activate' + this.id, [this.targetHoloComponent, this.virtual]);
  };

  return TouchClass;
}();

var Touch = new TouchClass();

/** @format */
/**
 *
 * @param {object} virtual  holo[id].virtual
 * @param {object} shadow  holo[id].shadow
 */

var ManageIO = function ManageIO(virtual, shadow) {
  if (!virtual) return console.error('@Holo : Major malfunctions');
  cyre.action([{
    id: 'Animate' + virtual.id,
    type: virtual.io.animateDirection > 0 ? 'AnimateForward' : 'AnimateBackward',
    payload: virtual,
    interval: virtual.io.duration,
    repeat: virtual.io.loop,
    log: true
  }, {
    id: 'SNAP' + virtual.id,
    type: 'SNAP',
    payload: virtual
  }, {
    id: 'prvSlide' + virtual.id,
    type: 'prvSlide',
    payload: virtual
  }, {
    id: 'nxtSlide' + virtual.id,
    type: 'nxtSlide',
    payload: virtual
  }, {
    id: 'lastSlide' + virtual.id,
    type: 'lastSlide',
    payload: virtual
  }, {
    id: 'firstSlide' + virtual.id,
    type: 'firstSlide',
    payload: virtual
  }, {
    id: 'activate' + virtual.id,
    type: 'activate',
    payload: virtual
  }]);

  if (virtual.io.enabled) {
    virtual.io.drag ? shadow.container.addEventListener('mousedown', function (e) {
      e.preventDefault();

      Touch._touchStart(e, virtual.id);
    }) : false;
    virtual.io.drag ? shadow.container.addEventListener('touchstart', function (e) {
      e.preventDefault();

      Touch._touchStart(e, virtual.id);
    }) : false;
    virtual.io.wheel ? shadow.carousel.addEventListener('wheel', function (e) {
      wheeler(e, virtual.id);
    }) : false;
    virtual.io.animate ? cyre.call('Animate' + virtual.id, virtual) : false;
    shadow.container.addEventListener( //when window resizes do something
    'resize', function () {
      cyre.call('refresh carousel', {
        virtual: virtual,
        shadow: shadow
      });
    }, false);
  }

  cyre.call('refresh carousel', {
    virtual: virtual,
    shadow: shadow
  });
};

/** @format */
/**
@param{object} slide single element of halo
@param{object} io holo input output parameters/options
*/

var holoCreateElement = function holoCreateElement(slide, io) {
  _holo[slide.id] = new Aure(slide, io); //register found carousels

  ManageIO(_holo[slide.id].getVirtual, _holo[slide.id].getShadow);
};

/** @format */

/**
 * @param{string} carouselName get all carousels by this class name
 */

var holoInitiate = function holoInitiate(carouselName) {
  console.log('@holo holo auto activated :', carouselName);
  var carousels = document.getElementsByClassName(carouselName);

  if (carousels.length) {
    for (var _iterator = carousels, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var slide = _ref;
      holoCreateElement(slide, {});
    }
  } else {
    return console.log('@Holo : carousel structure not found');
  }
};

/** @format */

var TouchManager = function TouchManager() {
  document.addEventListener('mousemove', function (e) {
    if (Touch.pressed) {
      Touch.currentX = e.clientX;
      Touch.currentY = e.clientY;
    }
  });
  document.addEventListener('mouseup', function (e) {
    e.preventDefault();
    Touch.pressed ? Touch._touchEnd(e) : false;
  });
  document.addEventListener('touchmove', function (e) {
    if (Touch.pressed) {
      Touch.currentX = e.touches[0].clientX;
      Touch.currentY = e.touches[0].clientY;
    }
  });
  document.addEventListener('touchend', function (e) {
    Touch.pressed ? Touch._touchEnd(e) : false;
  });
  cyre.on('AnimateForward', animateSlideForward);
  cyre.on('AnimateBackward', animateSlideBackward);
  cyre.on('nxtSlide', nxtSlide);
  cyre.on('prvSlide', prvSlide);
  cyre.on('firstSlide', firstSlide);
  cyre.on('lastSlide', lastSlide);
  cyre.on('bringToFocus', Touch.focus);
  cyre.on('wheeler', wheeler);
  cyre.on('activate', activate);
  return true;
};

/** @format */

var Holo = function () {
  cyre.on('refresh carousel', function (state) {
    var virtual = state.virtual,
        shadow = state.shadow;
    if (!virtual.id) return console.error('Holo carousel refresh error ', virtual.id);
    shadow.container.setAttribute('style', '');

    var _getItemWidthHeight2 = _getItemWidthHeight(shadow.container.children[0]),
        height = _getItemWidthHeight2.height,
        width = _getItemWidthHeight2.width;

    virtual.item.height = height;
    virtual.item.width = width;
    virtual.numberOfSlots = _numberOfSlots(shadow.carousel.parentNode.clientWidth, virtual.item.width, virtual.item.max) || 1;
    var calcCarouselWidth = virtual.numberOfSlots * virtual.item.width;
    var innerCarouselWidth = shadow.carousel.clientWidth;
    var calcWidth = shadow.container.children.length * virtual.item.width;
    var innerWidth = shadow.container.clientWidth || calcWidth;
    virtual.carousel.width = calcCarouselWidth || innerCarouselWidth;
    virtual.carousel.height = virtual.item.height || shadow.carousel.clientHeight;
    virtual.container.width = virtual.io.orientation ? shadow.carousel.width : innerWidth;
    virtual.container.height = shadow.container.clientHeight || virtual.item.height || 0;
    virtual.endOfSlidePosition = virtual.io.orientation ? -Math.abs(virtual.container.height - virtual.carousel.height) : -Math.abs(virtual.container.width - virtual.carousel.width);
    return _holo[virtual.id].setDimension = _extends({}, virtual), cyre.call('snap to position', virtual);
  }); //snap to grid
  //manages container

  cyre.on('SNAP', function (virtual) {
    if (!virtual.id) return console.error('Holo snap error');
    _holo[virtual.id].updateStyle = 1;
    virtual = virtual.io.orientation ? _transformY(virtual) : _transformX(virtual);
    return _holo[virtual.id].setState = _extends({}, virtual);
  });

  var _carousel = function _carousel(id, io) {
    if (io === void 0) {
      io = {};
    }

    //_holo[id]?
    var virtual = _holo[id].virtual;

    for (var attribute in io) {
      virtual.io[attribute] ? virtual.io[attribute] = io[attribute] : false;
    }

    return {
      ok: true,
      data: virtual.io
    };
  };
  /**
   *
   * @param {string} id
   */


  var getDimensions = function getDimensions(id) {
    return _holo[id].getDimensions;
  };
  /**
   *
   * @param {number} parent
   * @param {number} item
   * @param {number} max
   */


  var _numberOfSlots = function _numberOfSlots(parent, item, max) {
    var slots = Math.floor(parent / item);

    if (max) {
      if (slots > max) {
        return max || 1;
      }
    }

    return slots || 1;
  };
  /**
   *
   * @param {object} _e
   */


  var _addShake = function _addShake(_e) {
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


  var init = function init(au) {

    console.log('%c HOLO - Initiating holo v2.3.4 ', 'background: #022d5f; color: white; display: block;');
    TouchManager(); //init microService

    cyre.action([{
      id: 'refresh screen',
      interval: 250
    }, //adjust width
    {
      id: 'refresh carousel',
      interval: 250
    }, {
      id: 'snap to position',
      type: 'SNAP'
    }]);
    cyre.on('SHAKE', _addShake); //setup screen on initiation

    cyre.on('refresh screen', _refresh);
  }; //when dom loads do something


  document.addEventListener('DOMContentLoaded', function () {}, false);

  var _refresh = function _refresh() {
    for (var id in _holo) {
      console.log('@holo refreshing : ', id);
      cyre.call('refresh carousel', _holo[id].getState);
    }
  }; //when window resizes do something


  window.addEventListener('resize', function () {
    cyre.call('refresh screen');
  }, false); //when window loads do something

  window.onload = function () {// cyre.dispatch({id: 'app loaded', type: 'LOADED'})
  };

  return {
    TOUCH: Touch,
    INIT: init,
    BUILD: holoCreateElement,
    AUTO: holoInitiate,
    carousel: _carousel,
    refresh: _refresh,
    dimensions: getDimensions
  };
}();

export default Holo;

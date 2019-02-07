(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
typeof define === 'function' && define.amd ? define(factory) :
(global = global || self, global.Holo = factory());
}(this, function () { 'use strict';

/** @format */

//@ts-check
const middleware = {
  insert: (action, dataDefinitions) => {
    const data = {};
    action.id = action.id || null;
    action.type = action.type || null;
    for (const attribute in action) {
      data[attribute] = dataDefinitions[attribute]
        ? dataDefinitions[attribute](action[attribute])
        : {
            ok: false,
            data: null,
            message: `'${attribute}' data definition not found`,
            required: false
          };

      if (!data[attribute].ok && data[attribute].required) {
        console.log('middleware error');
        return {ok: false, data, message: data[attribute].message}
      }

      data[attribute].ok ? true : console.error(data[attribute].message);
      data[attribute] = data[attribute].data;
    }
    return {ok: true, data}
  },

  update: (action, dataDefinitions) => {
    const data = {};
    for (const attribute in action) {
      data[attribute] = dataDefinitions[attribute] ? dataDefinitions[attribute](action[attribute]) : false;
      data[attribute].ok ? true : console.error(data[attribute].message);
      data[attribute] = data[attribute].data;
    }
    return {ok: true, data}
  }
};

/** @format */

//@ts-check
const dataDefinitions = {
  id: (attribute = 0) => {
    if (typeof attribute !== 'string') {
      return {
        ok: false,
        data: null,
        message: `action.id must be a string. Received '${attribute}'`,
        required: true
      }
    }

    return {ok: true, data: attribute, required: true}
  },
  type: (attribute = '') => {
    return typeof attribute === 'string'
      ? {ok: true, data: attribute}
      : {
          ok: false,
          data: null,
          message: `action.type must be a string. Received '${attribute}'`,
          required: true
        }
  },

  payload: (attribute = null) => {
    return {ok: true, data: attribute}
  },

  interval: (attribute = 0) => {
    return Number.isInteger(attribute)
      ? {ok: true, data: attribute}
      : {
          ok: false,
          data: 0,
          message: `'${attribute}' invalid action.interval value`
        }
  },

  repeat: (attribute = 0) => {
    return Number.isInteger(attribute)
      ? {ok: true, data: attribute}
      : {
          ok: false,
          data: 0,
          message: `'${attribute}' invalid action.repeat value`
        }
  },

  group: (attribute = '') => {
    return typeof attribute === 'string'
      ? {ok: true, data: attribute}
      : {
          ok: false,
          data: null,
          message: `'${attribute}' invalid action.group value`
        }
  },

  callback: (attribute = '') => {
    return typeof attribute === 'string'
      ? {ok: true, data: attribute}
      : {
          ok: false,
          data: null,
          message: `'${attribute}' invalid action.callback value`
        }
  },

  log: (attribute = false) => {
    return typeof attribute === 'boolean'
      ? {ok: true, data: attribute}
      : {
          ok: false,
          data: false,
          message: `'${attribute}' invalid action.log value`
        }
  },

  middleware: (attribute = null) => {
    return typeof attribute === 'string'
      ? {ok: true, data: attribute}
      : {
          ok: false,
          data: null,
          message: `'${attribute}' invalid action.middleware value`
        }
  },

  at: (attribute = 0) => {
    // const at = new Date()
    return {
      ok: false,
      data: attribute,
      message: `'${attribute}'  action.at is an experimental feature, not applied yet`
    }
  }
};

/** @format */

/* 

    Neural Line
    Time based event manager
    C.Y.R.E
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
    EVENT HANDLER 2019 



    eg simple use
    cyre.dispatch{id: uber, type: call, payload: 004485648634}
    cyre.on('call', callTaxi)
    const callTaxi =(number)=>{
      console.log('calling taxi on ', number)  
    }

*/

class Cyre {
  constructor(id = '', interval = 0) {
    this.id = id;
    this.interval = interval || 16;
    this.events = {};
    this.timestamp = 0;
    this.timeline = new Set();
    this.waitingList = new Set();
    this.group = [];
    this.party = {};
    this.precision = 17;
    this.recuperating = 0;
    this.error = 0;
    console.log('%c Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0-- ', 'background: rgb(151, 2, 151); color: white; display: block;');
    this._quartz();
  }

  _log(msg, clg = false) {
    return clg ? '!log into something else ' : console.log(msg)
  }

  _wait(type = null) {
    for (let id of this.waitingList) {
      this.events[this.party[id].type] ? (this.waitingList.delete(id), this._initiate(id)) : console.log('@wait list nop');
    }
  }

  _emitAction(type = '', payload = {}, response = {}) {
    for (const fn of this.events[type]) {
      fn(payload, response); //add response
    }
    return {ok: true, done: true, data: `${type} action emitted`}
  }

  _recuperate(result = {}, value = 0) {
    result.data = result.ok
      ? result.data
          .sort((a, b) => {
            return b - a
          })
          .reverse()
      : [value];
    result.data = result.data[0] || result.data[1] || 0;
    return result
  }

  _quartz() {
    /*
      T.I.M.E. - K.E.E.P.E.R.
    */
    const now = performance.now();
    const time = now - this.timestamp;
    //Timed zone
    if (time >= this.interval) {
      this.timestamp = performance.now();
      const result = this.timeline.size ? this._processingUnit(this.timeline, this.interval) : {ok: false, data: []};
      this.interval = this._recuperate(result, this.interval).data;
    }
    this.recuperating = requestAnimationFrame(this._quartz.bind(this));
  }

  _processingUnit(timeline, precision) {
    return new Promise(success => {
      let info = {ok: true, data: [], id: []};
      for (const id of timeline) {
        //deduct precision from action.timeout
        this.party[id].timeout -= precision;
        info.data.push(this.party[id].timeout);
        info.id.push(id);
        this.party[id].timeout <= precision ? this._sendAction(id) : false;
        success(info);
      }
    })
  }

  _addToTimeline(id) {
    return {ok: true, done: false, data: this.timeline.add(id)}
  }

  _addToWaitingList(id) {
    this.waitingList.add(id);
    const response = {ok: true, done: false, id, data: this.party[id].payload, group: this.party[id].group || 0, message: 'added to action waiting list'};
    this.party[id].log ? this._log(response) : 0;
    return {
      ok: false,
      done: false,
      data: `${id} added to waiting list`
    }
  }

  _completeAction(id) {
    this.timeline.delete(id);
    return true
  }

  _repeatAction(id) {
    this.party[id].timeout = this.party[id].interval;
    --this.party[id].repeat;
    return false
  }

  _sendAction(id) {
    const done = this.party[id].repeat > 0 ? this._repeatAction(id) : this._completeAction(id);
    const response = {ok: true, done, id, data: this.party[id].payload, group: this.party[id].group || 0};
    this.party[id].log ? this._log(response) : 0;
    return this._emitAction(this.party[id].type, this.party[id].payload, response)
  }

  _initiate(id) {
    return this.party[id].timeout === 0 ? this._sendAction(id) : this._addToTimeline(id)
  }

  _dispatchAction(id, type) {
    return this.events[type] ? this._initiate(id) : this._addToWaitingList(id)
  }

  _createChannel(action, dataDefinitions$$1) {
    const condition = this.party[action.id] ? 'update' : 'insert';
    const result = middleware[condition](action, dataDefinitions$$1);
    if (!result.ok) {
      console.error(`@Cyre : Action could not be created for '${action.id}' ${result.message}`);
      return {ok: false, data: null, message: result.message}
    }

    this.party[action.id] = result.data;
    this.party[action.id].timeout = this.party[action.id].interval || 0;
    return {ok: true, data: true}
  }

  //system user interface
  off(fn) {
    //remove unwanted listener
    for (let type in this.events) {
      return this.events[type].has(fn) ? {ok: true, data: this.events[type].delete(fn)} : {ok: false, data: 'Function type not found'}
    }
  }

  list() {
    //list all registered functions action.type
    for (let type in this.events) {
      for (let fn of this.events[type]) {
        this._log(fn.name);
      }
    }
  }

  clr() {
    //clear all iterating actions
    return this.timeline.clear()
  }

  pause(id) {
    // pause _quartz
    //need some work
    return this.timeline.has(id) ? this.timeline.delete(id) : false
  }

  // User interfaces
  on(type, fn, group = []) {
    return new Promise((success, reject) => {
      typeof fn === 'function'
        ? success({
            ok: true,
            data: this.events[type] ? this.events[type].add([fn]) : ((this.events[type] = new Set([fn])), this._wait(type))
          })
        : reject({ok: false, data: 'invalid function', message: console.log(type, fn)});
    })
  }

  type(id, type) {
    console.log(`cyre.type method not implemented yet in this version, would've update channel.id's type without dispatching the action`);
  }

  channel(attribute = {}) {
    if (this.party[attribute.id]) return console.error('@cyre.action: action already exist', attribute.id)
    return this._createChannel(attribute, dataDefinitions)
  }

  action(attribute = {}) {
    if (this.party[attribute.id]) return console.error('@cyre.action: action already exist', attribute.id)
    return this._createChannel(attribute, dataDefinitions)
  }

  emit(id = null, payload = null) {
    return this.party[id]
      ? ((this.party[id].payload = payload), this._dispatchAction(id, this.party[id].type))
      : console.error('@cyre.call : channel not found', id)
  }

  call(id = null, payload = null) {
    this.emit(id, payload);
  }

  //dispatch accepts object type input eg {id: uber, type: call, payload: 0025100124}
  dispatch(attribute = {}) {
    attribute.id = attribute.id ? attribute.id : null;
    attribute.type ? 0 : console.error('@cyre.dispatch : action type required for - ', attribute.id);
    return this._createChannel(attribute, dataDefinitions).ok
      ? {ok: true, data: this._dispatchAction(attribute.id, attribute.type)}
      : {ok: false, data: attribute.id, message: console.log(`@Cyre couldn't dispatch action`)}
  }

  //respond accepts array of input eg { uber,  call, 0025100124}
  respond(id = null, type = null, payload = null, interval = 0, repeat = 0) {
    const data = {id, type, payload, interval, repeat};
    this._createChannel(data, dataDefinitions);
    this._dispatchAction(data.id, data.type);
    return {ok: true, data: data.id}
  }
}

const cyre = new Cyre('quantum-inceptions');

/** @format */
//@ts-check
/**

     H.O.L.O -  essential functions

*/
const _holo = {}; //main instance
const _transform = (id, x = 0, y = 0, z = 0) => {
  _holo[id]._state.elm.container.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
};

const _snap = (parent, item) => {
  return Math.round(parent / item) * item
};

const _isClicked = timeElapsed => {
  return timeElapsed < 250 ? 1 : 0 ///handle click, touch, double click or long-touch events
};

const _swipe = (distance, timeElapsed) => {
  return distance / timeElapsed
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
    this.touch = {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup',
      enter: 'mouseenter',
    };
    this.targetHoloComponent = 0;
  }

  //register if touch/click has occured
  _touchStart(e = window.event, id = 0) {
    if (!id || this.pressed) {
      return console.error('Holo touch : not my business')
    }
    this.TouchStartTimeStamp = performance.now(); //snap timer on touch start
    e.preventDefault(); //reset default
    this._e = _holo[id].getState;
    this.pressed = 1;
    // this.targetHoloComponent = e.target
    this.positionX = e.clientX || e.touches[0].clientX;
    this.positionY = e.clientY || e.touches[0].clientY;
    this.id = this._e.id;
    this.currentX = e.clientX || e.touches[0].clientX;
    this.currentY = e.clientY || e.touches[0].clientY;
    this.snapWidth = this._e.transformX || 0;
    this.snapHeight = this._e.transformY || 0;
    return this._e.io.orientation === true ? this._dragScrollVertical(e) : this._dragScroll(e), _holo[this._e.id]._style(0) //look into this
  }
  /*
         @dragScroll : handles drag touch moves
    */
  _dragScroll(e) {
    if (!this.pressed) return {ok: false, data: 'not active'}
    this.distance = this.positionX - this.currentX;
    this._e.transformX = this.snapWidth - this.distance * 1.482 || 0;
    if (this._e.transformX >= 100) {
      this._e.transformX = 100;
      this._e.sliderEnd = 1; //Left EnD of the carousel
    } else if (this._e.transformX + 100 <= this._e.endNumber) {
      this._e.transformX = this._e.endNumber - 100;
      this._e.sliderEnd = -1; //Right end of the carousel
    } else {
      this._e.sliderEnd = 0; //in the middle carousel
    }
    _transform(this.id, this._e.transformX, 0, 0);
    requestAnimationFrame(this._dragScroll.bind(this));
  }

  //@dragScroll : handles vertical drag touch moves
  _dragScrollVertical(e) {
    if (!this.pressed) return 0
    this.distance = this.positionY - this.currentY;
    this._e.transformY = this.snapHeight - this.distance * 1.482 || 0;
    _transform(this._e.id, 0, this._e.transformY, 0);
    requestAnimationFrame(this._dragScrollVertical.bind(this));
  }

  //Register event/mouse position when touch/drag ends
  _touchEnd(e) {
    const touchEndTimeStamp = performance.now();
    e.preventDefault();
    e.stopPropagation();
    if (!this.pressed) {
      return 0
    }
    this.pressed = 0; //reset after drag event ended
    const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp;
    const speed = _swipe(this.distance, timeElapsed);

    if (speed > 1.2) {
      cyre.emit('nxtSlide' + this._e.id, this._e);
    } else if (speed < -1.2) {
      cyre.emit('prvSlide' + this._e.id, this._e);
    } else if (_isClicked(timeElapsed)) {
      this.focus(this.targetHoloComponent, e);
    } else {
      //if it is a single click
      cyre.emit('SNAP' + this._e.id, this._e);
    }
    return
  }

  //highlight active/ slected slide
  focus(element, e) {
    //bring selected element to view
    //const target = this.targetHoloComponent.closest('li.holo')
    if (!e.target.closest('li.holo')) return false

    this.targetHoloComponent ? this.targetHoloComponent.classList.remove('active') : false;
    this.targetHoloComponent = e.target.closest('li.holo');

    try {
      PROTVJS.PLAY_THIS(this.targetHoloComponent.id);
      console.log('@playthis found : ', this.targetHoloComponent.id);
    } catch (f) {
      //console.log('@playthis not found : ', this.targetHoloComponent.id);
    }
    // PROTVJS ? PROTVJS.PLAY_THIS(this.targetHoloComponent.id) : 0;
    return cyre.emit('activate' + this._e.id, [this.targetHoloComponent, this._e])
    //_e.Xtransform = element.offsetLeft + _e.carousel.width;
  }

  //manage actice/highlited slides
  activate([element, au]) {
    au.transformX = -Math.abs(element.offsetLeft);
    cyre.emit('SNAP' + au.id, au);
    element.classList.add('active');
  }

  //previous slide operator
  prvSlide(_e) {
    if (_e.sliderEnd === 1) return //console.error('shake');
    _e.transformX += _e.carousel.width || 0;
    _e.transformY += _e.carousel.height || 0;
    return cyre.emit('SNAP' + _e.id, _e)
  }

  //next slide operator
  nxtSlide(_e) {
    if (_e.sliderEnd === -1) return //console.error('shake');
    _e.transformX -= _e.carousel.width || 0;
    _e.transformY -= _e.carousel.height || 0;
    return cyre.emit('SNAP' + _e.id, _e)
  }

  //jump to first slide operator
  firstSlide(_e) {
    _e.transformX = 0;
    _e.transformY = 0;
    _e.sliderEnd = 1;
    return cyre.emit('SNAP' + _e.id, _e)
  }

  //jump to last slide operator
  lastSlide(_e) {
    _e.transformX = _e.endNumber;
    _e.transformY = _e.endNumber;
    _e.sliderEnd = -1;
    return cyre.emit('SNAP' + _e.id, _e)
  }

  //animate slides
  animateSlideForward(_e) {
    if (_e.sliderEnd === -1) {
      return cyre.emit('firstSlide' + _e.id, _e)
    }
    return cyre.emit('nxtSlide' + _e.id, _e)
  }

  animateSlideBackward(_e) {
    if (_e.sliderEnd === 1) {
      return cyre.emit('lastSlide' + _e.id, _e)
    }
    return cyre.emit('prvSlide' + _e.id, _e)
  }

  //mouse 3rd button 'wheel' controller
  wheeler(e, id) {
    e.preventDefault();
    const au = _holo[id].getState;
    if (e.deltaY < 0) {
      cyre.emit('prvSlide' + au.id, au);
    } else if (e.deltaY > 0) {
      cyre.emit('nxtSlide' + au.id, au);
    }
  }
}
const Touch = new TouchClass();

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

class Aure extends HoloCli {
  /*

     H.O.L.O - A.U.R.E`
     aka holo-create-carousel

     */
  constructor(slide, io = {}) {
    super();
    if (!slide) {
      return console.error("@Holo: Oh putain` problame with the given slider ");
    }
    if (!slide.id) {
      console.error("@Holo: oh putain` carousel has no ID ");
      side.id = "OhPutain" + performance.now();
    }
    // console.log('@Aure`  Initializing slider       ---2.0.1');
    this._state.elm.carousel = slide;
    this.id = slide.id;
    this._setup();
  }

  /*   _createHolo(e) {
    const holo = `<div class="holo-place-holder box" id='holo_PlaceHolder${e}'>
                         <div class="holo-loader"></div>
                          </div>`;
    return holo;
  } */

  _setup() {
    this._state.elm.container =
      this._state.elm.carousel.getElementsByClassName("holo-container")[0] || 0;
    //this.nxt = this._state.elm.carousel.getElementsByClassName('nxtbutton')[0] || 0;
    //this.prv = this._state.elm.carousel.getElementsByClassName('prvbutton')[0] || 0;
    return this._state.elm.container
      ? this._define()
      : console.error("@Holo : holo-container empty");
  }

  _define() {
    this._state.carousel.width = this._state.elm.carousel.clientWidth || 0;
    if (!this._state.elm.container.children.length) {
      return console.error("@Holo: no holo element found");
    }
    this._state.id = this.id;
    this._state.childLength = this._state.elm.container.children.length;
    this._state.startNumber = 0;
    this._state.endNumber = 0;
    this._state.item.min = 1;
    this._state.item.max = this._state.elm.carousel.dataset.max || 0;
    this._state.io.wheel = !!this._state.elm.carousel.dataset.wheel;
    this._state.io.orientation = !!this._state.elm.carousel.dataset.orientation;
    this._state.io.snap = 0;
    this._state.io.animate =
      Number(this._state.elm.carousel.dataset.animate) || 0;
    this._state.io.duration =
      Number(this._state.elm.carousel.dataset.duration) || 0;
    this._state.io.loop = Number(this._state.elm.carousel.dataset.loop) || 0;
    this._state.io.focus = this._state.elm.carousel.dataset.focus || 0;
  }

  get getState() {
    //provide  _state object upon request
    return this._state;
  }
  get getAure() {
    return {
      car: {
        w: this._state.carousel.width,
        h: this._state.carousel.height
      },
      con: {
        w: this._state.container.width,
        h: this._state.container.height,
        x: this._state.transformX,
        y: this._state.transformY,
        s: {}
      }
    };
  }

  setState(state) {
    //update _state object
    //DOM ACCESS
    this._state = state;
    this._state.io.orientation
      ? 0
      : (this._state.elm.carousel.style.width = state.carousel.width + "px");
    this._state.io.orientation
      ? (this._state.elm.carousel.style.height = state.carousel.height + "px")
      : 0;
    //END OF DOM ACCESS
  }

  _style(on = 0) {
    //add or remove transition duration to container
    if (on) {
      this._state.elm.container.style.transitionDuration =
        this._state.duration + "ms";
      this._state.elm.container.style.transitionTimingFunction =
        "cubic-bezier(0.215, 0.61, 0.355, 1)";
    } else {
      this._state.elm.container.style.transitionDuration = "0ms";
      this._state.elm.container.style.transitionTimingFunction = "linear";
    }
  }
}

/** @format */

const holoCreateCarousel = (holoState, io = {}) => {
  if (!holoState) return console.error('@Holo : Major malfunctions')

  if (holoState.io.enabled) {
    holoState.elm.container.addEventListener('mousedown', e => {
      e.preventDefault();
      Touch._touchStart(e, holoState.id);
    });

    holoState.elm.container.addEventListener('touchstart', e => {
      e.preventDefault();
      Touch._touchStart(e, holoState.id);
    });

    holoState.io.wheel
      ? holoState.elm.carousel.addEventListener(
          'wheel',
          e => {
            Touch.wheeler(e, holoState.id);
          },
          false,
        )
      : 0;

    holoState.io.animate
      ? cyre.respond(
          'Animate' + holoState.id,
          holoState.io.animate > 0 ? 'AnimateForward' : 'AnimateBackward',
          holoState,
          holoState.io.duration,
          holoState.io.loop,
        )
      : 0;
  }

  cyre.action({
    id: 'SNAP' + holoState.id,
    type: 'SNAP',
    payload: holoState,
  });

  cyre.action({
    id: 'prvSlide' + holoState.id,
    type: 'prvSlide',
    payload: holoState,
  });

  cyre.action({
    id: 'nxtSlide' + holoState.id,
    type: 'nxtSlide',
    payload: holoState,
  });

  cyre.action({
    id: 'lastSlide' + holoState.id,
    type: 'lastSlide',
    payload: holoState,
  });

  cyre.action({
    id: 'firstSlide' + holoState.id,
    type: 'firstSlide',
    payload: holoState,
  });

  cyre.action({
    id: 'activate' + holoState.id,
    type: 'activate',
    payload: holoState,
  });
};

/** @format */

const holoCreateElement = (slide, io = {}) => {
  console.log('holo carousel @init : found ---  ', slide.id);
  _holo[slide.id] = new Aure(slide, io); //register found carousels
  const holoState = _holo[slide.id].getState;
  console.log('holo state : ', holoState);
  holoCreateCarousel(holoState, io);
};

/** @format */

//holo Locate all holo carousel structures ByClassName
const holoInitiate = carouselClassName => {
  const carousels = document.getElementsByClassName(carouselClassName); //get all carousels by this class name
  if (carousels.length) {
    for (let slide of carousels) {
      //for each carousel found
      holoCreateElement(slide);
    }
  } else {
    return console.log('@Holo : Holo carousel structure not found')
  }
};

const _transformX = (_e) => {
    _e.transformX = _e.io.snap && _snap(_e.transformX, _e.item.width) || _e.transformX;
    _e.transformY = 0;
    if (_e.transformX >= 0) {
        _e.transformX = 0;
        _e.sliderEnd = 1; //Left EnD of the carousel
    } else if (_e.transformX <= _e.endNumber) {
        _e.transformX = _e.endNumber;
        _e.sliderEnd = -1; //Right end of the carousel
    } else {
        _e.sliderEnd = 0; //in the middle carousel
    }
    return _e
};

const _transformY = (_e) => {
    _e.transformY = _e.io.snap && _snap(_e.transformY, _e.item.height) || _e.transformY;
    _e.transformX = 0;
    if (_e.transformY >= 0) {
        _e.transformY = 0;
        _e.sliderEnd = 1; //Left EnD of the carousel
    } else if (_e.transformY <= _e.endNumber) {
        _e.transformY = _e.endNumber;
        _e.sliderEnd = -1; //Right end of the carousel
    } else {
        _e.sliderEnd = 0; //in the middle carousel
    }
    return _e
};

/** @format */

const TouchManager = au => {
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

  cyre.on('AnimateForward', Touch.animateSlideForward);
  cyre.on('AnimateBackward', Touch.animateSlideBackward);
  cyre.on('nxtSlide', Touch.nxtSlide);
  cyre.on('prvSlide', Touch.prvSlide);
  cyre.on('firstSlide', Touch.firstSlide);
  cyre.on('lastSlide', Touch.lastSlide);
  cyre.on('bringToFocus', Touch.focus);
  cyre.on('wheeler', Touch.wheeler);
  cyre.on('activate', Touch.activate);
};

/** @format */

const Holo = (() => {
  //events - Javascript publish subscribe pattern

  const _width = _e => {
    //manages carousel(not pure)
    if (!_e.id) {
      return console.error('Holo width error')
    }
    _e.elm.container.setAttribute('style', '');
    const {height, width} = _getItemWidthHeight(_e.elm.container.children[0]);
    _e.item.height = height;
    _e.item.width = width;
    _e.numberOfSlots = _numberOfSlots(_e.elm.carousel.parentNode.clientWidth, _e.item.width, _e.item.max) || 1;
    const calcCarouselWidth = _e.numberOfSlots * _e.item.width;
    const innerCarouselWidth = _e.elm.carousel.clientWidth;
    const calcWidth = _e.elm.container.children.length * _e.item.width;
    const innerWidth = _e.elm.container.clientWidth || calcWidth;

    _e.carousel.width = calcCarouselWidth || innerCarouselWidth;
    _e.carousel.height = _e.item.height || _e.elm.carousel.clientHeight;

    _e.container.width = _e.io.orientation ? _e.carousel.width : innerWidth;
    _e.container.height = _e.elm.container.clientHeight || _e.item.height || 0;
    _e.endNumber = _e.io.orientation ? -Math.abs(_e.container.height - _e.carousel.height) : -Math.abs(_e.container.width - _e.carousel.width);

    return _holo[_e.id].setState(_e), _snapWidth(_e)
  };
  //snap to grid
  const _snapWidth = au => {
    //manages container
    _holo[au.id]._style(1);
    if (!au.id) {
      return console.error('Holo snap error')
    }
    au = au.io.orientation ? _transformY(au) : _transformX(au);
    _holo[au.id].setState(au);
    return _transform(au.id, au.transformX, au.transformY)
  };

  const _carousel = (id, io = {}) => {
    //manages container
    console.log('Holo.id : ', _holo[id]._state.io);
    console.log('io.id : ', io);

    for (const attribute in io) {
      console.log(attribute);
      _holo[id]._state.io[attribute] ? (_holo[id]._state.io[attribute] = io[attribute]) : console.error('Unknown Holo carousel parameter', attribute);
    }
    return _holo[id]._state.io
  };

  const _numberOfSlots = (parent, item, max) => {
    let slots = Math.floor(parent / item);
    if (max) {
      if (slots > max) {
        slots = max;
      }
    }
    return slots || 1
  };

  const _addShake = _e => {
    _e.elm.container.classList.add('shake-off');
    let shake = setTimeout(() => {
      shake = 0;
      _e.elm.container.classList.remove('shake-off');
      return 0
    }, 1000);
  };

  //pure function
  const _getItemWidthHeight = e => {
    if (!e) {
      return 0
    }
    let outer = {};
    outer.width = e.offsetWidth;
    outer.height = e.offsetHeight;
    const style = window.getComputedStyle(e, null);
    outer.width += parseInt(style.marginLeft) + parseInt(style.marginRight);
    outer.height += parseInt(style.marginTop) + parseInt(style.marginBottom);
    return outer
  };

  const getAure = id => {
    return _holo[id].getAure
  };

  const init = (au = 'holo-carousel') => {
    console.log('%c HOLO - Initiating holo v2.2 ', 'background: #022d5f; color: white; display: block;');
    TouchManager(au);
    //listen for events
    cyre.action({id: 'when screen resize', type: 'SCREEN', interval: 250}); //adjust width
    cyre.emit('when screen resize');
    cyre.on('SNAP', _snapWidth);
    cyre.on('WIDTH', _width);
    cyre.on('SHAKE', _addShake);
    cyre.on('SCREEN', _aure_manager);
  };

  document.addEventListener('DOMContentLoaded', () => {}, false); //when dom loads do something

  const _aure_manager = () => {
    for (let id in _holo) {
      cyre.dispatch({id: 'width' + id, type: 'WIDTH', payload: _holo[id].getState, interval: 250});
    }
  };

  window.addEventListener(
    //when window resizes do something
    'resize',
    () => {
      cyre.emit('when screen resize');
    },
    false,
  );

  window.onload = () => {
    cyre.dispatch({id: 'app loaded', type: 'LOADED'});
  };

  return {
    TOUCH: Touch,
    INIT: init,
    HOLO: getAure,
    BUILD: holoCreateElement,
    AUTO: holoInitiate,
    carousel: _carousel,
  }
})();

return Holo;

}));

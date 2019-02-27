(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
typeof define === 'function' && define.amd ? define(factory) :
(global = global || self, global.Holo = factory());
}(this, function () { 'use strict';

/** @format */

//@ts-check
const middleware = {
  /**
   *@param{object} action cyre.action
   *@param{object} dataDefinitions action attributes
  
  */
  insert: (action, dataDefinitions) => {
    const data = {};
    action.id = action.id || null;
    action.type = action.type || action.id;
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
        return {ok: false, data, message: data[attribute].message}
      }

      data[attribute].ok ? true : console.error(data[attribute].message);
      data[attribute] = data[attribute].data;
    }
    return {ok: true, data}
  },

  /**
   *@param{object} action cyre.action
   *@param{object} dataDefinitions action attributes
  
  */

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
  }

  _log(msg, clg = false) {
    return clg ? '!log into something else ' : console.log(msg)
  }

  /**
   *@param{string} type action.type
  
  */

  _taskWaitingList(type) {
    for (let id of this.waitingList) {
      this.events[this.party[id].type] ? (this.waitingList.delete(id), this._initiate(id)) : console.log('@cyre: type is not in waiting list');
    }
  }

  /**
   *@param{string} type action.type
   *@param{any} payload action.payload
   */
  _emitAction(type = '', payload = {}, response = {}) {
    for (const fn of this.events[type]) {
      fn(payload, response); //add response
    }
    return {ok: true, done: true, data: `${type} action emitted`}
  }

  /**
   *@param{object} result
   *@param{number} value
   */
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
  //@TODO this.recuperating should pause quartz when its not in use
  _quartz() {
    /*
      T.I.M.E. - K.E.E.P.E.R.
    */
    const now = performance.now();
    const time = now - this.timestamp;
    this.recuperating = 1;

    //Timed zone
    if (time >= this.interval) {
      this.timestamp = performance.now();
      const result = this.timeline.size ? this._processingUnit(this.timeline, this.interval) : {ok: false, data: []};
      this.interval = this._recuperate(result, this.interval).data;
    }
    if (this.timeline.size) {
      window.requestAnimationFrame(this._quartz.bind(this));
    } else {
      window.cancelAnimationFrame(this._quartz.bind(this));
      this.recuperating = 0;
    }
  }
  /**
   * @param {object} timeline list of actions in this.timeline
   * @param {number} precision adjustment to time interval
   */
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

  /**
   * @param {string} id action id
   */
  _addToTimeline(id) {
    this.timeline.add(id);
    this.recuperating ? true : this._quartz();
    return {ok: true, done: false, data: ''}
  }

  /**
   * @param {string} id action id
   */
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

  /**
   * @param {string} id action id
   */
  _completeAction(id) {
    this.timeline.delete(id);
    return true
  }

  /**
   * @param {string} id action id
   */
  _repeatAction(id) {
    this.party[id].timeout = this.party[id].interval;
    --this.party[id].repeat;
    return false
  }

  /**
   * @param {string} id action id
   */
  _sendAction(id) {
    const done = this.party[id].repeat > 0 ? this._repeatAction(id) : this._completeAction(id);
    const response = {ok: true, done, id, data: this.party[id].payload, group: this.party[id].group || 0};
    this.party[id].log ? this._log(response) : 0;
    return this._emitAction(this.party[id].type, this.party[id].payload, response)
  }

  /**
   * @param {string} id action id
   */
  _initiate(id) {
    return this.party[id].timeout === 0 ? this._sendAction(id) : this._addToTimeline(id)
  }

  /**
   * @param {string} id action id
   * @param {string} type action type
   */
  _dispatchAction(id, type) {
    return this.events[type] ? this._initiate(id) : this._addToWaitingList(id)
  }

  /**
   * @param {object} action action cyre.action
   * @param {object} dataDefinitions$$1 data definitions for available action attributes
   */
  _createChannel(action, dataDefinitions$$1) {
    const condition = this.party[action.id] ? 'update' : 'insert';
    const result = middleware[condition](action, dataDefinitions$$1);
    if (!result.ok) {
      //console.error(`@Cyre : Action could not be created for '${action.id}' ${result.message}`)
      return {ok: false, data: condition, message: result.message}
    }

    this.party[action.id] = result.data;
    this.party[action.id].timeout = this.party[action.id].interval || 0;
    return {ok: true, data: condition}
  }

  /**
   * @param {function} fn unregister function from cyre.on
   */
  //system user interface
  off(fn) {
    //remove unwanted listener
    for (let type in this.events) {
      return this.events[type].has(fn) ? {ok: true, data: this.events[type].delete(fn)} : {ok: false, data: 'function not found'}
    }
  }

  //@TODO: list all registered functions action.type
  list() {
    for (let type in this.events) {
      for (let fn of this.events[type]) {
        this._log(type + ' ' + fn.name);
      }
    }
  }

  clr() {
    //clear all iterating actions
    return this.timeline.clear()
  }

  //@TODO: this meant to pause all iterable actions
  pause(id) {
    // pause _quartz
    //need some work
    return this.timeline.has(id) ? this.timeline.delete(id) : false
  }

  // User interfaces
  /**
   * @param {string} type action.type
   * @param {function} fn action type function
   * @param {array} group list of groups its part of
   */
  on(type, fn, group = []) {
    return typeof fn === 'function' && type !== ''
      ? {ok: true, data: this.events[type] ? this.events[type].add([fn]) : ((this.events[type] = new Set([fn])), this._taskWaitingList(type))}
      : {ok: false, data: type, message: 'invalid function'}
  }

  /**
   * @param {string} id action id
   * @param {string} type action type
   */
  type(id, type) {
    console.log(`cyre.type method not implemented yet in this version, would've update channel.id's type without dispatching the action`);
  }

  /**
   * @param {object} attribute list of action attributes. {id, type, payload, interval, repeat, log}
   */
  channel(attribute = {}) {
    if (this.party[attribute.id]) {
      console.error('@cyre.action: action already exist', attribute.id);
      return {ok: false, data: attribute.id, message: 'action already exist'}
    }
    return this._createChannel(attribute, dataDefinitions)
  }

  /**
   * @param {object} attribute list of action attributes. {id, type, payload, interval, repeat, log}
   */
  action(attribute = {}) {
    if (this.party[attribute.id]) {
      console.error('@cyre.action: action already exist', attribute.id);
      return {ok: false, data: attribute.id, message: 'action already exist'}
    }
    return this._createChannel(attribute, dataDefinitions)
  }

  /**
   * @param {string} id action.id
   * @param {any} payload action.payload.
   */
  call(id = '', payload = null) {
    return this.party[id]
      ? (payload && (this.party[id].payload = payload), this._dispatchAction(id, this.party[id].type))
      : {ok: false, data: console.error('@cyre.call : action not found', id)}
  }

  /**
   * @param {string} id action.id
   * @param {any} payload action.payload.
   */

  emit(id, payload) {
    return this.call(id, payload)
  }

  /**
   * @param {object} attribute list of action attributes. {id, type, payload, interval, repeat, log}
   */
  //dispatch accepts object type input eg {id: uber, type: call, payload: 0025100124}
  dispatch(attribute = {}) {
    attribute.id = attribute.id ? attribute.id : '';
    attribute.type ? 0 : console.error('@cyre.dispatch : action type required for - ', attribute.id);
    return this._createChannel(attribute, dataDefinitions).ok
      ? {ok: true, data: this._dispatchAction(attribute.id, attribute.type)}
      : {ok: false, data: attribute.id, message: console.log(`@Cyre couldn't dispatch action`)}
  }

  test() {
    return {ok: true, data: 200, message: 'Cyre: Hi there, what can I help you with'}
  }
}
const cyre = new Cyre('quantum-inceptions');

/**
 *  default entries
 *
 * @format
 */

class HoloCli {
  /*

     H.O.L.O -  C.L.I

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
      transformX: 0,
      transformY: 0,
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
      wheel: 1,
      controller: 0,
      drag: 1,
      swipe: 1,
      snap: 1,
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
    if (!slide) {
      return console.error('@Holo: Oh putain` problame with the given slider ')
    }
    if (!slide.id) {
      console.error('@Holo: oh putain` carousel has no ID ');
      id = 'OhPutain' + performance.now();
      this.id = id;
      side.id = this.id;
    }
    // console.log('@Aure`  Initializing slider       ---2.0.1');
    this.shadow.carousel = slide;
    this.id = slide.id;
    this.shadow.container = this.shadow.carousel.getElementsByClassName('holo-container')[0] || 0;
    this.shadow.container ? this.initializeHolo() : console.error('@Holo : holo-container is empty : ', this.id);
  }

  initializeHolo() {
    this.shadow.carousel.width = this.shadow.carousel.clientWidth || 0; //initializeHolo
    if (!this.shadow.container.children.length) {
      return console.error('@Holo: no holo element found  : ', this.id)
    }
    this.virtual.id = this.id;
    this.virtual.childLength = this.shadow.container.children.length;
    this.virtual.carousel.width = this.shadow.container.clientWidth;
    this.virtual.carousel.height = this.shadow.container.clientHeight;
    this.virtual.startNumber = 0;
    this.virtual.endNumber = 0;
    this.virtual.item.min = 1;
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
    this.virtual = {...state};
    this.virtual.io.orientation ? 0 : (this.shadow.carousel.style.width = state.carousel.width + 'px');
    this.virtual.io.orientation ? (this.shadow.carousel.style.height = state.carousel.height + 'px') : 0;
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
      this.shadow.container.style.transitionTimingFunction = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
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
const _transform = (id, x = 0, y = 0, z = 0) => {
  _holo[id].shadow.container.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
};

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
      enter: 'mouseenter'
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
    this.virtual = _holo[id].getVirtual;
    this.pressed = 1;
    // this.targetHoloComponent = e.target
    this.positionX = e.clientX || e.touches[0].clientX;
    this.positionY = e.clientY || e.touches[0].clientY;
    this.id = this.virtual.id;
    this.currentX = e.clientX || e.touches[0].clientX;
    this.currentY = e.clientY || e.touches[0].clientY;
    this.snapWidth = this.virtual.transformX || 0;
    this.snapHeight = this.virtual.transformY || 0;
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
    this.distance = this.positionX - this.currentX;
    this.virtual.transformX = this.snapWidth - this.distance * 1.482 || 0;
    if (this.virtual.transformX >= 100) {
      this.virtual.transformX = 100;
      this.virtual.endOfSlide = 1; //Left EnD of the carousel
    } else if (this.virtual.transformX + 100 <= this.virtual.endNumber) {
      this.virtual.transformX = this.virtual.endNumber - 100;
      this.virtual.endOfSlide = -1; //Right end of the carousel
    } else {
      this.virtual.endOfSlide = 0; //in the middle carousel
    }
    _transform(this.id, this.virtual.transformX, 0, 0);
    requestAnimationFrame(this._dragScroll.bind(this));
  }

  //@dragScroll : handles vertical drag touch moves
  _dragScrollVertical(e) {
    if (!this.pressed) return 0
    this.distance = this.positionY - this.currentY;
    this.virtual.transformY = this.snapHeight - this.distance * 1.482 || 0;
    _transform(this.virtual.id, 0, this.virtual.transformY, 0);
    requestAnimationFrame(this._dragScrollVertical.bind(this));
  }

  //Register event/mouse position when touch/drag ends
  _touchEnd(e) {
    const touchEndTimeStamp = performance.now();
    e.preventDefault();
    if (!this.pressed) return 0
    this.pressed = 0; //reset after drag event ended
    const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp;
    const speed = _swipe(this.distance, timeElapsed);

    if (speed > 1.2) {
      cyre.emit('nxtSlide' + this.virtual.id, this.virtual);
    } else if (speed < -1.2) {
      cyre.emit('prvSlide' + this.virtual.id, this.virtual);
    } else if (_isClicked(timeElapsed)) {
      this.focus(e);
    }
    return cyre.emit('SNAP' + this.virtual.id, this.virtual)
  }

  //highlight active/ selected slide
  focus(e) {
    //bring selected element to view
    if (!e.target.closest('li.holo')) return false
    this.targetHoloComponent ? this.targetHoloComponent.classList.remove('active') : false;
    this.targetHoloComponent = e.target.closest('li.holo');
    try {
      PROTVJS.PLAY_THIS(this.targetHoloComponent.id);
    } catch (f) {
      //console.log('@playthis not found : ', this.targetHoloComponent.id);
    }
    return cyre.emit('activate' + this.virtual.id, [this.targetHoloComponent, this.virtual])
  }

  //manage active/highlighted slides
  activate([element, virtual]) {
    virtual.transformX = -Math.abs(element.offsetLeft);
    cyre.emit('SNAP' + virtual.id, virtual);
    element.classList.add('active');
  }

  //previous slide operator
  prvSlide(virtual) {
    if (virtual.endOfSlide === 1) return //console.error('shake');
    virtual.transformX += virtual.carousel.width || 0;
    virtual.transformY += virtual.carousel.height || 0;
    return cyre.emit('SNAP' + virtual.id, virtual)
  }

  //next slide operator
  nxtSlide(virtual) {
    if (virtual.endOfSlide === -1) return //console.error('shake');
    virtual.transformX -= virtual.carousel.width || 0;
    virtual.transformY -= virtual.carousel.height || 0;
    return cyre.emit('SNAP' + virtual.id, virtual)
  }

  //jump to first slide operator
  firstSlide(virtual) {
    virtual.transformX = 0;
    virtual.transformY = 0;
    virtual.endOfSlide = 1;
    return cyre.emit('SNAP' + virtual.id, virtual)
  }

  //jump to last slide operator
  lastSlide(virtual) {
    virtual.transformX = virtual.endNumber;
    virtual.transformY = virtual.endNumber;
    virtual.endOfSlide = -1;
    return cyre.emit('SNAP' + virtual.id, virtual)
  }

  //animate slides
  animateSlideForward(virtual) {
    console.log('animating', virtual);
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
    e.preventDefault();
    const virtual = _holo[id].getVirtual;
    if (e.deltaY < 0) {
      cyre.emit('prvSlide' + virtual.id, virtual);
    } else if (e.deltaY > 0) {
      cyre.emit('nxtSlide' + virtual.id, virtual);
    }
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
  cyre.action({
    id: 'Animate' + virtual.id,
    type: virtual.io.animateDirection > 0 ? 'AnimateForward' : 'AnimateBackward',
    payload: virtual,
    interval: virtual.io.duration,
    repeat: virtual.io.loop,
    log: true
  });

  cyre.action({
    id: 'SNAP' + virtual.id,
    type: 'SNAP',
    payload: virtual
  });

  cyre.action({
    id: 'prvSlide' + virtual.id,
    type: 'prvSlide',
    payload: virtual
  });

  cyre.action({
    id: 'nxtSlide' + virtual.id,
    type: 'nxtSlide',
    payload: virtual
  });

  cyre.action({
    id: 'lastSlide' + virtual.id,
    type: 'lastSlide',
    payload: virtual
  });

  cyre.action({
    id: 'firstSlide' + virtual.id,
    type: 'firstSlide',
    payload: virtual
  });

  cyre.action({
    id: 'activate' + virtual.id,
    type: 'activate',
    payload: virtual
  });

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
          Touch.wheeler(e, virtual.id);
        })
      : false;

    virtual.io.animate ? cyre.call('Animate' + virtual.id, virtual) : false;

    shadow.container.addEventListener(
      //when window resizes do something
      'resize',
      () => {
        cyre.call('refresh carousel', {virtual, shadow});
      },
      false
    );
  }

  cyre.call('refresh carousel', {virtual, shadow});
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
  const carousels = document.getElementsByClassName(carouselName);
  if (carousels.length) {
    for (let slide of carousels) {
      //for each carousel found
      holoCreateElement(slide, {});
    }
  } else {
    return console.log('@Holo : carousel structure not found')
  }
};

/** @format */
/**
 *
 * @param {object} virtual
 */
const _transformX = virtual => {
  virtual.transformX = (virtual.io.snap && _snap(virtual.transformX, virtual.item.width)) || virtual.transformX;
  virtual.transformY = 0;
  if (virtual.transformX >= 0) {
    virtual.transformX = 0;
    virtual.endOfSlide = 1; //Left EnD of the carousel
  } else if (virtual.transformX <= virtual.endNumber) {
    virtual.transformX = virtual.endNumber;
    virtual.endOfSlide = -1; //Right end of the carousel
  } else {
    virtual.endOfSlide = 0; //in the middle carousel
  }
  return virtual
};
/**
 *
 * @param {object} virtual
 */
const _transformY = virtual => {
  virtual.transformY = (virtual.io.snap && _snap(virtual.transformY, virtual.item.height)) || virtual.transformY;
  virtual.transformX = 0;
  if (virtual.transformY >= 0) {
    virtual.transformY = 0;
    virtual.endOfSlide = 1; //Left EnD of the carousel
  } else if (virtual.transformY <= virtual.endNumber) {
    virtual.transformY = virtual.endNumber;
    virtual.endOfSlide = -1; //Right end of the carousel
  } else {
    virtual.endOfSlide = 0; //in the middle carousel
  }
  return virtual
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
  cyre.on('refresh carousel', state => {
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
    virtual.endNumber = virtual.io.orientation
      ? -Math.abs(virtual.container.height - virtual.carousel.height)
      : -Math.abs(virtual.container.width - virtual.carousel.width);
    return (_holo[virtual.id].setState = virtual), cyre.call('snap to position', virtual)
  });

  //snap to grid
  cyre.on('SNAP', virtual => {
    //manages container
    _holo[virtual.id].updateStyle = 1;
    if (!virtual.id) return console.error('Holo snap error')
    virtual = virtual.io.orientation ? _transformY(virtual) : _transformX(virtual);
    _holo[virtual.id].setState = virtual;
    return _transform(virtual.id, virtual.transformX, virtual.transformY)
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
        slots = max;
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
    console.log('%c HOLO - Initiating holo v2.2 ', 'background: #022d5f; color: white; display: block;');
    TouchManager(au);
    //listen for events
    cyre.action({id: 'refresh screen', interval: 250}); //adjust width
    cyre.action({id: 'refresh carousel', interval: 250});
    cyre.action({id: 'snap to position', type: 'SNAP'});
    cyre.on('SHAKE', _addShake);
    cyre.on('refresh screen', _refresh);
  };

  document.addEventListener('DOMContentLoaded', () => {}, false); //when dom loads do something

  const _refresh = () => {
    for (let id in _holo) {
      cyre.call('refresh carousel', _holo[id].getState);
    }
  };

  window.addEventListener(
    //when window resizes do something
    'resize',
    () => {
      cyre.call('refresh screen');
    },
    false
  );

  window.onload = () => {
    cyre.dispatch({id: 'app loaded', type: 'LOADED'});
  };

  return {
    TOUCH: Touch,
    INIT: init,
    dimensions: getDimensions,
    BUILD: holoCreateElement,
    AUTO: holoInitiate,
    carousel: _carousel,
    refresh: _refresh
  }
})();

return Holo;

}));

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Holo = factory());
}(this, function () { 'use strict';

  const middleware = {
      insert: (payload, dataDefinitions) => {
          const data = {};
          for (const type in payload) {
              data[type] = dataDefinitions[type] ? dataDefinitions[type](payload[type]) : false;
          }
          return { ok: true, data }
      },
      update: (payload, dataDefinitions) => {
          const data = {};
          for (const type in payload) {
              data[type] = dataDefinitions[type] ? dataDefinitions[type](payload[type]) : false;
          }
          return { ok: true, data }
      }
  };

  const dataDefinitions = {
      id: (x) => {
          return (typeof x === 'string') ? x : 0
      },
      type: (x) => {
          return (typeof x === 'string') ? x : 0
      },
      payload: (x) => {
          return x || 0
      },
      interval: (x) => {
          return Number.isInteger(x) && x || 0;
      },
      repeat: (x) => {
          return Number.isInteger(x) && x || 0;
      },
      group: (x) => {
          return (typeof x === 'string') ? x : 0
      },
      callback: (x) => {
          return (typeof x === 'function') ? x : 0
      },
      log: (x) => {
          return (typeof x === 'boolean') ? x : false
      },
      middleware: (x) => {
          return (typeof x === 'string') ? x : 'insert'
      },
      /* at: (x) => {
          const at = new Date().
      }
   */
  };

  // @ts-check

  /* 

      Neural Line
      Time based event manager
      C.Y.R.E
      Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
      EVENT HANDLER 01 - 01 - 2019 



      eg simple use
      cyre.dispatch{id: uber, type: call, payload: 004485648634}
      cyre.on('call', callTaxi)
      const callTaxi =(number)=>{
        console.log('calling taxi on ', number)  
      }

  */



  class Cyre {
    constructor (id, interval) {
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
      console.log("%c Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0 ", "background: purple; color: white; display: block;");
      this._quartz();
    }


    _log(msg, c = 0) {
      return c ? console.log(msg) : console.log('!log into something else ', msg);
    }

    _wait(type) {
      for (let id of this.waitingList) {
        this.events[this.party[id].type] ? (this.waitingList.delete(id), this._initiate(id)) : console.log('@wait list nop');
      }
    }

    _emit(type, data, response, group = 0) {
      for (const fn of this.events[type]) {
        fn(data, response); //add response
      }
      // return response;
    }

    _recuperator(result, value) {
      result.data = result.ok ? result.data.sort((a, b) => {
        return b - a;
      }).reverse() : [value];
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
        const result = this.timeline.size ? this._processingUnit(this.timeline, this.interval) : {
          ok: false,
          data: []
        };
        this.interval = this._recuperator(result, this.interval).data;
      }
      this.recuperating = requestAnimationFrame(this._quartz.bind(this));
    }

    _processingUnit(timeline, precision) {
      return new Promise((success) => {
        let info = { ok: true, data: [], id: [] };
        for (const id of timeline) {
          this.party[id].timeout -= precision;
          info.data.push(this.party[id].timeout);
          info.id.push(id);
          this.party[id].timeout <= precision ? this._action(id) : false;
          success(info);
        }
      })
    }

    _addToTimeline(id) {
      return { ok: true, data: this.timeline.add(id) }
    }

    _taskComplete(id) {
      return { ok: true, done: this.timeline.delete(id) }
    }

    _repeatAction(id) {
      this.party[id].timeout = this.party[id].interval;
      return { ok: true, done: false, data: --this.party[id].repeat }
    }

    _action(id) {
      return this._emit(this.party[id].type, this.party[id].payload, this.party[id].repeat > 0 ? this._repeatAction(id) : this._taskComplete(id), this.party[id].group)
    }

    _initiate(id) {
      return this.party[id].timeout === 0 ? this._action(id) : this._addToTimeline(id)
    }

    _dispatch(id, type) {
      this.events[type] ? this._initiate(id) : { ok: false, data: this.waitingList.add(id) };
    }

    _createChannel(data, dataDefinitions$$1) {
      const condition = this.party[data.id] ? 'update' : 'insert';
      const result = middleware[condition](data, dataDefinitions$$1);
      result.ok ? this.party[data.id] = result.data : { ok: false, data: console.log('@respond : major malfunctions ', data.id) };
      this.party[data.id].timeout = this.party[data.id].interval || 0;
      return { ok: true, data: data }
    }

    //system user interface

    kick(fn) { //remove unwanted listener
      for (let type in this.events) {
        return this.events[type].has(fn) ? { ok: true, data: this.events[type].delete(fn) } : {
          ok: false,
          data: 'Nothing to kick'
        };
      }
    }

    list() {//list all registered functions action.type
      for (let type in this.events) {
        for (let fn of this.events[type]) {
          this._log(fn.name, 1);
        }
      }
    }

    clear() { //clear all iterating actions
      return this.timeline.clear();
    }

    pause(id) {// pause _quartz
      //need some work
      return this.timeline.has(id) ? this.timeline.delete(id) : false;
    }

    // User interfaces
    on(type, fn, group = []) {
      return new Promise((success, reject) => {
        (typeof fn === 'function')
          ? success({
            ok: true,
            data: this.events[type] ? this.events[type].add([fn]) : (this.events[type] = new Set([fn]), this._wait(type)),

          })
          : reject({ ok: false, data: 'invalid function', msg: console.log(type, fn) });
      })
    }

    type(type, fn, group = []) {
      return new Promise((success, reject) => {
        (typeof fn === 'function')
          ? success({
            ok: true,
            data: this.events[type] ? this.events[type].add([fn]) : (this.events[type] = new Set([fn]), this._wait(type)),

          })
          : reject({ ok: false, data: 'invalid function', msg: console.log(type, fn) });
      })
    }

    channel(x = {}) {
      if (this.party[x.id]) return console.error('@cyre.channel: channel already exist', x.id)
      return this._createChannel(x, dataDefinitions)
    }

    action(x = {}) {
      if (this.party[x.id]) return console.error('@cyre.action: action already exist', x.id)
      return this._createChannel(x, dataDefinitions)
    }

    call(id, payload = 0) {
      this.party[id] ? (this.party[id].payload = payload, this._dispatch(id, this.party[id].type)) : console.error('@cyre.call : channel not found', id);
    }

    //dispatch accepts object type input eg {id: uber, type: call, payload: 0025100124}
    dispatch(data = {}) {
      data.id = data.id ? data.id : 0;
      data.type ? 0 : console.log('@dispatch : data type required for - ', data.id);
      return this._createChannel(data, dataDefinitions).ok ? { ok: true, data: this._dispatch(data.id, data.type) } : { ok: true, data: data.id }
    }

    //respond accepts array of input eg { uber,  call, 0025100124}
    respond(id = 0, type = 0, payload = 0, interval = 0, repeat = 0) {
      const data = { id, type, payload, interval, repeat };
      this._createChannel(data, dataDefinitions);
      this._dispatch(data.id, data.type);
      return { ok: true, data: data.id }
    }
  }

  const cyre = new Cyre();

  class Touch {
      /*

       H.O.L.O TOUCH EVENTS HANDLER

      */
      constructor () {
          this.positionX = 0;
          this.positionY = 0;
          this.pressed = 0;
          this.touch = { start: 'mousedown', move: 'mousemove', end: 'mouseup', enter: 'mouseenter' };
          this.targetHoloComponent = 0;
      }


      //register if touch/click has occured 
      _touchStart(e = window.event, id = 0) {
          if (!id || this.pressed) { return console.error('Holo touch : not my business') }
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
          return this._e.io.orientation === true ? this._dragScrollVertical(e) : this._dragScroll(e), _holo[this._e.id]._style(0);//look into this
      }
      /*
           @dragScroll : handles drag touch moves
      */
      _dragScroll(e) {
          if (!this.pressed) return { ok: false, data: 'not active' };
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
          if (!this.pressed) return 0;
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
          if (!this.pressed) { return 0; }
          this.pressed = 0;//reset after drag event ended
          const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp;
          const speed = swipe(this.distance, timeElapsed);

          if (speed > 1.2) { cyre.call('nxtSlide' + this._e.id, this._e); }
          else if (speed < -1.2) { cyre.call('prvSlide' + this._e.id, this._e); }
          else if (_isClicked(timeElapsed)) { this.focus(this.targetHoloComponent, e); }//if it is a single click
          else { cyre.call('SNAP' + this._e.id, this._e); }
          return;
      }

      //highlight active/ slected slide
      focus(element, e) { //bring selected element to view
          //const target = this.targetHoloComponent.closest('li.holo')
          if (!e.target.closest('li.holo')) return false;
          this.targetHoloComponent ? this.targetHoloComponent.classList.remove('active') : false;
          this.targetHoloComponent = e.target.closest('li.holo');

          try {

              PROTVJS.PLAY_THIS(this.targetHoloComponent.id);
              console.log('@playthis found : ', this.targetHoloComponent.id);
          }
          catch (f) {
              console.log('@playthis not foud : ', this.targetHoloComponent.id);
          }
          // PROTVJS ? PROTVJS.PLAY_THIS(this.targetHoloComponent.id) : 0;
          return cyre.call('activate' + this._e.id, [this.targetHoloComponent, this._e]);
          //_e.Xtransform = element.offsetLeft + _e.carousel.width;
      }

      //manage actice/highlited slides
      activate([element, au]) {
          au.transformX = -Math.abs(element.offsetLeft);
          //console.log(element.offsetLeft);
          cyre.call('SNAP' + au.id, au);
          element.classList.add('active');
      }

      //previous slide operator
      prvSlide(_e) {
          if (_e.sliderEnd === 1) return //console.error('shake');
          _e.transformX += _e.carousel.width || 0;
          _e.transformY += _e.carousel.height || 0;
          return cyre.call('SNAP' + _e.id, _e);
      }


      //next slide operator 
      nxtSlide(_e) {
          if (_e.sliderEnd === -1) return //console.error('shake');
          _e.transformX -= _e.carousel.width || 0;
          _e.transformY -= _e.carousel.height || 0;
          return cyre.call('SNAP' + _e.id, _e);
      }


      //jump to first slide operator
      firstSlide(_e) {
          _e.transformX = 0;
          _e.transformY = 0;
          _e.sliderEnd = 1;
          return cyre.call('SNAP' + _e.id, _e);
      }

      //jump to last slide operator
      lastSlide(_e) {
          _e.transformX = _e.endNumber;
          _e.transformY = _e.endNumber;
          _e.sliderEnd = -1;
          return cyre.call('SNAP' + _e.id, _e);
      }

      //animate slides
      animateSlideForward(_e) {
          if (_e.sliderEnd === -1) { return cyre.call('firstSlide' + _e.id, _e) }
          return cyre.call('nxtSlide' + _e.id, _e)
      }

      animateSlideBackward(_e) {
          if (_e.sliderEnd === 1) { return cyre.call('lastSlide' + _e.id, _e) }
          return cyre.call('prvSlide' + _e.id, _e)
      }


      //mouse 3rd button 'wheel' controller 
      wheeler(e, id) {
          e.preventDefault();
          const au = _holo[id].getState;
          if (e.deltaY < 0) {
              cyre.call("prvSlide" + au.id, au);
          } else if (e.deltaY > 0) {
              cyre.call("nxtSlide" + au.id, au);
          }
      }

  }

  /**


       H.O.L.O - COMMON EVENTS

       */
  const _holo = {}; //main instance
  const _Touch = new Touch();
  const _transform = (id, x = 0, y = 0, z = 0) => {
    _holo[id]._state.elm.container.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
  };

  const _snap = (parent, item) => {
    return Math.round(parent / item) * item;
  };


  const _isClicked = (timeElapsed) => {
    return timeElapsed < 250 ? 1 : 0; ///handle click, touch, double click or long-touch events
  };

  const swipe = (distance, timeElapsed) => {
    return distance / timeElapsed

  };

  /**

   *  deafualt entries
   */
  class HoloCli {
      /*

       H.O.L.O -  C.L.I

       */

      constructor () {
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
              enabled: 1,
              wheel: 0,
              controllers: 0,
              drag: 1,
              swipe: 0,
              snap: 1,
              focus: 0,
              orientation: 0,
              type: true
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
      constructor (slide) {
          super();
          if (!slide) { console.log('@holo oh putain'); }
          if (!slide.id) {
              console.error('@holo oh putain: has no ID ');
              side.id = 'OhPutain';
          }
          // console.log('@Aure`  Initializing slider       ---2.0.1');
          this._state.elm.carousel = slide;
          this.id = slide.id;
          this._setup();
      }

      _createHolo(e) {
          const holo = `<div class="holo-place-holder box" id='holo_PlaceHolder${e}'>
                         <div class="holo-loader"></div>
                          </div>`;
          return holo;
      }

      _setup() {
          this._state.elm.container = this._state.elm.carousel.getElementsByClassName('holo-container')[0] || 0;
          //this.nxt = this._state.elm.carousel.getElementsByClassName('nxtbutton')[0] || 0;
          //this.prv = this._state.elm.carousel.getElementsByClassName('prvbutton')[0] || 0;
          return this._state.elm.container ? this._define() : console.error('@Aure : holo-container empty');    }

      _define() {
          this._state.carousel.width = this._state.elm.carousel.clientWidth || 0;
          if (!this._state.elm.container.children.length) { return console.error('@define no holo element found') }
          this._state.id = this.id;
          this._state.childLength = this._state.elm.container.children.length;
          this._state.startNumbre = 0;
          this._state.endNumber = 0;
          this._state.item.min = 1;
          this._state.item.max = this._state.elm.carousel.dataset.max || 0;
          this._state.io.wheel = !!this._state.elm.carousel.dataset.wheel;
          this._state.io.orientation = !!this._state.elm.carousel.dataset.orientation;
          this._state.io.sanp = 1;
          this._state.io.animate = Number(this._state.elm.carousel.dataset.animate) || 0;
          this._state.io.duration = Number(this._state.elm.carousel.dataset.duration) || 0;
          this._state.io.loop = Number(this._state.elm.carousel.dataset.loop) || 0;
      }

      get getState() { //provide  _state object upon request
          return this._state
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
          }
      }

      setState(state) { //update _state object
          //DOM ACCESS
          //const _au = this._state
          this._state = state;
          this._state.io.orientation ? 0 : this._state.elm.carousel.style.width = state.carousel.width + 'px';
          this._state.io.orientation ? this._state.elm.carousel.style.height = state.carousel.height + 'px' : 0;
          //END OF DOM ACCESS
      }

      _style(on = 0) {
          //add or remove transition duration to container
          if (on) {
              this._state.elm.container.style.transitionDuration = this._state.duration + 'ms';
              this._state.elm.container.style.transitionTimingFunction = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
          }
          else {
              this._state.elm.container.style.transitionDuration = '0ms';
              this._state.elm.container.style.transitionTimingFunction = "linear";
          }
      }
  }

  const holoCreateElement = (slide) => {
      //console.log('@Create au element  ---- : slide  ', slide);
      console.log('holo carousel @init : found ---  ', slide.id);
      _holo[slide.id] = new Aure(slide); //register found carousels
      const au = _holo[slide.id].getState;
      if (au.io.enabled) {
          au.elm.container.addEventListener('mousedown', (
              (e) => {
                  e.preventDefault();
                  _Touch._touchStart(e, au.id);
              })
          );
          au.elm.container.addEventListener('touchstart', (
              (e) => {
                  e.preventDefault();
                  _Touch._touchStart(e, au.id);
              })
          );
          au.io.wheel ? au.elm.carousel.addEventListener('wheel', (e) => { _Touch.wheeler(e, au.id); }, false) : 0;
          au.io.animate ? cyre.respond('Animate' + au.id, (au.io.animate > 0 ? "AnimateForward" : 'AnimateBackward'), au, au.io.duration, au.io.loop) : 0;
      }
      cyre.action({
          id: 'SNAP' + au.id,
          type: 'SNAP',
          payload: au
      });
      cyre.action({
          id: "prvSlide" + au.id,
          type: "prvSlide",
          payload: au
      });
      cyre.action({
          id: "nxtSlide" + au.id,
          type: "nxtSlide",
          payload: au
      });
      cyre.action({
          id: "lastSlide" + au.id,
          type: "lastSlide",
          payload: au
      });
      cyre.action({
          id: "firstSlide" + au.id,
          type: "firstSlide",
          payload: au
      });

      cyre.action({
          id: "activate" + au.id,
          type: "activate",
          payload: au
      });

  };

  //holo Locate all holo carousel structures ByClassName
  const holoInitiate = (au) => {
      const carousels = document.getElementsByClassName(au); //get all carousels by this class name
      if (carousels.length) {
          for (let slide of carousels) { //for each carousel found
              holoCreateElement(slide);
          }
      } else {
          return console.log('@Holo : Holo carousel structure not found');
      }
  };

  const _transformX = (_e) => {
      _e.transformX = _e.io.snap && _snap(_e.transformX, _e.item.width);
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
      _e.transformY = _e.io.snap && _snap(_e.transformY, _e.item.height);
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

  const TouchManager = (au) => {

      document.addEventListener('mousemove', (e) => {
          if (_Touch.pressed) {
              _Touch.currentX = e.clientX;
              _Touch.currentY = e.clientY;
          }
      });

      document.addEventListener('mouseup', ((e) => {
          e.preventDefault();
          _Touch.pressed ? _Touch._touchEnd(e) : false;
      }));

      document.addEventListener('touchmove', (e) => {
          if (_Touch.pressed) {
              _Touch.currentX = e.touches[0].clientX;            _Touch.currentY = e.touches[0].clientY;
          }
      });

      document.addEventListener('touchend', ((e) => {
          _Touch.pressed ? _Touch._touchEnd(e) : false;
      }));

      cyre.type('AnimateForward', _Touch.animateSlideForward);
      cyre.type('AnimateBackward', _Touch.animateSlideBackward);
      cyre.type('nxtSlide', _Touch.nxtSlide);
      cyre.type('prvSlide', _Touch.prvSlide);
      cyre.type('firstSlide', _Touch.firstSlide);
      cyre.type('lastSlide', _Touch.lastSlide);
      cyre.type('FOCUS', _Touch.focus);
      cyre.type('wheeler', _Touch.wheeler);
      cyre.type('activate', _Touch.activate);

  };

  //Project HOLO-CAROUSEL 2019


  const Holo = (() => {
      //events - Javascript publish subscribe pattern


      const _width = (_e) => { //manages carousel(not pure)
          if (!_e.id) { return console.error('Holo width error') }
          _e.elm.container.setAttribute('style', '');
          const { height, width } = _getItemWidthHeight(_e.elm.container.children[0]);
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

          return _holo[_e.id].setState(_e), _snapWidth(_e);
      };
      //snap to grid
      const _snapWidth = (au) => {  //manages container
          _holo[au.id]._style(1);
          if (!au.id) { return console.error('Holo snap error'); }
          au = au.io.orientation ? _transformY(au) : _transformX(au);
          _holo[au.id].setState(au);
          return _transform(au.id, au.transformX, au.transformY);
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

      const _addShake = (_e) => {
          _e.elm.container.classList.add('shake-off');
          let shake = setTimeout(() => {
              shake = 0;
              _e.elm.container.classList.remove('shake-off');
              return 0
          }, 1000);
      };


      //pure function
      const _getItemWidthHeight = (e) => {
          if (!e) {
              return 0;
          }
          let outer = {};
          outer.width = e.offsetWidth;
          outer.height = e.offsetHeight;
          const style = window.getComputedStyle(e, null);
          outer.width += parseInt(style.marginLeft) + parseInt(style.marginRight);
          outer.height += parseInt(style.marginTop) + parseInt(style.marginBottom);
          return outer;
      };


      const _getAure = (id) => {
          return _holo[id].getAure
      };

      const _init = (au = 'holo-carousel') => {
          console.log("%c HOLO - Initiating holo v2.2 ", "background: #022d5f; color: white; display: block;");
          TouchManager(au);
          //listen for events
          cyre.dispatch({ id: 'ON SCREEN RESIZE', type: 'SCREEN', interval: 50 });      //adjust width
          cyre.type('SNAP', _snapWidth);
          cyre.type('WIDTH', _width);
          cyre.type('SHAKE', _addShake);
          cyre.type('SCREEN', _aure_manager);
      };

      document.addEventListener("DOMContentLoaded", () => { //when dom loads do something       

      }, false);

      const _aure_manager = () => {
          for (let id in _holo) {
              cyre.respond('width' + id, 'WIDTH', _holo[id].getState, 250);
          }
      };

      window.addEventListener('resize', () => { //when window loads do something
          cyre.dispatch({ id: 'ON SCREEN RESIZE', type: 'SCREEN', interval: 250 });
      }, false);

      window.onload = () => {
          cyre.respond('LOADING', 'LOADED', 100);
      };

      return {
          TOUCH: _Touch,
          INIT: _init,
          HOLO: _getAure,
          BUILD: holoCreateElement,
          AUTO: holoInitiate
      }

  })();

  return Holo;

}));

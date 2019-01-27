"use strict";
//@ts-check
import HoloCli from './holo-cli';
import { _holo, events } from './events';

class Aure extends HoloCli {
    /*

     H.O.L.O - A.U.R.E`
     aka holo-create-carousel

     */
    constructor (slide) {
        super();
        if (!slide) { console.log('@holo oh putain') }
        if (!slide.id) {
            console.error('@holo oh putain: has no ID ')
            side.id = 'OhPutain'
        }
        // console.log('@Aure`  Initializing slider       ---2.0.1');
        this._state.elm.carousel = slide;
        this.id = slide.id;
        this._setup()
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
        return this._state.elm.container ? this._define() : console.error('@Aure : holo-container empty');;
    }

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
        this._state = state
        this._state.io.orientation ? 0 : this._state.elm.carousel.style.width = state.carousel.width + 'px';
        this._state.io.orientation ? this._state.elm.carousel.style.height = state.carousel.height + 'px' : 0
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
export default Aure
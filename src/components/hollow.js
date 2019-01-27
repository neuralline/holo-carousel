"use strict";
//@ts-check
import { _holo, events } from './Events';

class HOLLOW {
    /*

     H.O.L.O - H.O.L.O`

     */
    constructor (container) {
        if (!container.id) {
            console.error('@holo oh putain: has no ID ')
            side.id = 'OhPutain'
        }
        this.container = container;
        this.id = container.id;
        this.data = {}
        this.hollow = 0
        this.holo = []

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
export default HOLLOW
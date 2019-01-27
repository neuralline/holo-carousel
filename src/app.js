//Project HOLO-CAROUSEL 2019


// jscs:enabled
// @flow
// @ts-check 

/*

        H.O.L.O - C.A.R.O.U.S.E.L
        BY DARIK HART
        @git NeuralLine


*/

//HOLO self invoking function
"use strict";
import { cyre } from 'cyre'
import { _snap, _holo, _transform, _Touch } from './components/events';
import holoInitiate from './components/holo-initiate'
import holoCreateElement from './components/holo-create-element'
import { _transformX, _transformY } from "./components/OrientationHandlers";
import { TouchManager } from "./components/touch-manager";


const Holo = (() => {
    //events - Javascript publish subscribe pattern


    const _width = (_e) => { //manages carousel(not pure)
        if (!_e.id) { return console.error('Holo width error') }
        _e.elm.container.setAttribute('style', '')
        const { height, width } = _getItemWidthHeight(_e.elm.container.children[0]);
        _e.item.height = height;
        _e.item.width = width;
        _e.numberOfSlots = _numberOfSlots(_e.elm.carousel.parentNode.clientWidth, _e.item.width, _e.item.max) || 1;
        const calcCarouselWidth = _e.numberOfSlots * _e.item.width;
        const innerCarouselWidth = _e.elm.carousel.clientWidth
        const calcWidth = _e.elm.container.children.length * _e.item.width
        const innerWidth = _e.elm.container.clientWidth || calcWidth

        _e.carousel.width = calcCarouselWidth || innerCarouselWidth
        _e.carousel.height = _e.item.height || _e.elm.carousel.clientHeight;

        _e.container.width = _e.io.orientation ? _e.carousel.width : innerWidth;
        _e.container.height = _e.elm.container.clientHeight || _e.item.height || 0;
        _e.endNumber = _e.io.orientation ? -Math.abs(_e.container.height - _e.carousel.height) : -Math.abs(_e.container.width - _e.carousel.width)

        return _holo[_e.id].setState(_e), _snapWidth(_e);
    }
    //snap to grid
    const _snapWidth = (au) => {  //manages container
        _holo[au.id]._style(1)
        if (!au.id) { return console.error('Holo snap error'); }
        au = au.io.orientation ? _transformY(au) : _transformX(au)
        _holo[au.id].setState(au)
        return _transform(au.id, au.transformX, au.transformY);
    };

    const _numberOfSlots = (parent, item, max) => {
        let slots = Math.floor(parent / item);
        if (max) {
            if (slots > max) {
                slots = max
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
    }

    const _init = (au = 'holo-carousel') => {
        console.log("%c HOLO - Initiating holo v2.2 ", "background: #022d5f; color: white; display: block;");
        TouchManager(au)
        //listen for events
        cyre.respond('SCREEN', 'SCREEN', 'SCREEN', 50)      //adjust width
        cyre.on('SNAP', _snapWidth);
        cyre.on('WIDTH', _width);
        cyre.on('SHAKE', _addShake);
        cyre.on('SCREEN', _aure_manager)
    }

    document.addEventListener("DOMContentLoaded", () => { //when dom loads do something       
        cyre.respond('LOADING', 'LOADING', 100)
    }, false);

    const _aure_manager = () => {
        for (let id in _holo) {
            cyre.respond('width' + id, 'WIDTH', _holo[id].getState, 250)
        }
    };

    window.addEventListener('resize', () => { //when window loads do something
        cyre.respond('SCREEN', 'SCREEN', 'SCREEN', 250)
    }, false);

    window.onload = () => {
        cyre.respond('LOADING', 'LOADED', 100)
    };


    return {
        TOUCH: _Touch,
        INIT: _init,
        HOLO: _getAure,
        BUILD: holoCreateElement,
        AUTO: holoInitiate,

    }

})();

export default Holo;
"use strict";
//@ts-check
// @git Neural Line
// @02/01/2019
import { cyre } from 'cyre';
import { _holo, _isClicked, _transform, swipe } from './events';

class Touch {
    /*

     H.O.L.O TOUCH EVENTS HANDLER

    */
    constructor () {
        this.positionX = 0;
        this.positionY = 0;
        this.pressed = 0;
        this.touch = { start: 'mousedown', move: 'mousemove', end: 'mouseup', enter: 'mouseenter' };
        this.targetHoloComponent = 0
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
        requestAnimationFrame(this._dragScroll.bind(this))
    }

    //@dragScroll : handles vertical drag touch moves 
    _dragScrollVertical(e) {
        if (!this.pressed) return 0;
        this.distance = this.positionY - this.currentY;
        this._e.transformY = this.snapHeight - this.distance * 1.482 || 0;
        _transform(this._e.id, 0, this._e.transformY, 0);
        requestAnimationFrame(this._dragScrollVertical.bind(this))
    }

    //Register event/mouse position when touch/drag ends
    _touchEnd(e) {
        const touchEndTimeStamp = performance.now();
        e.preventDefault();
        e.stopPropagation();
        if (!this.pressed) { return 0; }
        this.pressed = 0;//reset after drag event ended
        const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp
        const speed = swipe(this.distance, timeElapsed)

        if (speed > 1.2) { cyre.call('nxtSlide' + this._e.id, this._e) }
        else if (speed < -1.2) { cyre.call('prvSlide' + this._e.id, this._e) }
        else if (_isClicked(timeElapsed)) { this.focus(this.targetHoloComponent, e) }//if it is a single click
        else { cyre.call('SNAP' + this._e.id, this._e) }
        return;
    }

    //highlight active/ slected slide
    focus(element, e) { //bring selected element to view
        //const target = this.targetHoloComponent.closest('li.holo')
        if (!e.target.closest('li.holo')) return false;
        this.targetHoloComponent ? this.targetHoloComponent.classList.remove('active') : false
        this.targetHoloComponent = e.target.closest('li.holo')

        try {

            PROTVJS.PLAY_THIS(this.targetHoloComponent.id)
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
        au.transformX = -Math.abs(element.offsetLeft)
        //console.log(element.offsetLeft);
        cyre.call('SNAP' + au.id, au)
        element.classList.add('active')
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
        const au = _holo[id].getState
        if (e.deltaY < 0) {
            cyre.call("prvSlide" + au.id, au);
        } else if (e.deltaY > 0) {
            cyre.call("nxtSlide" + au.id, au);
        }
    }

}
export default Touch
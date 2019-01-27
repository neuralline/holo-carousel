"use strict";
//@ts-check
import Touch from './holo-touch';
/**


     H.O.L.O - COMMON EVENTS

     */
export const _holo = {}; //main instance
export const _Touch = new Touch();
export const _transform = (id, x = 0, y = 0, z = 0) => {
  _holo[id]._state.elm.container.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
};

export const _snap = (parent, item) => {
  return Math.round(parent / item) * item;
};


export const _isClicked = (timeElapsed) => {
  return timeElapsed < 250 ? 1 : 0; ///handle click, touch, double click or long-touch events
};

export const swipe = (distance, timeElapsed) => {
  return distance / timeElapsed

}

export default _Touch





import { cyre } from 'cyre'
import Aure from './Aure';
import { _holo, _Touch } from './events';

export const holoCreateElement = (slide) => {
    //console.log('@Create au element  ---- : slide  ', slide);
    console.log('holo carousel @init : found ---  ', slide.id)
    _holo[slide.id] = new Aure(slide); //register found carousels
    const au = _holo[slide.id].getState
    if (au.io.enabled) {
        au.elm.container.addEventListener('mousedown', (
            (e) => {
                e.preventDefault();
                _Touch._touchStart(e, au.id)
            })
        );
        au.elm.container.addEventListener('touchstart', (
            (e) => {
                e.preventDefault();
                _Touch._touchStart(e, au.id)
            })
        );
        au.io.wheel ? au.elm.carousel.addEventListener('wheel', (e) => { _Touch.wheeler(e, au.id) }, false) : 0;
        au.io.animate ? cyre.respond('Animate' + au.id, (au.io.animate > 0 ? "AnimateForward" : 'AnimateBackward'), au, au.io.duration, au.io.loop) : 0;
    }
    cyre.channel({
        id: 'SNAP' + au.id,
        action: 'SNAP',
        payload: au
    });
    cyre.channel({
        id: "prvSlide" + au.id,
        action: "prvSlide",
        payload: au
    })
    cyre.channel({
        id: "nxtSlide" + au.id,
        action: "nxtSlide",
        payload: au
    })
    cyre.channel({
        id: "lastSlide" + au.id,
        action: "lastSlide",
        payload: au
    })
    cyre.channel({
        id: "firstSlide" + au.id,
        action: "firstSlide",
        payload: au
    })

    cyre.channel({
        id: "activate" + au.id,
        action: "activate",
        payload: au
    })

}
export default holoCreateElement
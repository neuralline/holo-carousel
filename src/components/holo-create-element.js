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
    cyre.action({
        id: 'SNAP' + au.id,
        type: 'SNAP',
        payload: au
    });
    cyre.action({
        id: "prvSlide" + au.id,
        type: "prvSlide",
        payload: au
    })
    cyre.action({
        id: "nxtSlide" + au.id,
        type: "nxtSlide",
        payload: au
    })
    cyre.action({
        id: "lastSlide" + au.id,
        type: "lastSlide",
        payload: au
    })
    cyre.action({
        id: "firstSlide" + au.id,
        type: "firstSlide",
        payload: au
    })

    cyre.action({
        id: "activate" + au.id,
        type: "activate",
        payload: au
    })

}
export default holoCreateElement
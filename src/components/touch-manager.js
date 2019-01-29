import { cyre } from 'cyre'
import { _holo, _wheeler, _Touch } from './events';
export const TouchManager = (au) => {

    document.addEventListener('mousemove', (e) => {
        if (_Touch.pressed) {
            _Touch.currentX = e.clientX;
            _Touch.currentY = e.clientY;
        }
    });

    document.addEventListener('mouseup', ((e) => {
        e.preventDefault()
        _Touch.pressed ? _Touch._touchEnd(e) : false;
    }))

    document.addEventListener('touchmove', (e) => {
        if (_Touch.pressed) {
            _Touch.currentX = e.touches[0].clientX;;
            _Touch.currentY = e.touches[0].clientY;
        }
    });

    document.addEventListener('touchend', ((e) => {
        _Touch.pressed ? _Touch._touchEnd(e) : false;
    }))

    cyre.type('AnimateForward', _Touch.animateSlideForward)
    cyre.type('AnimateBackward', _Touch.animateSlideBackward)
    cyre.type('nxtSlide', _Touch.nxtSlide)
    cyre.type('prvSlide', _Touch.prvSlide)
    cyre.type('firstSlide', _Touch.firstSlide)
    cyre.type('lastSlide', _Touch.lastSlide)
    cyre.type('FOCUS', _Touch.focus)
    cyre.type('wheeler', _Touch.wheeler)
    cyre.type('activate', _Touch.activate)

}
export default TouchManager
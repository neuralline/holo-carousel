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

    cyre.on('AnimateForward', _Touch.animateSlideForward)
    cyre.on('AnimateBackward', _Touch.animateSlideBackward)
    cyre.on('nxtSlide', _Touch.nxtSlide)
    cyre.on('prvSlide', _Touch.prvSlide)
    cyre.on('firstSlide', _Touch.firstSlide)
    cyre.on('lastSlide', _Touch.lastSlide)
    cyre.on('FOCUS', _Touch.focus)
    cyre.on('wheeler', _Touch.wheeler)
    cyre.on('activate', _Touch.activate)

}
export default TouchManager
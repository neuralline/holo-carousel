//src/components/holo-touch-manager.ts
import cyre from 'cyre'
import {
  activate,
  animate,
  animateSlideBackward,
  animateSlideForward,
  firstSlide,
  lastSlide,
  nxtSlide,
  prvSlide,
  wheeler
} from './holo-essentials'
import Touch from './holo-touch'

const TouchManager = () => {
  document.addEventListener('mousemove', e => {
    if (Touch.pressed) {
      Touch.currentX = e.clientX
      Touch.currentY = e.clientY
    }
  })

  document.addEventListener('mouseup', e => {
    e.preventDefault()
    Touch.pressed ? Touch._touchEnd(e) : false
  })

  document.addEventListener('touchmove', e => {
    if (Touch.pressed) {
      Touch.currentX = e.touches[0].clientX
      Touch.currentY = e.touches[0].clientY
    }
  })

  document.addEventListener('touchend', e => {
    Touch.pressed ? Touch._touchEnd(e) : false
  })

  cyre.on('AnimateForward', animateSlideForward)
  cyre.on('AnimateBackward', animateSlideBackward)
  cyre.on('Animate', animate)
  cyre.on('nxtSlide', nxtSlide)
  cyre.on('prvSlide', prvSlide)
  cyre.on('firstSlide', firstSlide)
  cyre.on('lastSlide', lastSlide)
  cyre.on('bringToFocus', Touch.focus)
  cyre.on('wheeler', wheeler)
  cyre.on('activate', activate)
  return true
}
export {TouchManager}

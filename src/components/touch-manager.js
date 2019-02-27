/** @format */

import {cyre} from 'cyre'
import Touch from './holo-touch'

const TouchManager = au => {
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

  cyre.on('AnimateForward', Touch.animateSlideForward)
  cyre.on('AnimateBackward', Touch.animateSlideBackward)
  cyre.on('nxtSlide', Touch.nxtSlide)
  cyre.on('prvSlide', Touch.prvSlide)
  cyre.on('firstSlide', Touch.firstSlide)
  cyre.on('lastSlide', Touch.lastSlide)
  cyre.on('bringToFocus', Touch.focus)
  cyre.on('wheeler', Touch.wheeler)
  cyre.on('activate', Touch.activate)
}
export {TouchManager}

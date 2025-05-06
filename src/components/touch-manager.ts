//src/components/touch-manager.ts

import {cyre} from 'cyre'
import {
  activate,
  animateSlideBackward,
  animateSlideForward,
  firstSlide,
  lastSlide,
  nxtSlide,
  prvSlide,
  wheeler
} from '../libs/holo-essentials'
import Touch from './holo-touch'

/**
 * Setup touch and event handlers for the carousel
 * @param selector - Optional class selector for carousels
 */
export const TouchManager = (selector?: string): boolean => {
  // Mouse move handler
  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (Touch.pressed) {
      Touch.currentX = e.clientX
      Touch.currentY = e.clientY
    }
  })

  // Mouse up handler
  document.addEventListener('mouseup', (e: MouseEvent) => {
    e.preventDefault()
    Touch.pressed ? Touch._touchEnd(e) : false
  })

  // Touch move handler
  document.addEventListener('touchmove', (e: TouchEvent) => {
    if (Touch.pressed) {
      Touch.currentX = e.touches[0].clientX
      Touch.currentY = e.touches[0].clientY
    }
  })

  // Touch end handler
  document.addEventListener('touchend', (e: TouchEvent) => {
    Touch.pressed ? Touch._touchEnd(e) : false
  })

  // Register event handlers with cyre
  cyre.on('AnimateForward', animateSlideForward)
  cyre.on('AnimateBackward', animateSlideBackward)
  cyre.on('nxtSlide', nxtSlide)
  cyre.on('prvSlide', prvSlide)
  cyre.on('firstSlide', firstSlide)
  cyre.on('lastSlide', lastSlide)
  cyre.on('bringToFocus', Touch.focus)
  cyre.on('wheeler', wheeler)
  cyre.on('activate', activate)

  return true
}

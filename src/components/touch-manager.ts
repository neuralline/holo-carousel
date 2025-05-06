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
import {Touch} from './holo-touch'

/**
 * Setup touch and event handlers for the carousel
 * @param selector - Optional class selector for carousels
 */
export const setupTouchManager = (selector?: string): boolean => {
  // Setup mouse move event listener
  const handleMouseMove = (e: MouseEvent): void => {
    if (Touch.pressed) {
      Touch.currentX = e.clientX
      Touch.currentY = e.clientY
    }
  }

  // Setup mouse up event listener
  const handleMouseUp = (e: MouseEvent): void => {
    e.preventDefault()
    if (Touch.pressed) {
      Touch._touchEnd(e)
    }
  }

  // Setup touch move event listener
  const handleTouchMove = (e: TouchEvent): void => {
    if (Touch.pressed) {
      Touch.currentX = e.touches[0].clientX
      Touch.currentY = e.touches[0].clientY
    }
  }

  // Setup touch end event listener
  const handleTouchEnd = (e: TouchEvent): void => {
    if (Touch.pressed) {
      Touch._touchEnd(e)
    }
  }

  // Add event listeners
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)

  // Register global event handlers with cyre
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

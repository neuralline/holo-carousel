//src/components/holo-io-manager.ts

import {cyre} from 'cyre'
import type {HoloVirtual, HoloShadow} from '../types/interface'
import {Touch} from './holo-touch'
import {wheeler} from '../libs/holo-essentials'

/**
 * H.O.L.O - C.A.R.O.U.S.E.L
 * IO manager
 * Setup input/output event handling for a carousel instance
 */
export const setupIOManager = (
  virtual: HoloVirtual,
  shadow: HoloShadow
): void => {
  if (!virtual) {
    console.error('@Holo: Major malfunctions - Virtual state is missing')
    return
  }

  if (!virtual.id) {
    console.error('@Holo: Virtual state has no ID')
    return
  }

  // Register events with cyre
  setupCyreActions(virtual)

  // Setup DOM event handlers if enabled
  if (virtual.io.enabled) {
    setupDomEventHandlers(virtual, shadow)
  }

  // Initial refresh
  cyre.call('refresh carousel', {virtual, shadow})
}

/**
 * Setup Cyre actions for event handling
 */
const setupCyreActions = (virtual: HoloVirtual): void => {
  cyre.action([
    {
      id: `Animate${virtual.id}`,
      type:
        virtual.io.animateDirection > 0 ? 'AnimateForward' : 'AnimateBackward',
      payload: virtual,
      interval: virtual.io.duration,
      repeat: virtual.io.loop,
      log: true
    },
    {
      id: `SNAP${virtual.id}`,
      type: 'SNAP',
      payload: virtual
    },
    {
      id: `prvSlide${virtual.id}`,
      type: 'prvSlide',
      payload: virtual
    },
    {
      id: `nxtSlide${virtual.id}`,
      type: 'nxtSlide',
      payload: virtual
    },
    {
      id: `lastSlide${virtual.id}`,
      type: 'lastSlide',
      payload: virtual
    },
    {
      id: `firstSlide${virtual.id}`,
      type: 'firstSlide',
      payload: virtual
    },
    {
      id: `activate${virtual.id}`,
      type: 'activate',
      payload: virtual
    }
  ])
}

/**
 * Setup DOM event handlers
 */
const setupDomEventHandlers = (
  virtual: HoloVirtual,
  shadow: HoloShadow
): void => {
  // Mouse drag handler
  if (virtual.io.drag) {
    const handleMouseDown = (e: MouseEvent): void => {
      e.preventDefault()
      Touch._touchStart(e, virtual.id)
    }

    shadow.container.addEventListener('mousedown', handleMouseDown)
  }

  // Touch drag handler
  if (virtual.io.drag) {
    const handleTouchStart = (e: TouchEvent): void => {
      e.preventDefault()
      Touch._touchStart(e, virtual.id)
    }

    shadow.container.addEventListener('touchstart', handleTouchStart)
  }

  // Mouse wheel handler
  if (virtual.io.wheel) {
    const handleWheel = (e: WheelEvent): void => {
      wheeler(e, virtual.id)
    }

    shadow.carousel.addEventListener('wheel', handleWheel)
  }

  // Animation handler
  if (virtual.io.animate) {
    cyre.call(`Animate${virtual.id}`, virtual)
  }

  // Resize handler
  const handleResize = (): void => {
    cyre.call('refresh carousel', {virtual, shadow})
  }

  shadow.container.addEventListener('resize', handleResize, false)
}

export default setupIOManager

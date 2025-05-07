//src/components/holo-io-manager.ts

import {cyre} from 'cyre'
import type {HoloVirtual, HoloShadow} from '../types/interface'
import {Touch} from './holo-touch'
import {
  wheeler,
  prvSlide,
  nxtSlide,
  firstSlide,
  lastSlide,
  activate,
  animateSlideForward,
  animateSlideBackward
} from '../libs/holo-essentials'

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
  cyre.call('refresh_carousel', {virtual, shadow})
}

/**
 * CRITICAL FIX: Setup Cyre actions for event handling with proper ID registration
 * We need to register BOTH the generic and instance-specific event IDs
 */
const setupCyreActions = (virtual: HoloVirtual): void => {
  // Define event IDs consistently
  const eventIds = {
    animate: `animate_${virtual.id}`,
    snap: `snap_${virtual.id}`,
    prevSlide: `prev_slide_${virtual.id}`,
    nextSlide: `next_slide_${virtual.id}`,
    lastSlide: `last_slide_${virtual.id}`,
    firstSlide: `first_slide_${virtual.id}`,
    activate: `activate_${virtual.id}`
  }

  // Store the event IDs in the virtual state for reference
  virtual.eventIds = eventIds

  // CRITICAL FIX: Register instance-specific event handlers
  // This ensures that when we call an ID like "animate_au_carousel3", it has a handler
  cyre.on(
    eventIds.animate,
    virtual.io.animateDirection > 0 ? animateSlideForward : animateSlideBackward
  )
  cyre.on(eventIds.snap, payload => cyre.call('SNAP', payload))
  cyre.on(eventIds.prevSlide, prvSlide)
  cyre.on(eventIds.nextSlide, nxtSlide)
  cyre.on(eventIds.lastSlide, lastSlide)
  cyre.on(eventIds.firstSlide, firstSlide)
  cyre.on(eventIds.activate, activate)

  // CRITICAL FIX: Register instance-specific actions
  cyre.action([
    {
      id: eventIds.animate,
      interval: virtual.io.duration,
      repeat: virtual.io.loop,
      log: true
    },
    {id: eventIds.snap},
    {id: eventIds.prevSlide},
    {id: eventIds.nextSlide},
    {id: eventIds.lastSlide},
    {id: eventIds.firstSlide},
    {id: eventIds.activate}
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
    cyre.call(virtual.eventIds.animate, virtual)
  }

  // Resize handler
  const handleResize = (): void => {
    cyre.call('refresh_carousel', {virtual, shadow})
  }

  shadow.container.addEventListener('resize', handleResize, false)
}

export default setupIOManager

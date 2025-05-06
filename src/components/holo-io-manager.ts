//src/components/holo-io-manager.ts

import {cyre} from 'cyre'
import {HoloVirtual, HoloShadow} from '../types/interface'
import Touch from './holo-touch'
import {wheeler} from '../libs/holo-essentials'

/**
 * H.O.L.O - C.A.R.O.U.S.E.L
 * IO manager
 * Setup input/output event handling for a carousel instance
 * @param virtual - Virtual state object
 * @param shadow - Shadow DOM references
 */
const ManageIO = (virtual: HoloVirtual, shadow: HoloShadow): void => {
  if (!virtual) {
    console.error('@Holo: Major malfunctions')
    return
  }

  // Register events with cyre
  cyre.action([
    {
      id: 'Animate' + virtual.id,
      type:
        virtual.io.animateDirection > 0 ? 'AnimateForward' : 'AnimateBackward',
      payload: virtual,
      interval: virtual.io.duration,
      repeat: virtual.io.loop,
      log: true
    },
    {
      id: 'SNAP' + virtual.id,
      type: 'SNAP',
      payload: virtual
    },
    {
      id: 'prvSlide' + virtual.id,
      type: 'prvSlide',
      payload: virtual
    },
    {
      id: 'nxtSlide' + virtual.id,
      type: 'nxtSlide',
      payload: virtual
    },
    {
      id: 'lastSlide' + virtual.id,
      type: 'lastSlide',
      payload: virtual
    },
    {
      id: 'firstSlide' + virtual.id,
      type: 'firstSlide',
      payload: virtual
    },
    {
      id: 'activate' + virtual.id,
      type: 'activate',
      payload: virtual
    }
  ])

  // Setup event handlers if enabled
  if (virtual.io.enabled) {
    // Mouse drag handler
    if (virtual.io.drag) {
      shadow.container.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault()
        Touch._touchStart(e, virtual.id)
      })
    }

    // Touch drag handler
    if (virtual.io.drag) {
      shadow.container.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault()
        Touch._touchStart(e, virtual.id)
      })
    }

    // Mouse wheel handler
    if (virtual.io.wheel) {
      shadow.carousel.addEventListener('wheel', (e: WheelEvent) => {
        wheeler(e, virtual.id)
      })
    }

    // Animation handler
    if (virtual.io.animate) {
      cyre.call('Animate' + virtual.id, virtual)
    }

    // Resize handler
    shadow.container.addEventListener(
      'resize',
      () => {
        cyre.call('refresh carousel', {virtual, shadow})
      },
      false
    )
  }

  // Initial refresh
  cyre.call('refresh carousel', {virtual, shadow})
}

export default ManageIO

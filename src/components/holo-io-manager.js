/** @format */
//@ts-check

import {cyre} from 'cyre'
import Touch from './holo-touch'

/**
 *
 * @param {object} virtual  holo[id].virtual
 * @param {object} shadow  holo[id].shadow
 */

const ManageIO = (virtual, shadow) => {
  if (!virtual) return console.error('@Holo : Major malfunctions')
  cyre.action({
    id: 'Animate' + virtual.id,
    type: virtual.io.animateDirection > 0 ? 'AnimateForward' : 'AnimateBackward',
    payload: virtual,
    interval: virtual.io.duration,
    repeat: virtual.io.loop,
    log: true
  })

  cyre.action({
    id: 'SNAP' + virtual.id,
    type: 'SNAP',
    payload: virtual
  })

  cyre.action({
    id: 'prvSlide' + virtual.id,
    type: 'prvSlide',
    payload: virtual
  })

  cyre.action({
    id: 'nxtSlide' + virtual.id,
    type: 'nxtSlide',
    payload: virtual
  })

  cyre.action({
    id: 'lastSlide' + virtual.id,
    type: 'lastSlide',
    payload: virtual
  })

  cyre.action({
    id: 'firstSlide' + virtual.id,
    type: 'firstSlide',
    payload: virtual
  })

  cyre.action({
    id: 'activate' + virtual.id,
    type: 'activate',
    payload: virtual
  })

  if (virtual.io.enabled) {
    virtual.io.drag
      ? shadow.container.addEventListener('mousedown', e => {
          e.preventDefault()
          Touch._touchStart(e, virtual.id)
        })
      : false

    virtual.io.drag
      ? shadow.container.addEventListener('touchstart', e => {
          e.preventDefault()
          Touch._touchStart(e, virtual.id)
        })
      : false

    virtual.io.wheel
      ? shadow.carousel.addEventListener('wheel', e => {
          Touch.wheeler(e, virtual.id)
        })
      : false

    virtual.io.animate ? cyre.call('Animate' + virtual.id, virtual) : false

    shadow.container.addEventListener(
      //when window resizes do something
      'resize',
      () => {
        cyre.call('refresh carousel', {virtual, shadow})
      },
      false
    )
  }

  cyre.call('refresh carousel', {virtual, shadow})
}
export default ManageIO

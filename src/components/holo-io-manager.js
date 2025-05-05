// src/components/holo-io-manager
import cyre from 'cyre'
import Touch from './holo-touch'
import {wheeler} from './holo-essentials'

/**
 *
 * @param {object} virtual  holo[id].virtual
 * @param {object} shadow  holo[id].shadow
 */

const ManageIO = (virtual, shadow) => {
  if (!virtual) return console.error('@Holo : Major malfunctions')
  cyre.action([
    {
      id: 'Animate' + virtual.id,
      type: virtual.io.animateDirection > 0 ? 'AnimateForward' : 'AnimateBackward',
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
          wheeler(e, virtual.id)
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

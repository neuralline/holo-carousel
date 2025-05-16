// src/components/holo-io-manager
import cyre from 'cyre'
import Touch from './holo-touch'
import {wheeler} from './holo-essentials'

/**
 *
 * @param {object} virtualDom  holo[id].virtual
 * @param {object} Dom  holo[id].shadow
 */

const ManageIO = (virtualDom, Dom) => {
  if (!virtualDom) return console.error('@Holo : Major malfunctions')
  cyre.action([
    {
      id: 'Animate',

      payload: virtualDom,
      interval: 5000,
      repeat: true,
      log: false
    },
    {
      id: 'AnimateBackward',

      payload: virtualDom,
      interval: virtualDom.io.duration,
      repeat: virtualDom.io.loop,
      log: false
    },
    {
      id: 'AnimateForward',

      payload: virtualDom,
      interval: virtualDom.io.duration,
      repeat: virtualDom.io.loop,
      log: false
    },
    {
      id: 'SNAP',

      payload: virtualDom
    },
    {
      id: 'prvSlide',

      payload: virtualDom
    },
    {
      id: 'nxtSlide',

      payload: virtualDom
    },
    {
      id: 'lastSlide',

      payload: virtualDom
    },
    {
      id: 'firstSlide',

      payload: virtualDom
    },
    {
      id: 'activate',

      payload: virtualDom
    }
  ])

  if (virtualDom.io.enabled) {
    virtualDom.io.drag
      ? Dom.container.addEventListener('mousedown', e => {
          e.preventDefault()
          Touch._touchStart(e, virtualDom.id)
        })
      : false

    virtualDom.io.drag
      ? Dom.container.addEventListener('touchstart', e => {
          e.preventDefault()
          Touch._touchStart(e, virtualDom.id)
        })
      : false

    virtualDom.io.wheel
      ? Dom.carousel.addEventListener('wheel', e => {
          wheeler(e, virtualDom.id)
        })
      : false

    virtualDom.io.animate ? cyre.call('Animate', virtualDom) : false

    Dom.container.addEventListener(
      //when window resizes do something
      'resize',
      () => {
        cyre.call('refresh carousel', {virtual: virtualDom, shadow: Dom})
      },
      false
    )
  }

  cyre.call('refresh carousel', {virtual: virtualDom, shadow: Dom})
}
export default ManageIO

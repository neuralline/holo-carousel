// src/components/holo-io-manager
import cyre from 'cyre'
import Touch from './holo-touch'
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

/**
 *
 * @param {object} virtualDom  holo[id].virtual
 * @param {object} Dom  holo[id].shadow
 */

const ManageIO = (virtualDom, Dom) => {
  if (!virtualDom) return console.error('@Holo : Major malfunction!')
  cyre.action([
    {
      id: 'Animate',
      payload: virtualDom,
      interval: 5000,
      repeat: true
    },
    {
      id: 'AnimateBackward',
      payload: virtualDom,
      interval: virtualDom.io.duration,
      repeat: virtualDom.io.loop
    },
    {
      id: 'AnimateForward',
      payload: virtualDom,
      interval: virtualDom.io.duration,
      repeat: virtualDom.io.loop
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

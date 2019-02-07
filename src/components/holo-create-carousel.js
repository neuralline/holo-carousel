/** @format */

import {cyre} from 'cyre'
import Touch from './holo-touch'
import {_holo, ioData} from './holo-essentials'

const holoCreateCarousel = (holoState, io = {}) => {
  if (!holoState) return console.error('@Holo : Major malfunctions')

  if (holoState.io.enabled) {
    holoState.elm.container.addEventListener('mousedown', e => {
      e.preventDefault()
      Touch._touchStart(e, holoState.id)
    })

    holoState.elm.container.addEventListener('touchstart', e => {
      e.preventDefault()
      Touch._touchStart(e, holoState.id)
    })

    holoState.io.wheel
      ? holoState.elm.carousel.addEventListener(
          'wheel',
          e => {
            Touch.wheeler(e, holoState.id)
          },
          false,
        )
      : 0

    holoState.io.animate
      ? cyre.respond(
          'Animate' + holoState.id,
          holoState.io.animate > 0 ? 'AnimateForward' : 'AnimateBackward',
          holoState,
          holoState.io.duration,
          holoState.io.loop,
        )
      : 0
  }

  cyre.action({
    id: 'SNAP' + holoState.id,
    type: 'SNAP',
    payload: holoState,
  })

  cyre.action({
    id: 'prvSlide' + holoState.id,
    type: 'prvSlide',
    payload: holoState,
  })

  cyre.action({
    id: 'nxtSlide' + holoState.id,
    type: 'nxtSlide',
    payload: holoState,
  })

  cyre.action({
    id: 'lastSlide' + holoState.id,
    type: 'lastSlide',
    payload: holoState,
  })

  cyre.action({
    id: 'firstSlide' + holoState.id,
    type: 'firstSlide',
    payload: holoState,
  })

  cyre.action({
    id: 'activate' + holoState.id,
    type: 'activate',
    payload: holoState,
  })
}
export default holoCreateCarousel

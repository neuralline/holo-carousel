//src/components/holo-style.ts

import cyre from 'cyre'
import {holoStore} from '../core/state'
import {EVENTS} from '@/config/holo-config'

/**
 * Apply styles to carousel container
 */
const applyStyle = (id: string, enableTransition: boolean = false): void => {
  const instance = holoStore.getInstance(id)
  if (!instance) {
    cyre.call(EVENTS.ERROR, '@applyStyle: holo instance not found')
    return
  }

  const {Dom, virtualDom} = instance

  if (enableTransition) {
    Dom.container.style.transitionDuration = `${virtualDom.duration}ms`
    Dom.container.style.transitionTimingFunction = virtualDom.transitionTiming
  } else {
    Dom.container.style.transitionDuration = '0ms'
    Dom.container.style.transitionTimingFunction = 'linear'
  }
}

export default applyStyle

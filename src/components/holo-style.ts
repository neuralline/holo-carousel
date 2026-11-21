//src/components/holo-style.ts

import {log} from 'cyre'
import {holoStore} from '../core/state'

/**
 * Apply styles to carousel container
 */
const applyStyle = (id: string, enableTransition: boolean = false): void => {
  const instance = holoStore.getInstance(id)
  if (!instance) {
    log.error('@applyStyle: holo instance not found')
    return
  }

  const {Dom, virtualDom} = instance
  if (!Dom) return

  if (enableTransition) {
    Dom.container.style.transitionDuration = `${virtualDom.duration}ms`
    Dom.container.style.transitionTimingFunction = virtualDom.transitionTiming
  } else {
    Dom.container.style.transitionDuration = '0ms'
    Dom.container.style.transitionTimingFunction = 'linear'
  }
}

export default applyStyle

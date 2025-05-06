//src/components/holo-style.ts

import {HoloShadow} from '../types/interface'

/**
 * Apply styles to carousel container
 * @param shadow - Shadow DOM references
 * @param type - Style type (0: animated, 1: immediate)
 * @param duration - Animation duration in seconds
 */
const Style = (
  shadow: HoloShadow,
  type: number = 0,
  duration: number = 0.3
): void => {
  if (type) {
    shadow.container.style.transitionDuration = '0ms'
    shadow.container.style.transitionTimingFunction = 'linear'
  } else {
    shadow.container.style.transitionDuration = `${duration}s`
    shadow.container.style.transitionTimingFunction = 'linear'
  }
}

export default Style

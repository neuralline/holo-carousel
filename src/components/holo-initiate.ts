//src/components/holo-initiate.ts

import {log} from 'cyre'
import holoCreateElement from './holo-create-element'
import {holoStore} from '../core/state'

/**
 * Initialize all carousels with a specific class name (once each)
 */
const holoInitiate = (carouselName: string): string[] => {
  const carousels = document.getElementsByClassName(carouselName)
  const built: string[] = []

  if (!carousels.length) {
    log.debug('@HOLO: no carousels with class ' + carouselName)
    return built
  }

  for (const element of Array.from(carousels)) {
    const slide = element as HTMLElement
    if (slide.id && holoStore.isAutoInitialized(slide.id)) continue

    const id = holoCreateElement(slide, {})
    if (id) {
      holoStore.markAutoInitialized(id)
      built.push(id)
    }
  }

  return built
}

export default holoInitiate

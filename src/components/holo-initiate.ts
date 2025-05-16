//src/components/holo-initiate.ts

import cyre from 'cyre'
import holoCreateElement from './holo-create-element'
import {EVENTS} from '../config/holo-config'

// Track initialized carousels
const initializedCarousels = new Set<string>()

/**
 * Initialize all carousels with a specific class name
 */
const holoInitiate = (carouselName: string): void => {
  console.log('@holo: auto activated:', carouselName)

  const carousels = document.getElementsByClassName(carouselName)

  if (carousels.length) {
    for (let i = 0; i < carousels.length; i++) {
      const slide = carousels[i] as HTMLElement

      // Skip if already initialized
      if (slide.id && initializedCarousels.has(slide.id)) {
        continue
      }

      const id = holoCreateElement(slide, {})

      // Track initialized carousels
      if (id) {
        initializedCarousels.add(id)
      }
    }
  } else {
    cyre.call(EVENTS.ERROR, '@Holo: carousel structure not found')
  }
}

export default holoInitiate

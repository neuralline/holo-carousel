//src/components/holo-initiate.ts

import {HoloIOOptions} from '../types/interface'
import holoCreateElement from './holo-create-element'

/**
 * Auto-initialize all carousels with the specified class name
 * @param carouselName - Class name to identify carousels
 */
const holoInitiate = (carouselName: string = 'holo-carousel'): void => {
  console.log('@holo holo auto activated:', carouselName)

  const carousels = document.getElementsByClassName(carouselName)

  if (carousels.length) {
    for (let i = 0; i < carousels.length; i++) {
      const slide = carousels[i] as HTMLElement
      holoCreateElement(slide, {} as Partial<HoloIOOptions>)
    }
  } else {
    console.log('@Holo: carousel structure not found')
  }
}

export default holoInitiate

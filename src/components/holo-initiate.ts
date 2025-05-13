//src/components/holo-initiate.ts

import {CyreLog} from 'cyre'
import type {HoloIOOptions} from '../types/interface'
import {holoCreateElement} from './holo-create-element'

/**
 * Auto-initialize all carousels with the specified class name
 * @param carouselName - Class name to identify carousels
 */
export const holoInitiate = (carouselName: string = 'holo-carousel'): void => {
  console.log('@holo holo auto activated:', carouselName)

  // Get all elements with the specified class name
  const carousels = document.getElementsByClassName(carouselName)

  if (carousels.length === 0) {
    console.log('@Holo: carousel structure not found')
    return
  }

  // Initialize each carousel
  Array.from(carousels).forEach(carousel => {
    try {
      const element = carousel as HTMLElement
      holoCreateElement(element, {} as Partial<HoloIOOptions>)
    } catch (error) {
      CyreLog.error('Error auto-initializing carousel:', error)
    }
  })
}

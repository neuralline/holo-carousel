//src/components/holo-create-element.ts

import {CyreLog} from 'cyre'
import type {HoloIOOptions} from '../types/interface'
import {_holo} from '../libs/holo-essentials'
import setupIOManager from './holo-io-manager'
import {createHoloInstance} from '../core/holo-state'

/**
 * Create and initialize a carousel element
 * @param slide - DOM element to convert to carousel
 * @param io - Input/Output options
 */
export const holoCreateElement = (
  slide: HTMLElement,
  io: Partial<HoloIOOptions> = {}
): string | null => {
  if (!slide || !slide.nodeType) {
    console.error('@Holo: Invalid DOM element provided')
    return null
  }

  // Ensure slide has an ID
  if (!slide.id) {
    slide.id = `holo-${Date.now()}`
  }

  try {
    // Create and register the carousel instance
    _holo[slide.id] = createHoloInstance(slide, io)

    console.log('@Holo: Created carousel:', slide.id)

    // Setup event handlers
    setupIOManager(_holo[slide.id].getVirtual, _holo[slide.id].getShadow)

    return slide.id
  } catch (error) {
    console.error('@Holo: Error creating carousel:', error)
    return null
  }
}

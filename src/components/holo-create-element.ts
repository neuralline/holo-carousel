//src/components/holo-create-element.ts

import {HoloIOOptions} from '../types/interface'
import {_holo} from '../libs/holo-essentials'
import ManageIO from './holo-io-manager'
import {createHoloInstance} from '../core/holo-state'

/**
 * Create and initialize a carousel element
 * @param slide - DOM element to convert to carousel
 * @param io - Input/Output options
 */
const holoCreateElement = (
  slide: HTMLElement,
  io: Partial<HoloIOOptions> = {}
): void => {
  // Create and register the carousel instance
  _holo[slide.id] = createHoloInstance(slide, io)

  // Setup event handlers
  ManageIO(_holo[slide.id].getVirtual, _holo[slide.id].getShadow)
}

export default holoCreateElement

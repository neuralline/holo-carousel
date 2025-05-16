//src/components/holo-create-element.ts

import {holoStore} from '../core/state'
import {setupEventHandlers} from './holo-io-manager'
import {HoloIOOptions} from '../types/interface'

/**
 * Create a carousel instance
 */
const holoCreateElement = (
  slide: HTMLElement,
  options: Partial<HoloIOOptions> = {}
): string => {
  if (!slide) {
    console.error('@Holo: Cannot create carousel from invalid element')
    return ''
  }

  // Generate ID if not provided
  const id = slide.id || `holo-${Date.now()}`

  // Find container element
  const container = slide.getElementsByClassName(
    'holo-container'
  )[0] as HTMLElement

  if (!container) {
    console.error('@Holo: holo-container not found:', id)
    return ''
  }

  // Register carousel in store
  holoStore.registerInstance(id, {carousel: slide, container}, options)

  // Setup event handlers
  setupEventHandlers(id)

  return id
}

export default holoCreateElement

//src/components/holo-create-element.ts

import {holoStore} from '../core/state'
import {setupEventHandlers} from './holo-io-manager'
import {HoloIOOptions} from '../types/interface'
import cyre from 'cyre'
import {EVENTS} from '../config/holo-config'

/**
 * Create a carousel instance
 */
const holoCreateElement = (
  slide: HTMLElement,
  options: Partial<HoloIOOptions> = {}
): string => {
  if (!slide) {
    cyre.call(
      EVENTS.ERROR,
      '@Holo: Cannot create carousel from invalid element'
    )
    return ''
  }

  // Generate ID if not provided
  const id = slide.id || `holo-${Date.now()}`

  // Find container element
  const container = slide.getElementsByClassName(
    'holo-container'
  )[0] as HTMLElement

  if (!container) {
    cyre.call(EVENTS.ERROR, '@Holo: holo-container not found: ' + id)
    return ''
  }

  // Register carousel in store
  holoStore.registerInstance(id, {carousel: slide, container}, options)

  // Setup event handlers
  setupEventHandlers(id)

  return id
}

export default holoCreateElement

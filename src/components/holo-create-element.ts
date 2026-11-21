//src/components/holo-create-element.ts

import {log} from 'cyre'
import {holoStore} from '../core/state'
import {setupEventHandlers} from './holo-io-manager'
import {readDataOptions} from './holo-essentials'
import {HoloIOOptions} from '../types/interface'
import {initializeGlobalEvents} from '../core/event-manager'
import {CSS_CLASSES, DATA_OPTIONS} from '../config/holo-config'

/**
 * Create a carousel instance. Options come from, in order: the defaults,
 * the element's data-* attributes, then `options`.
 */
const holoCreateElement = (
  slide: HTMLElement,
  options: Partial<HoloIOOptions> = {}
): string => {
  if (!slide) {
    log.error(
      '@HOLO create element: Cannot create carousel from invalid element'
    )
    return ''
  }

  // a carousel without an id gets one, so AUTO and the API can find it
  if (!slide.id) slide.id = holoStore.nextId()
  const id = slide.id

  // Find container element
  const container = slide.getElementsByClassName(
    CSS_CLASSES.CONTAINER
  )[0] as HTMLElement

  if (!container) {
    log.error('@HOLO create element: holo-container not found: ' + id)
    return ''
  }

  // building the same element again replaces the old instance
  if (holoStore.hasInstance(id)) holoStore.removeInstance(id)

  // Each carousel gets its own Cyre branch (holo/<id>), so carousels
  // never collide on the same local channel ids - see event-manager.ts.
  const root = initializeGlobalEvents()
  const branch = root && root.branch(id.replace(/[/\\]/g, '-'))
  if (!branch) {
    log.error('@HOLO create element: failed to create Cyre branch for: ' + id)
    return ''
  }

  const io = {
    ...readDataOptions(slide, DATA_OPTIONS),
    ...options
  } as Partial<HoloIOOptions>

  // Register carousel in store
  holoStore.registerInstance(id, {carousel: slide, container}, io, branch)

  // Setup event handlers
  setupEventHandlers(id)

  return id
}

export default holoCreateElement

//src/components/accordion-create-element.ts

import {log} from 'cyre'
import {accordionStore} from '../core/accordion-state'
import {
  initializeAccordionChannels,
  initializeAccordionGlobalEvents
} from '../core/accordion-event-manager'
import {setupAccordionHandlers} from './accordion-io-manager'
import {renderAccordion} from './accordion-essentials'
import {AccordionIOOptions, AccordionItemState} from '../types/interface'
import {ACCORDION_DEFAULT_IO} from '../config/accordion-config'

/**
 * Create an accordion instance. Expects:
 *   <div class="holo-accordion" id="...">
 *     <div class="accordion-item">
 *       <div class="accordion-header">...</div>
 *       <div class="accordion-panel">...</div>
 *     </div>
 *     ...
 *   </div>
 */
const accordionCreateElement = (
  root: HTMLElement,
  options: Partial<AccordionIOOptions> = {}
): string => {
  if (!root) {
    log.error(
      '@ACCORDION create element: Cannot create accordion from invalid element'
    )
    return ''
  }

  if (!root.id) root.id = accordionStore.nextId()
  const id = root.id

  const itemEls = Array.from(
    root.getElementsByClassName('accordion-item')
  ) as HTMLElement[]

  if (!itemEls.length) {
    log.error('@ACCORDION create element: accordion-item not found: ' + id)
    return ''
  }

  const items: AccordionItemState[] = itemEls.map((itemEl, index) => {
    const header = itemEl.getElementsByClassName(
      'accordion-header'
    )[0] as HTMLElement
    const panel = itemEl.getElementsByClassName(
      'accordion-panel'
    )[0] as HTMLElement

    return {id: `${id}-item-${index}`, header, panel, open: false}
  })

  if (items.some(item => !item.header || !item.panel)) {
    log.error(
      '@ACCORDION create element: accordion-header/accordion-panel not found: ' +
        id
    )
    return ''
  }

  // Same isolation as Holo's carousels: each accordion gets its own Cyre
  // branch so instances never collide on shared local channel names - see
  // core/accordion-event-manager.ts.
  if (accordionStore.getInstance(id)) accordionStore.removeInstance(id)
  const parent = initializeAccordionGlobalEvents()
  const branch = parent && parent.branch(id.replace(/[/\\]/g, '-'))
  if (!branch) {
    log.error(
      '@ACCORDION create element: failed to create Cyre branch for: ' + id
    )
    return ''
  }

  const io: AccordionIOOptions = {
    id,
    ...ACCORDION_DEFAULT_IO,
    ...options
  }

  if (io.startOpen >= 0 && items[io.startOpen]) {
    items[io.startOpen].open = true
  }

  accordionStore.registerInstance(id, root, items, io, branch)

  initializeAccordionChannels(branch, id)
  accordionStore.setCleanup(id, setupAccordionHandlers(id))
  renderAccordion(id)

  return id
}

export default accordionCreateElement

//src/components/accordion-io-manager.ts

import {log} from 'cyre'
import {accordionStore} from '../core/accordion-state'
import {ACCORDION_EVENTS} from '../config/accordion-config'

/**
 * Wire up each item's header - click and keyboard (Enter/Space, since
 * headers are given role="button") both dispatch through this instance's
 * own branch, same as Holo routing every navigation action through Cyre
 * rather than mutating the DOM straight from the listener.
 */
export const setupAccordionHandlers = (id: string): (() => void) => {
  const instance = accordionStore.getInstance(id)
  if (!instance) {
    log.error(
      '@ACCORDION: cannot setup handlers for missing accordion: ' + id
    )
    return () => {}
  }

  const {branch, items, io} = instance
  if (!io.enabled) return () => {}

  const cleanupFns: Array<() => void> = []

  items.forEach((item, index) => {
    const handleClick = () => {
      branch.call(ACCORDION_EVENTS.TOGGLE, {index})
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        branch.call(ACCORDION_EVENTS.TOGGLE, {index})
      }
    }

    item.header.setAttribute('role', 'button')
    item.header.setAttribute('tabindex', '0')
    item.header.addEventListener('click', handleClick)
    item.header.addEventListener('keydown', handleKey)

    cleanupFns.push(() => {
      item.header.removeEventListener('click', handleClick)
      item.header.removeEventListener('keydown', handleKey)
    })
  })

  return () => cleanupFns.forEach(fn => fn())
}

//src/accordion.ts

'use strict'

/*
    Neural Line
    Reactive accordion
    Same branch-per-instance structure as Holo (see app.ts) - a new
    component family sharing Cyre, not a fork of Holo's own code.
*/

import {accordionStore} from './core/accordion-state'
import accordionCreateElement from './components/accordion-create-element'
import {AccordionIOOptions} from './types/interface'
import {
  ACCORDION_EVENTS,
  ACCORDION_REFRESH_SCREEN
} from './config/accordion-config'
import {initializeAccordionGlobalEvents} from './core/accordion-event-manager'

// Cyre belongs to the app (Cyre.init() at its entry). Accordion only adds
// its own branch, accordion/<id> per instance - see
// core/accordion-event-manager.ts.

const Accordion = (() => {
  const _auto = (className: string): void => {
    const roots = document.getElementsByClassName(className)

    if (!roots.length) {
      console.log('@Accordion: no elements found for class ' + className)
      return
    }

    for (let i = 0; i < roots.length; i++) {
      const el = roots[i] as HTMLElement
      if (el.id && accordionStore.isAutoInitialized(el.id)) continue

      const id = accordionCreateElement(el, {})
      if (id) accordionStore.markAutoInitialized(id)
    }
  }

  /**
   * Initialize Accordion. Only once per page - if you need per-instance
   * options (multiple/duration/startOpen), call Accordion.BUILD(el, opts)
   * directly instead: the AUTO scan behind INIT always calls
   * accordionCreateElement with {}, same limitation as Holo.AUTO.
   */
  const init = (accordionClassName = 'holo-accordion'): void => {
    if (accordionStore.getRoot()) {
      _auto(accordionClassName)
      return
    }

    console.log(
      '%c ACCORDION - Initiating ',
      'background: #022d5f; color: white; display: block;'
    )

    const root = initializeAccordionGlobalEvents()
    if (!root) return

    window.addEventListener('resize', () => root.call(ACCORDION_REFRESH_SCREEN))

    _auto(accordionClassName)
  }

  const _toggle = (id: string, index: number): boolean => {
    const instance = accordionStore.getInstance(id)
    if (!instance) return false
    instance.branch.call(ACCORDION_EVENTS.TOGGLE, {index})
    return true
  }

  const _open = (id: string, index: number): boolean => {
    const instance = accordionStore.getInstance(id)
    if (!instance) return false
    instance.branch.call(ACCORDION_EVENTS.OPEN, {index})
    return true
  }

  const _close = (id: string, index: number): boolean => {
    const instance = accordionStore.getInstance(id)
    if (!instance) return false
    instance.branch.call(ACCORDION_EVENTS.CLOSE, {index})
    return true
  }

  const _openAll = (id: string): boolean => {
    const instance = accordionStore.getInstance(id)
    if (!instance) return false
    instance.branch.call(ACCORDION_EVENTS.OPEN_ALL)
    return true
  }

  const _closeAll = (id: string): boolean => {
    const instance = accordionStore.getInstance(id)
    if (!instance) return false
    instance.branch.call(ACCORDION_EVENTS.CLOSE_ALL)
    return true
  }

  /**
   * Subscribe to one accordion's own Cyre channel, e.g.
   * Accordion.on('faq', Accordion.EVENTS.TOGGLE, payload => ...) - same
   * shape as Holo.on.
   */
  const _on = (
    id: string,
    eventId: string,
    handler: (...args: any[]) => any
  ) => {
    return accordionStore.getBranch(id)?.on(eventId, handler)
  }

  return {
    INIT: init,
    BUILD: (root: HTMLElement, options: Partial<AccordionIOOptions> = {}) =>
      accordionCreateElement(root, options),
    AUTO: _auto,

    // Local event ids used by every accordion instance's own branch.
    EVENTS: ACCORDION_EVENTS,

    toggle: _toggle,
    open: _open,
    close: _close,
    openAll: _openAll,
    closeAll: _closeAll,

    on: _on,

    // Tear down a single accordion - destroys its branch and every
    // channel registered on it, and drops it from the store.
    remove: (id: string) => accordionStore.removeInstance(id)
  }
})()

export default Accordion

// Also expose to window for UMD/browser usage - same technique app.ts uses
// for window.Holo, since the UMD wrapper's own global name isn't what the
// public API is accessed through.
if (typeof window !== 'undefined') {
  ;(window as any).Accordion = Accordion
}

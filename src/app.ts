//src/app.ts
'use strict'
//Project HOLO-CAROUSEL 2019

// jscs:enabled
// @flow
// @ts-check

/*
    Neural Line
    Reactive carousel
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import {Cyre, cyre, useLog, LogLevel, log} from 'cyre'
import {useMetrics} from 'cyre/metrics'
import {holoStore} from './core/state'
import holoCreateElement from './components/holo-create-element'
import holoInitiate from './components/holo-initiate'
import Touch from './components/holo-touch'
import {HoloChange, HoloIOOptions} from './types/interface'
import {CSS_CLASSES, EVENTS} from './config/holo-config'
import {
  CyreNode,
  initializeGlobalEvents,
  setHold
} from './core/event-manager'
import {changeOf, goTo} from './components/holo-essentials'

export const HOLO_VERSION = '3.0.0'

// Set by the UMD build (vite.config.ts / scripts): that bundle carries
// its own copy of Cyre, so it starts it. The ES and CJS builds share the
// app's Cyre and never take ownership of it.
declare const __HOLO_STANDALONE__: boolean | undefined
const standalone =
  typeof __HOLO_STANDALONE__ !== 'undefined' && __HOLO_STANDALONE__
if (standalone) Cyre.init()

export interface HoloInitOptions {
  /** class the AUTO scan looks for (default holo-carousel) */
  className?: string
  /** node to put the holo branch under (default: root cyre) */
  cyre?: CyreNode
}

// Holo Carousel module
const Holo = (() => {
  /**
   * Page-wide setup, once: the holo branch, pointer listeners and the
   * window resize / load refresh. BUILD runs it too, so INIT is optional.
   */
  const ensureSystem = (parent?: CyreNode): boolean => {
    const system = holoStore.getSystem()
    if (system.initialized) return true

    const root = initializeGlobalEvents(parent)
    if (!root) return false

    const refresh = () => root.call(EVENTS.REFRESH_SCREEN)
    const touchCleanup = Touch.setupGlobalTouchListeners()
    window.addEventListener('resize', refresh)
    window.addEventListener('load', refresh)

    holoStore.updateSystem({
      initialized: true,
      cleanup: () => {
        touchCleanup()
        window.removeEventListener('resize', refresh)
        window.removeEventListener('load', refresh)
      }
    })
    return true
  }

  const build = (
    element: HTMLElement,
    options: Partial<HoloIOOptions> = {}
  ): string => (ensureSystem() ? holoCreateElement(element, options) : '')

  /**
   * Update carousel options (rebuilds the carousel in place, keeping
   * its position)
   */
  const _carousel = (
    id: string,
    io: Partial<HoloIOOptions> = {}
  ): {ok: boolean; data: HoloIOOptions} => {
    const instance = holoStore.getInstance(id)
    if (!instance) {
      return {ok: false, data: {} as HoloIOOptions}
    }

    const current = instance.virtualDom.io
    const next: Partial<HoloIOOptions> = {...current}
    for (const attribute in io) {
      if (attribute in current) {
        ;(next as any)[attribute] = (io as any)[attribute]
      } else {
        log.warn('@Holo: unknown carousel option ' + attribute)
      }
    }

    const index = instance.virtualDom.index
    const element = instance.Dom.carousel
    const auto = holoStore.isAutoInitialized(id)
    build(element, next)
    if (auto) holoStore.markAutoInitialized(id)
    goTo(id, index, false)

    return {ok: true, data: {...holoStore.getVirtualDom(id)!.io}}
  }

  /**
   * Programmatically navigate a carousel - through its own channels, so
   * Holo.on(id, ...) subscribers see it like a swipe or a key press.
   */
  const _navigate = (
    id: string,
    direction: 'next' | 'prev' | 'first' | 'last'
  ): boolean => {
    const branch = holoStore.getBranch(id)
    if (!branch) return false

    const eventByDirection = {
      next: EVENTS.NEXT_SLIDE,
      prev: EVENTS.PREV_SLIDE,
      first: EVENTS.FIRST_SLIDE,
      last: EVENTS.LAST_SLIDE
    } as const

    branch.call(eventByDirection[direction])
    return true
  }

  /**
   * Subscribe to one carousel's own channel, e.g.
   * Holo.on('my-carousel', Holo.EVENTS.CHANGE, ({index, page}) => ...)
   */
  const _on = (
    id: string,
    eventId: string,
    handler: (...args: any[]) => any
  ) => holoStore.getBranch(id)?.on(eventId, handler)

  /**
   * Initialize Holo: page-wide setup plus the AUTO scan
   */
  const init = (options: string | HoloInitOptions = {}) => {
    const {className = CSS_CLASSES.CAROUSEL, cyre: parent} =
      typeof options === 'string' ? {className: options} : options

    if (holoStore.getSystem().initialized) {
      log.debug('@Holo: Already initialized')
      return holoInitiate(className)
    }

    console.log(
      `%c HOLO - Initiating holo v${HOLO_VERSION} `,
      'background: #022d5f; color: white; display: block;'
    )

    if (!ensureSystem(parent)) return []
    return holoInitiate(className)
  }

  // Public API
  return {
    VERSION: HOLO_VERSION,
    TOUCH: Touch,
    INIT: init,
    BUILD: build,
    AUTO: (className = CSS_CLASSES.CAROUSEL) =>
      ensureSystem() ? holoInitiate(className) : [],
    carousel: _carousel,
    refresh: () => holoStore.getSystem().root?.call(EVENTS.REFRESH_SCREEN),
    dimensions: (id: string) => holoStore.getDimensions(id),

    // Local channel ids every carousel's own branch uses
    EVENTS,

    // Navigation
    next: (id: string) => _navigate(id, 'next'),
    prev: (id: string) => _navigate(id, 'prev'),
    first: (id: string) => _navigate(id, 'first'),
    last: (id: string) => _navigate(id, 'last'),
    goTo: (id: string, index: number, animate = true): boolean => {
      const branch = holoStore.getBranch(id)
      if (!branch) return false
      branch.call(EVENTS.GO_TO, {index, animate})
      return true
    },

    /** where a carousel is: index, page, pages, count, slots, ends */
    state: (id: string): HoloChange | undefined => {
      const virtualDom = holoStore.getVirtualDom(id)
      return virtualDom && changeOf(virtualDom)
    },

    // Auto-play
    pause: (id: string) => setHold(id, 'user', true),
    play: (id: string) => setHold(id, 'user', false),

    // Subscribe to a specific carousel's own events
    on: _on,

    // Tear down a single carousel: its listeners, observers, branch and
    // every channel on it
    remove: (id: string) => holoStore.removeInstance(id),

    // Tear down everything Holo set up on the page
    cleanup: () => {
      const instances = holoStore.getAllInstances()
      for (const id in instances) holoStore.removeInstance(id)
      const system = holoStore.getSystem()
      system.cleanup()
      system.root?.destroy()
      holoStore.resetSystem()
    }
  }
})()

// Export for module use
export default Holo

// Also expose to window for UMD/browser usage
if (typeof window !== 'undefined') {
  ;(window as any).Holo = Holo

  // The standalone bundle's own Cyre, for pages that want its telemetry
  // (useMetrics, the sensor's log stream). Apps using the ES build import
  // cyre themselves.
  if (standalone) {
    ;(window as any).Cyre = {Cyre, cyre, useLog, useMetrics, LogLevel, log}
  }
}

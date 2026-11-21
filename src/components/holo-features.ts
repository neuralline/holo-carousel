//src/components/holo-features.ts

/*
    Neural Line
    Reactive carousel - features
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import {log} from 'cyre'
import {holoStore} from '../core/state'
import {CSS_CLASSES, EVENTS, FEATURE_OPTIONS} from '../config/holo-config'
import {HoloChange, HoloIOOptions} from '../types/interface'
import {breakpointFor, reveal, wrapIndex} from './holo-essentials'
import {watchImages} from './holo-render'

/*
  Features that sit on top of a carousel's channels: links between
  carousels, breakpoints, lazy images and the position in the URL. Each
  one only listens to `change` or calls `go-to`, so it works for every
  effect and for carousels in different Holo instances alike.
*/

// --- links -------------------------------------------------------------

export type LinkMode = 'sync' | 'follow'

/**
 * Link two carousels.
 *
 * - sync: both show the same item; moving either moves the other.
 * - follow: `b` follows `a` - typically thumbnails. `a`'s current item
 *   is marked (holo-current) and kept in view in `b`; clicking an item
 *   in `b` moves `a` to it.
 *
 * Returns a function that removes the link. Removing either carousel
 * removes it too.
 */
export const link = (a: string, b: string, mode: LinkMode = 'sync'): (() => void) => {
  const first = holoStore.getInstance(a)
  const second = holoStore.getInstance(b)
  if (!first || !second) {
    log.error(`@HOLO link: unknown carousel ${!first ? a : b}`)
    return () => false
  }

  const unsubscribes: Array<() => unknown> = []
  const listen = (path: string, handler: (change: HoloChange) => void) => {
    const result = holoStore.getBranch(path)?.on(EVENTS.CHANGE, handler)
    if (result?.unsubscribe) unsubscribes.push(result.unsubscribe)
  }

  if (mode === 'sync') {
    listen(a, ({index}) => {
      if (holoStore.getVirtualDom(b)?.index !== index) second.branch.call(EVENTS.GO_TO, {index})
    })
    listen(b, ({index}) => {
      if (holoStore.getVirtualDom(a)?.index !== index) first.branch.call(EVENTS.GO_TO, {index})
    })
  } else {
    const mark = (index: number) => {
      const container = holoStore.getDom(b)?.container
      if (!container) return
      for (const slot of Array.from(container.children) as HTMLElement[]) {
        const at = slot.dataset.index !== undefined ? Number(slot.dataset.index) : -1
        slot.classList.toggle(CSS_CLASSES.CURRENT, at === index)
      }
    }
    // index the follower's slots so marks and clicks can find them
    const container = holoStore.getDom(b)?.container
    if (container && !second.data) {
      Array.from(container.children).forEach((slot, i) => {
        ;(slot as HTMLElement).dataset.index = String(i)
      })
    }
    listen(a, ({index}) => {
      mark(index)
      reveal(b, index)
    })
    listen(b, () => mark(holoStore.getVirtualDom(a)?.index ?? 0))
    const followerActivate = second.branch.on(EVENTS.ACTIVATE, (target: HTMLElement | number) => {
      const index =
        typeof target === 'number'
          ? target
          : Number((Array.isArray(target) ? target[0] : target)?.dataset?.index ?? -1)
      if (index >= 0) first.branch.call(EVENTS.GO_TO, {index})
    })
    if (followerActivate.unsubscribe) unsubscribes.push(followerActivate.unsubscribe)
    mark(first.virtualDom.index)
  }

  const unlink = () => {
    unsubscribes.splice(0).forEach(fn => fn())
    return true
  }
  holoStore.addLink(a, unlink)
  holoStore.addLink(b, unlink)
  return unlink
}

// --- breakpoints -------------------------------------------------------

/**
 * Apply the breakpoint for the carousel's current width. Returns true
 * when an option that changes listeners or controls changed, so the
 * caller sets the features up again.
 */
export const applyBreakpoint = (path: string): boolean => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom || !instance.breakpoints.length) return false
  const parent = instance.Dom.carousel.parentElement
  const width = parent ? parent.clientWidth : window.innerWidth
  const point = breakpointFor(instance.breakpoints, width)
  if (point === instance.breakpoint) return false

  // the base options, then every breakpoint up to this one
  const next: HoloIOOptions = {...instance.baseIo}
  for (const [min, options] of instance.breakpoints) {
    if (min <= point) Object.assign(next, options)
  }
  const before = instance.virtualDom.io
  const featuresChanged = FEATURE_OPTIONS.some(
    name => (before as any)[name] !== (next as any)[name]
  )
  holoStore.updateInstance(path, {breakpoint: point})
  holoStore.updateVirtualDom(path, {io: next})
  return featuresChanged
}

// --- lazy images -------------------------------------------------------

/**
 * Load data-src / data-srcset images in the visible items and the next
 * `lazy` pages either side, before they come into view.
 */
export const lazyLoad = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom || !instance.virtualDom.io.lazy) return
  const {virtualDom, Dom} = instance
  const count = virtualDom.noOfChildren
  const reach = virtualDom.numberOfSlots * (1 + virtualDom.io.lazy)
  const near = (index: number): boolean => {
    const ahead = virtualDom.wrap
      ? Math.min(wrapIndex(index - virtualDom.index, count), wrapIndex(virtualDom.index - index, count))
      : index - virtualDom.index
    return virtualDom.wrap ? ahead <= reach : ahead >= -virtualDom.numberOfSlots * virtualDom.io.lazy && ahead < reach
  }

  Array.from(Dom.container.children).forEach((slot, i) => {
    const element = slot as HTMLElement
    const index = element.dataset.index !== undefined ? Number(element.dataset.index) : i
    if (!near(index)) return
    const waiting = element.querySelectorAll<HTMLImageElement | HTMLSourceElement>('[data-src],[data-srcset]')
    if (!waiting.length) return
    waiting.forEach(media => {
      if (media.dataset.src) {
        media.setAttribute('src', media.dataset.src)
        delete media.dataset.src
      }
      if (media.dataset.srcset) {
        media.setAttribute('srcset', media.dataset.srcset)
        delete media.dataset.srcset
      }
    })
    watchImages(element) // placeholder until they arrive
  })
}

// --- the position in the URL ------------------------------------------

const readHash = (): URLSearchParams =>
  new URLSearchParams(typeof location !== 'undefined' ? location.hash.slice(1) : '')

/** the index the URL asks for, or -1 */
export const hashIndex = (name: string): number => {
  const value = readHash().get(name)
  const index = value === null ? NaN : Number(value)
  return Number.isInteger(index) && index >= 0 ? index : -1
}

/** write a carousel's index into the URL (#<name>=<index>), no history entry */
export const writeHash = (name: string, index: number): void => {
  if (typeof history === 'undefined') return
  const params = readHash()
  if (params.get(name) === String(index)) return
  params.set(name, String(index))
  history.replaceState(history.state, '', `#${params.toString()}`)
}

//src/components/holo-io-manager.ts

import {log} from 'cyre'
import {holoStore} from '../core/state'
import Touch, {nearestCarousel} from './holo-touch'
import {CSS_CLASSES, EVENTS, PATH_ATTRIBUTE} from '../config/holo-config'
import {HoloIOOptions, HoloOptions} from '../types/interface'
import {
  autoplayInterval,
  initializeCarouselChannels,
  refreshCarousel,
  setHold,
  startAutoplay,
  stopAutoplay
} from '../core/event-manager'
import {isStaticEffect, keysOf, normalizeBreakpoints, normalizeOptions, pageTarget, setTrack} from './holo-essentials'
import {isRtlCarousel, measureCarousel, stopMove, watchImages, watchRoom} from './holo-render'
import {applyGestureOptions} from './holo-tune'
import {applyBreakpoint, hashIndex, lazyLoad, writeHash} from './holo-features'
import {routeChanged, routeReady} from './holo-router'
import {groupMorphTargets, groupsOf, laneOptionsOf} from './holo-groups'
import {setupZoom} from './holo-zoom'

type Cleanup = () => void

const listen = (
  target: EventTarget,
  type: string,
  handler: (e: any) => void,
  options?: AddEventListenerOptions | boolean
): Cleanup => {
  target.addEventListener(type, handler, options)
  return () => target.removeEventListener(type, handler, options)
}

const button = (className: string, label: string, text: string) => {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = className
  el.setAttribute('aria-label', label)
  el.textContent = text
  return el
}

/** is this event for this carousel (not one nested inside it) */
const mine = (path: string, e: Event): boolean => nearestCarousel(e.target) === path

/**
 * Prev / next buttons, a dot per page and, with auto-play, a pause
 * button (WCAG 2.2.2) - built inside the carousel element.
 */
const buildControls = (path: string): Cleanup => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom) return () => {}
  const {Dom, branch, virtualDom} = instance
  const vertical = !!virtualDom.io.orientation

  const root = document.createElement('div')
  root.className = CSS_CLASSES.CONTROLS
  // rtl: previous is on the right, pointing right
  const rtl = !vertical && isRtlCarousel(Dom.carousel, virtualDom.io.direction)
  const prev = button(CSS_CLASSES.PREV, 'Previous', vertical ? '↑' : rtl ? '›' : '‹')
  const next = button(CSS_CLASSES.NEXT, 'Next', vertical ? '↓' : rtl ? '‹' : '›')
  const dots = document.createElement('div')
  dots.className = CSS_CLASSES.DOTS
  root.append(prev, dots, next)

  let play: HTMLButtonElement | undefined
  if (virtualDom.io.animate) {
    const paused = !!instance.hold.user
    play = button(CSS_CLASSES.PLAY, paused ? 'Play' : 'Pause', '')
    play.setAttribute('aria-pressed', String(paused))
    play.dataset.state = paused ? 'paused' : 'playing'
    root.appendChild(play)
  }

  Dom.carousel.appendChild(root)
  holoStore.updateDom(path, {controls: {root, prev, next, dots, play}})

  const cleanups = [
    listen(prev, 'click', () => branch.call(EVENTS.PREV_SLIDE)),
    listen(next, 'click', () => branch.call(EVENTS.NEXT_SLIDE)),
    listen(dots, 'click', (e: MouseEvent) => {
      const dot = (e.target as HTMLElement).closest(`.${CSS_CLASSES.DOT}`) as HTMLElement | null
      const vd = holoStore.getVirtualDom(path)
      if (!dot || !vd) return
      branch.call(EVENTS.GO_TO, {
        index: pageTarget(Number(dot.dataset.page), vd.maxIndex, vd.step, vd.wrap)
      })
    })
  ]
  if (play) {
    cleanups.push(
      listen(play, 'click', () => {
        const paused = !!holoStore.getInstance(path)?.hold.user
        setHold(path, 'user', !paused)
      })
    )
  }

  return () => {
    cleanups.forEach(fn => fn())
    root.remove()
    holoStore.updateDom(path, {controls: undefined})
  }
}

/**
 * A bar that fills up to the next auto-play move. It restarts on every
 * move and stops while auto-play is held (CSS, via .holo-paused).
 */
const buildProgress = (path: string): Cleanup => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom) return () => {}
  const bar = document.createElement('div')
  bar.className = CSS_CLASSES.PROGRESS
  bar.setAttribute('aria-hidden', 'true')
  bar.appendChild(document.createElement('span'))
  instance.Dom.carousel.appendChild(bar)
  const restart = () => {
    const fill = bar.firstElementChild as HTMLElement
    bar.style.setProperty('--holo-progress-duration', `${autoplayInterval(path)}ms`)
    fill.style.animation = 'none'
    void fill.offsetWidth // restart the animation
    fill.style.animation = ''
  }
  restart()
  const unsubscribe = instance.branch.on(EVENTS.CHANGE, restart).unsubscribe
  return () => {
    unsubscribe?.()
    bar.remove()
  }
}

/** region role, a label, a way to focus it */
const applyA11y = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom) return
  const {Dom, virtualDom} = instance
  const {carousel, container} = Dom

  carousel.setAttribute(PATH_ATTRIBUTE, path)
  carousel.classList.add(CSS_CLASSES.CAROUSEL)
  carousel.setAttribute('role', 'region')
  carousel.setAttribute('aria-roledescription', carousel.dataset.holoPreset || 'carousel')
  if (!carousel.hasAttribute('aria-label') && !carousel.hasAttribute('aria-labelledby')) {
    carousel.setAttribute('aria-label', carousel.dataset.title || 'Carousel')
  }
  if (virtualDom.io.keyboard && !carousel.hasAttribute('tabindex')) {
    carousel.setAttribute('tabindex', '0')
  }
  carousel.dataset.effect = virtualDom.io.effect
  carousel.dataset.placeholder = virtualDom.io.placeholder || 'shimmer'
  carousel.toggleAttribute('data-builds', !!virtualDom.io.builds)
  if (instance.data?.loading) carousel.setAttribute('aria-busy', 'true')
  // announce moves made by the user, not by auto-play
  container.setAttribute('aria-live', virtualDom.io.animate ? 'off' : 'polite')
}

const KEYS: Record<string, string> = {
  ' ': EVENTS.NEXT_SLIDE, // presenting: space and enter go on
  Enter: EVENTS.NEXT_SLIDE,
  Home: EVENTS.FIRST_SLIDE,
  End: EVENTS.LAST_SLIDE,
  PageUp: EVENTS.PREV_SLIDE,
  PageDown: EVENTS.NEXT_SLIDE
}

/**
 * The listeners, controls and observers a carousel's options ask for.
 * Run again (after the returned cleanup) when a breakpoint changes them.
 */
export const setupFeatures = (path: string): Cleanup => {
  const instance = holoStore.getInstance(path)
  if (!instance?.Dom) return () => {}
  const {Dom, branch} = instance
  const io = instance.virtualDom.io
  const cleanups: Cleanup[] = []
  applyA11y(path)

  // grid / list: nothing to drag, wheel or page through (3.5); a grouped carousel's lanes move, not it (3.6)
  const still = isStaticEffect(io.effect) || !!groupsOf(instance)

  if (io.enabled) {
    // drag / swipe
    if (!still && (io.drag || io.swipe)) {
      cleanups.push(
        // the whole carousel takes drags - a ring or a centred strip has
        // empty space either side, and a swipe may start on a button (a
        // tap that does not move is still a click)
        listen(Dom.carousel, 'pointerdown', (e: PointerEvent) => Touch._touchStart(e, path)),
        listen(Dom.container, 'dragstart', (e: DragEvent) => e.preventDefault())
      )
    }

    // clicks right after a drag or a long press are swallowed (anywhere
    // in the carousel - a drag can end over a button)
    cleanups.push(
      listen(
        Dom.carousel,
        'click',
        (e: MouseEvent) => {
          const current = holoStore.getInstance(path)
          if (current && performance.now() < current.touchState.suppressUntil) {
            e.preventDefault()
            e.stopPropagation()
          }
        },
        true
      ),
      // a real click on an item focuses it (only this carousel's items)
      listen(Dom.container, 'click', (e: MouseEvent) => {
        const current = holoStore.getInstance(path)
        if (!current || !mine(path, e)) return
        if (current.virtualDom.io.focus && current.virtualDom.io.onClick) Touch._focus(e, path)
      })
    )

    // trackpad swipes and the mouse wheel; what isn't the carousel's
    // bubbles on (to a parent carousel, then the page)
    if (!still) {
      cleanups.push(
        listen(Dom.carousel, 'wheel', (e: WheelEvent) => Touch._wheel(e, path), {passive: false})
      )
    }

    // keyboard: only the nearest carousel to the focus answers
    if (io.keyboard && !still) {
      cleanups.push(
        listen(Dom.carousel, 'keydown', (e: KeyboardEvent) => {
          if (e.defaultPrevented || !mine(path, e)) return
          if (e.target !== Dom.carousel && (e.target as HTMLElement).closest('button, input, textarea, select')) {
            return
          }
          const now = holoStore.getVirtualDom(path)
          const vertical = !!now?.io.orientation
          const rtl = !vertical && !!now?.rtl
          const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
          const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
          const channel =
            e.key === back ? EVENTS.PREV_SLIDE : e.key === forward ? EVENTS.NEXT_SLIDE : KEYS[e.key]
          if (!channel) return
          e.preventDefault()
          branch.call(channel)
        })
      )
    }

    if (io.controller) cleanups.push(buildControls(path))
    if (io.pinchZoom && !still) cleanups.push(setupZoom(path))
    if (io.progress && io.animate) cleanups.push(buildProgress(path))

    // auto-play, held while someone is looking at or using the carousel,
    // while the tab is hidden and while it is off screen
    if (io.animate) {
      cleanups.push(
        listen(Dom.carousel, 'pointerenter', (e: PointerEvent) => {
          if (e.pointerType === 'mouse') setHold(path, 'hover', true)
        }),
        listen(Dom.carousel, 'pointerleave', () => setHold(path, 'hover', false)),
        listen(Dom.carousel, 'focusin', () => setHold(path, 'focus', true)),
        listen(Dom.carousel, 'focusout', (e: FocusEvent) => {
          if (!Dom.carousel.contains(e.relatedTarget as Node)) setHold(path, 'focus', false)
        }),
        listen(document, 'visibilitychange', () =>
          setHold(path, 'hidden', document.visibilityState === 'hidden')
        )
      )
      if (typeof IntersectionObserver !== 'undefined') {
        const seen = new IntersectionObserver(entries => {
          setHold(path, 'offscreen', !entries[entries.length - 1].isIntersecting)
        })
        seen.observe(Dom.carousel)
        cleanups.push(() => seen.disconnect())
      }
      startAutoplay(path)
      cleanups.push(() => stopAutoplay(path))
    }
  }

  // lazy images and the URL follow every move; after a move auto-play
  // waits a whole interval again (so a slide you moved to gets its time)
  const followers = branch.on(EVENTS.CHANGE, () => {
    lazyLoad(path)
    const current = holoStore.getVirtualDom(path)
    if (current?.io.hash) writeHash(current.io.hash, current.index)
    if (current?.io.animate && !holoStore.isHeld(path)) startAutoplay(path)
    if (current?.io.route) routeChanged(path)
  })
  if (followers.unsubscribe) cleanups.push(followers.unsubscribe as Cleanup)
  if (io.hash) {
    cleanups.push(
      listen(window, 'hashchange', () => {
        const index = hashIndex(io.hash)
        if (index >= 0) branch.call(EVENTS.GO_TO, {index})
      })
    )
  }

  return () => cleanups.forEach(fn => fn())
}

/**
 * Re-measure: apply the breakpoint for the current width (setting the
 * features up again if it changed them), then measure and load images.
 */
export const refreshLayout = (path: string): void => {
  const instance = holoStore.getInstance(path)
  if (!instance) return
  if (applyBreakpoint(path)) {
    instance.cleanup()
    measureCarousel(path)
    holoStore.updateInstance(path, {cleanup: setupFeatures(path)})
  } else {
    measureCarousel(path)
  }
  lazyLoad(path)
}

/**
 * Bring a registered carousel to life: channels, features, the first
 * measure, the URL position and the observers that keep it measured.
 */
export const setupCarousel = (path: string): boolean => {
  const instance = holoStore.getInstance(path)
  if (!instance) {
    log.error('@Holo: Cannot set up missing carousel: ' + path)
    return false
  }
  if (instance.loaded) return true
  if (!initializeCarouselChannels(path)) {
    log.error('@Holo: could not register channels for ' + path)
    return false
  }

  if (!instance.Dom) {
    measureCarousel(path)
    return true
  }

  applyBreakpoint(path)
  const features = setupFeatures(path)
  measureCarousel(path)

  const {Dom} = instance
  const observers: Cleanup[] = []
  // re-measure when the room around it changes or an image arrives. The room is the parent's: a carousel made
  // out of the page, or moved to another parent, is watched where it is now (watchRoom, on every measure)
  if (typeof ResizeObserver !== 'undefined') {
    const sized = new ResizeObserver(() => refreshCarousel(path))
    instance.meta.sized = sized
    instance.meta.room = null
    watchRoom(path)
    observers.push(() => {
      sized.disconnect()
      delete instance.meta.sized
      delete instance.meta.room
    })
  }
  observers.push(listen(Dom.container, 'load', () => refreshCarousel(path), true))
  // entering or leaving full screen changes the room it has
  observers.push(listen(document, 'fullscreenchange', () => refreshCarousel(path)))
  // markup images: placeholders until they arrive
  Array.from(Dom.container.children).forEach(slot => watchImages(slot as HTMLElement))
  // markup carousels follow their own children: slides added or removed
  // by anything else are picked up (data carousels change only through items)
  if (!instance.data && typeof MutationObserver !== 'undefined') {
    const changes = new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) watchImages(node)
        })
      }
      refreshCarousel(path)
    })
    changes.observe(Dom.container, {childList: true})
    observers.push(() => changes.disconnect())
  }

  // a data carousel's slots are Holo's: empty and remove them on teardown
  if (instance.data) {
    observers.push(() => {
      const data = holoStore.getInstance(path)?.data
      if (!data) return
      for (const key in data.slots) {
        data.unrender?.(data.slots[key], data.rendered[key])
        data.slots[key].remove()
      }
      data.slots = {}
      data.rendered = {}
      data.pool = []
    })
  }

  // features change with breakpoints (cleanup); observers stay (unobserve)
  holoStore.updateInstance(path, {
    cleanup: features,
    unobserve: () => observers.forEach(fn => fn())
  })

  const start = instance.virtualDom.io.hash ? hashIndex(instance.virtualDom.io.hash) : -1
  if (start >= 0) setTrack(path, start, false)
  if (instance.virtualDom.io.route) routeReady(path)
  lazyLoad(path)
  return true
}

/**
 * Change a carousel's options in place: same branch (so subscribers stay),
 * features set up again, re-measured, at the same item.
 */
export const reconfigure = (
  path: string,
  options: Partial<HoloOptions>,
  animate = true
): HoloIOOptions | undefined => {
  const instance = holoStore.getInstance(path)
  if (!instance) return undefined
  const {branch, data} = instance
  const index = instance.virtualDom.index

  const next: HoloIOOptions = {...instance.baseIo, ...normalizeOptions(options), id: instance.id}
  const gesture = applyGestureOptions(
    instance.meta.gesture as Record<string, number> | undefined,
    options
  )
  if (gesture) instance.meta.gesture = gesture
  if (next.virtual && !data) next.virtual = 0
  const switchedWindow = !!data && !!next.virtual !== !!instance.virtualDom.io.virtual
  const effectChanged = next.effect !== instance.virtualDom.io.effect
  // the auto-play channel is re-registered only when its interval changes: a Cyre locked after boot refuses any
  // registration, and changing the effect or the slots of a carousel that does not auto-play must still work there
  const intervalBefore = autoplayInterval(path)

  if (!instance.loaded) {
    holoStore.updateInstance(path, {baseIo: next})
    holoStore.updateVirtualDom(path, {io: {...next}})
    return next
  }

  const apply = () => {
    const current = holoStore.getInstance(path)
    if (!current) return
    current.cleanup()
    if (options.breakpoints) {
      holoStore.updateInstance(path, {breakpoints: normalizeBreakpoints(options.breakpoints)})
    }
    holoStore.updateInstance(path, {baseIo: next, breakpoint: -1})
    holoStore.updateVirtualDom(path, {io: {...next}, index: 0, track: 0, shown: 0})
    stopMove(path)

    // grouped: every lane takes the new look, inside this carousel's one morph (3.6)
    const groups = groupsOf(current)
    if (groups) {
      const lane = laneOptionsOf(options)
      groups.laneOptions = {...groups.laneOptions, ...lane}
      for (const lanePath of groups.lanes) reconfigure(lanePath, lane, false)
    }

    if (data) {
      if (options.render) holoStore.updateData(path, {render: options.render})
      if (switchedWindow) {
        // from all slots to a window (or back): start the slots afresh
        for (const key in data.slots) {
          data.unrender?.(data.slots[key], data.rendered[key])
          data.slots[key].remove()
        }
        holoStore.updateData(path, {slots: {}, rendered: {}, pool: []})
      }
      if (Array.isArray(options.items)) {
        holoStore.updateData(path, {items: options.items.slice(), keys: keysOf(options.items, data.key)})
      }
    }

    // the auto-play interval may have changed
    const interval = autoplayInterval(path)
    if (interval !== intervalBefore) branch.channel({id: EVENTS.ANIMATE, interval, repeat: true})

    if (current.Dom) {
      applyBreakpoint(path)
      holoStore.updateInstance(path, {cleanup: setupFeatures(path)})
    }
    measureCarousel(path)
    setTrack(path, Math.min(index, holoStore.getVirtualDom(path)?.maxIndex ?? 0), false)
    lazyLoad(path)
  }

  if (effectChanged && instance.Dom && animate) morph(path, apply)
  else apply()
  return holoStore.getVirtualDom(path)?.io
}

/**
 * Change a carousel's layout with each item flying from where it was to
 * where it goes (View Transitions: the browser snapshots both states and
 * animates every named item between them). Where that is not available,
 * or motion is reduced, the carousel crossfades instead.
 */
export const morph = (path: string, change: () => void): void => {
  const instance = holoStore.getInstance(path)
  const Dom = instance?.Dom
  if (!Dom) {
    change()
    return
  }
  const reduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const start = (document as any).startViewTransition as
    | ((update: () => void) => {finished: Promise<void>})
    | undefined

  if (!start || reduced) {
    change()
    if (!reduced && typeof Dom.container.animate === 'function') {
      Dom.container.animate([{opacity: 0}, {opacity: 1}], {duration: 320, easing: 'ease-out'})
    }
    return
  }

  // a unique name per item, so each is matched with itself in the new layout.
  // Items out of view (inert) are left unnamed: their snapshot is not clipped
  // by the carousel, so they would fly in from outside it - in the new layout
  // they fade in where they land.
  const base = `holo-${path.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  // a grouped carousel names its headings and every lane's items (an item that changes group flies across)
  const targets = (): Array<[HTMLElement, string]> => {
    const current = holoStore.getInstance(path)
    if (current && groupsOf(current)) return groupMorphTargets(current)
    return Array.from(Dom.container.children).map((slot, i) => [slot as HTMLElement, (slot as HTMLElement).dataset.key ?? String(i)])
  }
  let named: HTMLElement[] = []
  const unname = () => {
    named.forEach(element => {
      element.style.removeProperty('view-transition-name')
      element.style.removeProperty('view-transition-class')
    })
    named = []
  }
  const name = () => {
    unname()
    const used = new Set<string>()
    for (const [element, key] of targets()) {
      if (element.hasAttribute('inert') || element.closest('[inert]')) continue
      const id = `${base}-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`
      if (used.has(id)) continue // a name twice aborts the whole transition
      used.add(id)
      element.style.setProperty('view-transition-name', id)
      element.style.setProperty('view-transition-class', 'holo-item')
      named.push(element)
    }
  }

  name()
  try {
    start
      .call(document, () => {
        change()
        name() // the new layout's slots (data slots are reused, markup ones are the same)
      })
      .finished.finally(unname)
  } catch {
    unname()
    change()
  }
}

export default {
  morph,
  reconfigure,
  setupCarousel,
  setupFeatures,
  refreshLayout
}

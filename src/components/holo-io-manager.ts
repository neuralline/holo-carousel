//src/components/holo-io-manager.ts

import {log} from 'cyre'
import {holoStore} from '../core/state'
import Touch from './holo-touch'
import {CSS_CLASSES, EVENTS} from '../config/holo-config'
import {
  initializeCarouselChannels,
  measureCarousel,
  refreshCarousel,
  setHold,
  startAutoplay
} from '../core/event-manager'
import {pageTarget} from './holo-essentials'

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

/**
 * Prev / next buttons, a dot per page and, with auto-play, a pause
 * button (WCAG 2.2.2) - built inside the carousel element.
 */
const buildControls = (id: string): Cleanup => {
  const instance = holoStore.getInstance(id)
  if (!instance) return () => {}
  const {Dom, branch, virtualDom} = instance
  const vertical = !!virtualDom.io.orientation

  const root = document.createElement('div')
  root.className = CSS_CLASSES.CONTROLS
  const prev = button(CSS_CLASSES.PREV, 'Previous', vertical ? '↑' : '‹')
  const next = button(CSS_CLASSES.NEXT, 'Next', vertical ? '↓' : '›')
  const dots = document.createElement('div')
  dots.className = CSS_CLASSES.DOTS
  root.append(prev, dots, next)

  let play: HTMLButtonElement | undefined
  if (virtualDom.io.animate) {
    play = button(CSS_CLASSES.PLAY, 'Pause', '')
    play.setAttribute('aria-pressed', 'false')
    play.dataset.state = 'playing'
    root.appendChild(play)
  }

  Dom.carousel.appendChild(root)
  holoStore.updateDom(id, {controls: {root, prev, next, dots, play}})

  const cleanups = [
    listen(prev, 'click', () => branch.call(EVENTS.PREV_SLIDE)),
    listen(next, 'click', () => branch.call(EVENTS.NEXT_SLIDE)),
    listen(dots, 'click', (e: MouseEvent) => {
      const dot = (e.target as HTMLElement).closest(`.${CSS_CLASSES.DOT}`) as
        | HTMLElement
        | null
      if (!dot) return
      const vd = holoStore.getVirtualDom(id)
      if (!vd) return
      branch.call(EVENTS.GO_TO, {
        index: pageTarget(Number(dot.dataset.page), vd.maxIndex, vd.step)
      })
    })
  ]
  if (play) {
    cleanups.push(
      listen(play, 'click', () => {
        const paused = !!holoStore.getInstance(id)?.hold.user
        setHold(id, 'user', !paused)
      })
    )
  }

  return () => {
    cleanups.forEach(fn => fn())
    root.remove()
    holoStore.updateDom(id, {controls: undefined})
  }
}

/** region + slide roles, a label, and a way to focus the carousel */
const applyA11y = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance) return
  const {Dom, virtualDom} = instance
  const {carousel, container} = Dom

  carousel.setAttribute('role', 'region')
  carousel.setAttribute('aria-roledescription', 'carousel')
  if (!carousel.hasAttribute('aria-label') && !carousel.hasAttribute('aria-labelledby')) {
    carousel.setAttribute('aria-label', carousel.dataset.title || 'Carousel')
  }
  if (virtualDom.io.keyboard && !carousel.hasAttribute('tabindex')) {
    carousel.setAttribute('tabindex', '0')
  }
  if (virtualDom.io.orientation) carousel.classList.add('holo-vertical')

  // announce moves made by the user, not by auto-play
  container.setAttribute('aria-live', virtualDom.io.animate ? 'off' : 'polite')
  for (const item of Array.from(container.children)) {
    item.setAttribute('role', 'group')
    item.setAttribute('aria-roledescription', 'slide')
  }
}

const KEYS: Record<string, string> = {
  Home: EVENTS.FIRST_SLIDE,
  End: EVENTS.LAST_SLIDE,
  PageUp: EVENTS.PREV_SLIDE,
  PageDown: EVENTS.NEXT_SLIDE
}

/**
 * Setup all event handlers and listeners for a carousel
 */
export const setupEventHandlers = (id: string): (() => void) => {
  const instance = holoStore.getInstance(id)
  if (!instance) {
    log.error('@Holo: Cannot setup events handler for missing carousel: ' + id)
    return () => {}
  }

  // Setup this carousel's own Cyre channels, on its own branch
  initializeCarouselChannels(id)

  const {virtualDom, Dom, branch} = instance
  const {io} = virtualDom
  const cleanups: Cleanup[] = []
  applyA11y(id)

  if (io.enabled) {
    // drag / swipe
    if (io.drag || io.swipe) {
      cleanups.push(
        listen(Dom.container, 'pointerdown', (e: PointerEvent) =>
          Touch._touchStart(e, id)
        ),
        // native image / link dragging fights the carousel's own drag
        listen(Dom.container, 'dragstart', (e: DragEvent) => e.preventDefault())
      )
    }

    // a click that ended a drag is swallowed; a real one focuses an item
    cleanups.push(
      listen(
        Dom.container,
        'click',
        (e: MouseEvent) => {
          const touchState = holoStore.getInstance(id)?.touchState
          if (touchState?.suppressClick) {
            touchState.suppressClick = false
            e.preventDefault()
            e.stopPropagation()
            return
          }
          if (io.focus && io.onClick) Touch._focus(e, id)
        },
        true
      )
    )

    // wheel / trackpad: preventDefault has to happen here, synchronously,
    // and only when the carousel will move - at an end the page scrolls on
    if (io.wheel) {
      cleanups.push(
        listen(
          Dom.carousel,
          'wheel',
          (e: WheelEvent) => {
            const vd = holoStore.getVirtualDom(id)
            if (!vd) return
            const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY)
            const delta = vd.io.orientation || !sideways ? e.deltaY : e.deltaX
            if (Math.abs(delta) < 4) return
            const blocked =
              !vd.io.loop &&
              ((delta > 0 && vd.index >= vd.maxIndex) || (delta < 0 && vd.index <= 0))
            if (blocked) return
            e.preventDefault()
            branch.call(EVENTS.WHEELER, {delta})
          },
          {passive: false}
        )
      )
    }

    // keyboard
    if (io.keyboard) {
      cleanups.push(
        listen(Dom.carousel, 'keydown', (e: KeyboardEvent) => {
          if (e.target !== Dom.carousel && (e.target as HTMLElement).closest('button')) {
            return // the controls handle their own keys
          }
          const vertical = !!holoStore.getVirtualDom(id)?.io.orientation
          const back = vertical ? 'ArrowUp' : 'ArrowLeft'
          const forward = vertical ? 'ArrowDown' : 'ArrowRight'
          const channel =
            e.key === back
              ? EVENTS.PREV_SLIDE
              : e.key === forward
                ? EVENTS.NEXT_SLIDE
                : KEYS[e.key]
          if (!channel) return
          e.preventDefault()
          branch.call(channel)
        })
      )
    }

    // controls
    if (io.controller) cleanups.push(buildControls(id))

    // auto-play, held while someone is looking at or using the carousel,
    // while the tab is hidden and while the carousel is off screen
    if (io.animate) {
      cleanups.push(
        listen(Dom.carousel, 'pointerenter', (e: PointerEvent) => {
          if (e.pointerType === 'mouse') setHold(id, 'hover', true)
        }),
        listen(Dom.carousel, 'pointerleave', () => setHold(id, 'hover', false)),
        listen(Dom.carousel, 'focusin', () => setHold(id, 'focus', true)),
        listen(Dom.carousel, 'focusout', (e: FocusEvent) => {
          if (!Dom.carousel.contains(e.relatedTarget as Node)) {
            setHold(id, 'focus', false)
          }
        }),
        listen(document, 'visibilitychange', () =>
          setHold(id, 'hidden', document.visibilityState === 'hidden')
        )
      )
      if (typeof IntersectionObserver !== 'undefined') {
        const seen = new IntersectionObserver(entries => {
          const entry = entries[entries.length - 1]
          setHold(id, 'offscreen', !entry.isIntersecting)
        })
        seen.observe(Dom.carousel)
        cleanups.push(() => seen.disconnect())
      }
    }

    // re-measure when the room around it changes or an image arrives
    if (typeof ResizeObserver !== 'undefined' && Dom.carousel.parentElement) {
      // reports once on observe too: refresh is debounced and idempotent
      const sized = new ResizeObserver(() => refreshCarousel(id))
      sized.observe(Dom.carousel.parentElement)
      cleanups.push(() => sized.disconnect())
    }
    cleanups.push(listen(Dom.container, 'load', () => refreshCarousel(id), true))
  }

  const cleanup = () => cleanups.forEach(fn => fn())
  holoStore.updateInstance(id, {cleanup})

  // measure now (the channel is debounced), then start auto-play
  measureCarousel(id)
  if (io.enabled && io.animate) startAutoplay(id)

  return cleanup
}

export default {
  setupEventHandlers
}

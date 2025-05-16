//src/core/event-manager.ts

import cyre from 'cyre'
import {EVENTS} from '../config/holo-config'
import {VirtualDomState} from '../types/interface'
import {holoStore} from './state'
import {_transformX, _transformY} from '../components/orientation-handler'
import {
  animate,
  animateSlideBackward,
  animateSlideForward,
  firstSlide,
  lastSlide,
  nxtSlide,
  prvSlide,
  activate,
  wheeler,
  _getItemWidthHeight,
  _numberOfSlots
} from '../components/holo-essentials'

// Track whether events have been initialized
let eventsInitialized = false

/**
 * Initialize all Cyre event handlers - Only runs once
 */
export const initializeEvents = (): boolean => {
  // Prevent duplicate registrations
  if (eventsInitialized) {
    console.log('@Holo: Events already initialized')
    return false
  }

  console.log('@Holo: Initializing event handlers')

  // Setup global actions
  cyre.action([
    {id: EVENTS.REFRESH_SCREEN, debounce: 300},
    {id: EVENTS.REFRESH_CAROUSEL},
    {id: EVENTS.ERROR, log: true}
  ])

  // Register refresh carousel handler (core functionality)
  cyre.on(
    EVENTS.REFRESH_CAROUSEL,
    (state: {virtual: VirtualDomState; dom: any}) => {
      const {virtual, dom} = state

      if (!virtual.id) {
        cyre.call(EVENTS.ERROR, 'Holo carousel refresh error ' + virtual.id)
        return
      }

      dom.container.setAttribute('style', '')

      const {height, width} = _getItemWidthHeight(
        dom.container.children[0] as HTMLElement
      )

      // Update virtual DOM with new dimensions
      const updatedVirtual = {...virtual}
      updatedVirtual.item.height = height
      updatedVirtual.item.width = width

      updatedVirtual.numberOfSlots =
        _numberOfSlots(
          dom.carousel.parentNode.clientWidth,
          updatedVirtual.item.width,
          updatedVirtual.item.max
        ) || 1

      const calcCarouselWidth =
        updatedVirtual.numberOfSlots * updatedVirtual.item.width
      const innerCarouselWidth = dom.carousel.clientWidth
      const calcWidth =
        dom.container.children.length * updatedVirtual.item.width
      const innerWidth = dom.container.clientWidth || calcWidth

      updatedVirtual.carousel.width = calcCarouselWidth || innerCarouselWidth
      updatedVirtual.carousel.height =
        updatedVirtual.item.height || dom.carousel.clientHeight

      updatedVirtual.container.width = updatedVirtual.io.orientation
        ? dom.carousel.width
        : innerWidth

      updatedVirtual.container.height =
        dom.container.clientHeight || updatedVirtual.item.height || 0

      updatedVirtual.endOfSlidePosition = updatedVirtual.io.orientation
        ? -Math.abs(
            updatedVirtual.container.height - updatedVirtual.carousel.height
          )
        : -Math.abs(
            updatedVirtual.container.width - updatedVirtual.carousel.width
          )

      // Update store
      holoStore.updateVirtualDom(virtual.id, updatedVirtual)

      // Trigger snap to update positioning
      cyre.call(EVENTS.SNAP, updatedVirtual)
    }
  )

  // Register SNAP handler
  cyre.on(EVENTS.SNAP, (virtual: VirtualDomState) => {
    if (!virtual.id) {
      return {id: EVENTS.ERROR, payload: 'Holo snap error'}
    }

    // Update transition style
    holoStore.updateStyle(virtual.id, true)

    // Apply transformation based on orientation
    const transformed = virtual.io.orientation
      ? _transformY(virtual)
      : _transformX(virtual)

    // Update virtual DOM and apply transform
    holoStore.updateVirtualDom(virtual.id, transformed)
    holoStore.applyDomTransform(virtual.id)

    return transformed
  })

  // Register navigation event handlers
  cyre.on(EVENTS.ANIMATE_FORWARD, animateSlideForward)
  cyre.on(EVENTS.ANIMATE_BACKWARD, animateSlideBackward)
  cyre.on(EVENTS.ANIMATE, animate)
  cyre.on(EVENTS.NEXT_SLIDE, nxtSlide)
  cyre.on(EVENTS.PREV_SLIDE, prvSlide)
  cyre.on(EVENTS.FIRST_SLIDE, firstSlide)
  cyre.on(EVENTS.LAST_SLIDE, lastSlide)
  cyre.on(EVENTS.ACTIVATE, activate)
  cyre.on(EVENTS.WHEELER, wheeler)
  cyre.on(EVENTS.SHAKE, _e => console.log('shaking'))

  // Handle screen refresh
  cyre.on(EVENTS.REFRESH_SCREEN, () => {
    const instances = holoStore.getAllInstances()

    for (const id in instances) {
      const instance = instances[id]
      cyre.call(EVENTS.REFRESH_CAROUSEL, {
        virtual: instance.virtualDom,
        shadow: instance.Dom
      })
    }
  })

  eventsInitialized = true
  return true
}

/**
 * Trigger a refresh for a specific carousel
 */
export const refreshCarousel = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance) {
    console.error('Holo carousel refresh error:', id)
    return
  }

  cyre.call(EVENTS.REFRESH_CAROUSEL, {
    virtual: instance.virtualDom,
    shadow: instance.Dom
  })
}

/**
 * Setup carousel-specific actions (not handlers)
 */
export const setupCarouselActions = (
  id: string,
  virtualDom: VirtualDomState
): void => {
  cyre.action([
    {
      id: EVENTS.ANIMATE,
      payload: virtualDom,
      interval: 5000,
      repeat: true
    },
    {
      id: EVENTS.ANIMATE_BACKWARD,
      payload: virtualDom,
      interval: virtualDom.io.duration,
      repeat: virtualDom.io.loop
    },
    {
      id: EVENTS.ANIMATE_FORWARD,
      payload: virtualDom,
      interval: virtualDom.io.duration,
      repeat: virtualDom.io.loop
    },
    {
      id: EVENTS.SNAP,
      payload: virtualDom
    },
    {
      id: EVENTS.PREV_SLIDE,
      payload: virtualDom
    },
    {
      id: EVENTS.NEXT_SLIDE,
      payload: virtualDom
    },
    {
      id: EVENTS.LAST_SLIDE,
      payload: virtualDom
    },
    {
      id: EVENTS.FIRST_SLIDE,
      payload: virtualDom
    },
    {
      id: EVENTS.ACTIVATE,
      payload: virtualDom
    }
  ])
}

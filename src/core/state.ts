//src/core/state.ts

import {
  HoloState,
  CarouselInstance,
  VirtualDomState,
  DomState,
  TouchState,
  HoloIOOptions,
  HoloBranch,
  HoloSystemState,
  HoldReason
} from '../types/interface'
import {ANIMATION, DEFAULT_IO_OPTIONS} from '../config/holo-config'

// Create default states
export const createDefaultIOOptions = (id: string): HoloIOOptions => ({
  ...DEFAULT_IO_OPTIONS,
  id
})

export const createDefaultVirtualDom = (id: string): VirtualDomState => ({
  id,
  carousel: {},
  container: {},
  io: createDefaultIOOptions(id),
  title: null,
  description: null,
  duration: ANIMATION.DURATION,
  transitionTiming: ANIMATION.TIMING,
  transformX: 0,
  transformY: 0,
  transformZ: 0,
  numberOfSlots: 0,
  endOfSlide: 1,
  endOfSlidePosition: 0,
  index: 0,
  maxIndex: 0,
  step: 1,
  page: 0,
  pages: 1,
  item: {
    max: 8
  }
})

export const createDefaultDomState = (): DomState => ({
  carousel: {} as HTMLElement,
  container: {} as HTMLElement
})

export const createDefaultTouchState = (): TouchState => ({
  pressed: false,
  dragging: false,
  cancelled: false,
  pointerId: -1,
  positionX: 0,
  positionY: 0,
  currentX: 0,
  currentY: 0,
  multiplier: 1,
  samples: [],
  suppressClick: false
})

const createDefaultSystemState = (): HoloSystemState => ({
  initialized: false,
  root: null,
  pressedId: null,
  autoInitialized: {},
  sequence: 0,
  cleanup: () => {}
})

// The one place carousel state lives. Records are updated in place:
// a drag writes the position up to 120 times a second, and copying the
// whole instance on every frame was the slowest part of the old store.
// Readers get the live record - treat it as read-only and write through
// the update* functions below.
const createHoloStore = () => {
  const state: HoloState = {
    system: createDefaultSystemState(),
    instances: {}
  }

  const instanceOf = (id: string): CarouselInstance | undefined =>
    state.instances[id]

  return {
    // --- page-wide ----------------------------------------------------
    getSystem: (): HoloSystemState => state.system,

    updateSystem: (updates: Partial<HoloSystemState>): HoloSystemState =>
      Object.assign(state.system, updates),

    /** next id for a carousel without an id attribute */
    nextId: (): string => `holo-${++state.system.sequence}`,

    markAutoInitialized: (id: string): void => {
      state.system.autoInitialized[id] = true
    },

    isAutoInitialized: (id: string): boolean =>
      !!state.system.autoInitialized[id],

    resetSystem: (): void => {
      state.system = createDefaultSystemState()
    },

    // --- instances ----------------------------------------------------
    getInstance: instanceOf,

    // Get all carousel instances
    getAllInstances: (): Record<string, CarouselInstance> => state.instances,

    // Get only the virtual DOM state
    getVirtualDom: (id: string): VirtualDomState | undefined =>
      instanceOf(id)?.virtualDom,

    // Get only the DOM state
    getDom: (id: string): DomState | undefined => instanceOf(id)?.Dom,

    // Get this carousel's own Cyre branch (holo/<id>)
    getBranch: (id: string): HoloBranch | undefined => instanceOf(id)?.branch,

    // Get dimensions of a carousel
    getDimensions: (id: string) => {
      const instance = instanceOf(id)
      if (!instance) return undefined
      const {virtualDom} = instance

      return {
        car: {
          w: virtualDom.carousel.width || 0,
          h: virtualDom.carousel.height || 0
        },
        con: {
          w: virtualDom.container.width || 0,
          h: virtualDom.container.height || 0,
          x: virtualDom.transformX,
          y: virtualDom.transformY,
          z: virtualDom.transformZ
        }
      }
    },

    // Apply the measured viewport size to the carousel element
    setDimension: (id: string): void => {
      const instance = instanceOf(id)
      if (!instance) return
      const {virtualDom, Dom} = instance

      if (!virtualDom.io.orientation) {
        Dom.carousel.style.width = `${virtualDom.carousel.width}px`
        Dom.carousel.style.height = ''
      } else {
        // a vertical container stacks full-width items
        Dom.carousel.style.height = `${virtualDom.carousel.height}px`
        Dom.carousel.style.width = ''
        Dom.container.style.width = '100%'
      }
    },

    // Register a new carousel instance
    registerInstance: (
      id: string,
      domElements: {carousel: HTMLElement; container: HTMLElement},
      options: Partial<HoloIOOptions> = {},
      branch: HoloBranch
    ): CarouselInstance => {
      const virtualDom = createDefaultVirtualDom(id)
      virtualDom.io = {...virtualDom.io, ...options, id}

      const instance: CarouselInstance = {
        id,
        virtualDom,
        Dom: {
          carousel: domElements.carousel,
          container: domElements.container
        },
        touchState: createDefaultTouchState(),
        updateStyle: false,
        branch,
        hold: {},
        cleanup: () => {},
        frame: 0
      }

      state.instances[id] = instance
      return instance
    },

    // Update a carousel instance (partial update)
    updateInstance: (
      id: string,
      updates: Partial<CarouselInstance>
    ): CarouselInstance | undefined => {
      const instance = instanceOf(id)
      if (!instance) return undefined
      const {virtualDom, Dom, touchState, ...rest} = updates
      Object.assign(instance, rest)
      if (virtualDom) Object.assign(instance.virtualDom, virtualDom)
      if (Dom) Object.assign(instance.Dom, Dom)
      if (touchState) Object.assign(instance.touchState, touchState)
      return instance
    },

    // Update only the virtual DOM state (nested objects are merged)
    updateVirtualDom: (
      id: string,
      updates: Partial<VirtualDomState>
    ): VirtualDomState | undefined => {
      const instance = instanceOf(id)
      if (!instance) return undefined
      const current = instance.virtualDom
      const {carousel, container, io, item, ...rest} = updates

      Object.assign(current, rest)
      if (carousel) Object.assign(current.carousel, carousel)
      if (container) Object.assign(current.container, container)
      if (io) Object.assign(current.io, io)
      if (item) Object.assign(current.item, item)

      return current
    },

    // Update DOM state
    updateDom: (
      id: string,
      updates: Partial<DomState>
    ): DomState | undefined => {
      const instance = instanceOf(id)
      if (!instance) return undefined
      return Object.assign(instance.Dom, updates)
    },

    // Update touch state
    updateTouchState: (
      id: string,
      updates: Partial<TouchState>
    ): TouchState | undefined => {
      const instance = instanceOf(id)
      if (!instance) return undefined
      return Object.assign(instance.touchState, updates)
    },

    resetTouchState: (id: string): void => {
      const instance = instanceOf(id)
      if (!instance) return
      const keep = instance.touchState.targetHoloComponent
      instance.touchState = {
        ...createDefaultTouchState(),
        targetHoloComponent: keep
      }
    },

    // Whether the next transform animates
    updateStyle: (id: string, enableTransition: boolean): void => {
      const instance = instanceOf(id)
      if (instance) instance.updateStyle = enableTransition
    },

    setFrame: (id: string, frame: number): void => {
      const instance = instanceOf(id)
      if (instance) instance.frame = frame
    },

    // --- auto-play holds ---------------------------------------------
    hold: (id: string, reason: HoldReason): void => {
      const instance = instanceOf(id)
      if (instance) instance.hold[reason] = true
    },

    release: (id: string, reason: HoldReason): void => {
      const instance = instanceOf(id)
      if (instance) delete instance.hold[reason]
    },

    isHeld: (id: string): boolean => {
      const instance = instanceOf(id)
      if (!instance) return true
      for (const _ in instance.hold) return true
      return false
    },

    // Apply style to DOM element based on state
    applyDomTransform: (id: string, offset = 0): void => {
      const instance = instanceOf(id)
      if (!instance) return
      const {Dom, virtualDom} = instance
      const style = Dom.container.style

      if (instance.updateStyle && virtualDom.duration > 0) {
        style.transitionDuration = virtualDom.duration + 'ms'
        style.transitionTimingFunction = virtualDom.transitionTiming
      } else {
        style.transitionDuration = '0ms'
        style.transitionTimingFunction = 'linear'
      }

      const x = virtualDom.io.orientation ? 0 : virtualDom.transformX + offset
      const y = virtualDom.io.orientation ? virtualDom.transformY + offset : 0
      style.transform = `translate3d(${x}px, ${y}px, ${virtualDom.transformZ}px)`
    },

    // Remove a carousel instance (tears down its Cyre branch/channels first)
    removeInstance: (id: string): boolean => {
      const instance = instanceOf(id)
      if (!instance) return false

      if (instance.frame) cancelAnimationFrame(instance.frame)
      instance.cleanup()
      instance.branch.destroy()
      if (state.system.pressedId === id) state.system.pressedId = null
      delete state.system.autoInitialized[id]
      delete state.instances[id]

      return true
    },

    // Check if an instance exists
    hasInstance: (id: string): boolean => !!state.instances[id]
  }
}

// Create and export singleton store
export const holoStore = createHoloStore()

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
  HoloInstanceState,
  HoldReason,
  DataState
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
  numberOfSlots: 1,
  endOfSlide: 1,
  endOfSlidePosition: 0,
  noOfChildren: 0,
  index: 0,
  maxIndex: 0,
  track: 0,
  wrap: false,
  shown: 0,
  moveDuration: ANIMATION.DURATION,
  launch: null,
  step: 1,
  page: 0,
  pages: 1,
  viewport: 0,
  item: {max: 8}
})

export const createDefaultTouchState = (): TouchState => ({
  pressed: false,
  dragging: false,
  cancelled: false,
  pointerType: '',
  longPressed: false,
  caught: false,
  longPressTimer: 0,
  suppressUntil: 0,
  lastTap: {time: 0, x: 0, y: 0},
  wheel: {axis: '', last: 0, main: 0, cross: 0, timer: 0},
  pointerId: -1,
  positionX: 0,
  positionY: 0,
  currentX: 0,
  currentY: 0,
  startTrack: 0,
  samples: []
})

const createDefaultSystemState = (): HoloSystemState => ({
  pressedPath: null,
  listeners: 0,
  cleanup: () => {},
  sequence: 0,
  ids: {},
  defaultHolo: ''
})

// The one place Holo state lives: every Holo instance (one per useHolo)
// and every carousel, keyed by its branch path. Records are updated in
// place - a drag writes the position up to 120 times a second - so
// readers get the live record: treat it as read-only and write through
// the functions below.
const createHoloStore = () => {
  const state: HoloState = {
    system: createDefaultSystemState(),
    holos: {},
    carousels: {}
  }

  const carouselOf = (path: string): CarouselInstance | undefined =>
    state.carousels[path]

  return {
    // --- page-wide ----------------------------------------------------
    getSystem: (): HoloSystemState => state.system,

    updateSystem: (updates: Partial<HoloSystemState>): HoloSystemState =>
      Object.assign(state.system, updates),

    /** next id for a carousel without one */
    nextId: (): string => `holo-${++state.system.sequence}`,

    // --- Holo instances ----------------------------------------------
    addHolo: (holo: HoloInstanceState): HoloInstanceState => {
      state.holos[holo.path] = holo
      return holo
    },

    getHolo: (path: string): HoloInstanceState | undefined => state.holos[path],

    getAllHolos: (): Record<string, HoloInstanceState> => state.holos,

    removeHolo: (path: string): void => {
      delete state.holos[path]
    },

    // --- carousels ----------------------------------------------------
    getInstance: carouselOf,

    getAllInstances: (): Record<string, CarouselInstance> => state.carousels,

    /** a carousel path from a path or an element id */
    resolve: (idOrPath: string): string | undefined =>
      state.carousels[idOrPath] ? idOrPath : state.system.ids[idOrPath],

    getVirtualDom: (path: string): VirtualDomState | undefined =>
      carouselOf(path)?.virtualDom,

    getDom: (path: string): DomState | null | undefined => carouselOf(path)?.Dom,

    getBranch: (path: string): HoloBranch | undefined => carouselOf(path)?.branch,

    getDimensions: (path: string) => {
      const instance = carouselOf(path)
      if (!instance) return undefined
      const {virtualDom} = instance
      return {
        car: {w: virtualDom.carousel.width || 0, h: virtualDom.carousel.height || 0},
        con: {
          w: virtualDom.container.width || 0,
          h: virtualDom.container.height || 0,
          x: virtualDom.transformX,
          y: virtualDom.transformY,
          z: virtualDom.transformZ
        }
      }
    },

    registerInstance: (record: {
      id: string
      path: string
      holo: string
      parent: string | null
      io: HoloIOOptions
      breakpoints: Array<[number, Partial<HoloIOOptions>]>
      Dom: DomState | null
      branch: HoloBranch
      data: DataState | null
    }): CarouselInstance => {
      const virtualDom = createDefaultVirtualDom(record.id)
      virtualDom.io = {...record.io}

      const instance: CarouselInstance = {
        id: record.id,
        path: record.path,
        holo: record.holo,
        parent: record.parent,
        children: [],
        virtualDom,
        Dom: record.Dom,
        touchState: createDefaultTouchState(),
        updateStyle: false,
        branch: record.branch,
        hold: {},
        baseIo: {...record.io},
        breakpoints: record.breakpoints,
        breakpoint: -1,
        data: record.data,
        cleanup: () => {},
        unobserve: () => {},
        links: [],
        frame: 0,
        tween: null,
        loaded: false,
        settleTimer: 0
      }

      state.carousels[record.path] = instance
      state.system.ids[record.id] = record.path
      if (record.parent) state.carousels[record.parent]?.children.push(record.path)
      else state.holos[record.holo]?.carousels.push(record.path)
      return instance
    },

    updateInstance: (
      path: string,
      updates: Partial<CarouselInstance>
    ): CarouselInstance | undefined => {
      const instance = carouselOf(path)
      if (!instance) return undefined
      const {virtualDom, touchState, ...rest} = updates
      Object.assign(instance, rest)
      if (virtualDom) Object.assign(instance.virtualDom, virtualDom)
      if (touchState) Object.assign(instance.touchState, touchState)
      return instance
    },

    /** merge into the model (nested objects merged too) */
    updateVirtualDom: (
      path: string,
      updates: Partial<VirtualDomState>
    ): VirtualDomState | undefined => {
      const instance = carouselOf(path)
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

    updateDom: (path: string, updates: Partial<DomState>): DomState | undefined => {
      const dom = carouselOf(path)?.Dom
      return dom ? Object.assign(dom, updates) : undefined
    },

    updateTouchState: (
      path: string,
      updates: Partial<TouchState>
    ): TouchState | undefined => {
      const instance = carouselOf(path)
      return instance ? Object.assign(instance.touchState, updates) : undefined
    },

    updateData: (path: string, updates: Partial<DataState>): DataState | undefined => {
      const data = carouselOf(path)?.data
      return data ? Object.assign(data, updates) : undefined
    },

    /** whether the next placement animates */
    updateStyle: (path: string, enableTransition: boolean): void => {
      const instance = carouselOf(path)
      if (instance) instance.updateStyle = enableTransition
    },

    setFrame: (path: string, frame: number): void => {
      const instance = carouselOf(path)
      if (instance) instance.frame = frame
    },

    addLink: (path: string, unlink: () => void): void => {
      carouselOf(path)?.links.push(unlink)
    },

    // --- auto-play holds ---------------------------------------------
    hold: (path: string, reason: HoldReason): void => {
      const instance = carouselOf(path)
      if (instance) instance.hold[reason] = true
    },

    release: (path: string, reason: HoldReason): void => {
      const instance = carouselOf(path)
      if (instance) delete instance.hold[reason]
    },

    isHeld: (path: string): boolean => {
      const instance = carouselOf(path)
      if (!instance) return true
      for (const _ in instance.hold) return true
      return false
    },

    /**
     * Forget a carousel and everything nested in it (children first).
     * Listeners, links and DOM are torn down by the caller's cleanup;
     * the branch is destroyed once, at the top, which takes the
     * sub-branches with it.
     */
    removeInstance: (path: string, destroyBranch = true): boolean => {
      const instance = carouselOf(path)
      if (!instance) return false

      for (const child of [...instance.children]) {
        state.carousels[child] && removeChild(child)
      }
      teardown(instance)
      if (destroyBranch) instance.branch.destroy()

      if (instance.parent) {
        const parent = state.carousels[instance.parent]
        if (parent) parent.children = parent.children.filter(p => p !== path)
      } else {
        const holo = state.holos[instance.holo]
        if (holo) holo.carousels = holo.carousels.filter(p => p !== path)
      }
      if (state.system.ids[instance.id] === path) delete state.system.ids[instance.id]
      if (state.system.pressedPath === path) state.system.pressedPath = null
      delete state.carousels[path]
      return true
    },

    hasInstance: (path: string): boolean => !!state.carousels[path]
  }

  function teardown(instance: CarouselInstance): void {
    if (instance.frame) cancelAnimationFrame(instance.frame)
    if (instance.tween?.frame) cancelAnimationFrame(instance.tween.frame)
    if (instance.settleTimer) clearTimeout(instance.settleTimer)
    if (instance.touchState.longPressTimer) clearTimeout(instance.touchState.longPressTimer)
    if (instance.touchState.wheel.timer) clearTimeout(instance.touchState.wheel.timer)
    instance.links.forEach(unlink => unlink())
    instance.links = []
    instance.cleanup()
    instance.unobserve()
  }

  function removeChild(path: string): void {
    const instance = state.carousels[path]
    if (!instance) return
    for (const child of [...instance.children]) removeChild(child)
    teardown(instance)
    if (state.system.ids[instance.id] === path) delete state.system.ids[instance.id]
    if (state.system.pressedPath === path) state.system.pressedPath = null
    delete state.carousels[path]
  }
}

// Create and export singleton store
export const holoStore = createHoloStore()

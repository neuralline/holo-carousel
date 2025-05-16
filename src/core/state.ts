//src/core/state.ts
import {
  HoloState,
  CarouselInstance,
  VirtualDomState,
  DomState,
  TouchState,
  HoloIOOptions
} from '../types/interface'

// Create default states
export const createDefaultVirtualDom = (id: string): VirtualDomState => ({
  id,
  carousel: {},
  container: {},
  io: createDefaultIOOptions(id),
  title: null,
  description: null,
  duration: 600,
  transitionTiming: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  transformX: 0,
  transformY: 0,
  transformZ: 0,
  numberOfSlots: 0,
  endOfSlide: 0,
  endOfSlidePosition: 0,
  item: {
    max: 8
  }
})

export const createDefaultIOOptions = (id: string): HoloIOOptions => ({
  id,
  enabled: 1,
  wheel: 0,
  controller: 0,
  drag: 1,
  swipe: 1,
  snap: 1,
  focus: 1,
  animate: 0,
  animateDirection: 1,
  duration: 0,
  loop: 200,
  orientation: 0,
  active: true,
  onClick: true,
  onDoubleClick: true
})

export const createDefaultDomState = (): DomState => ({
  carousel: {} as HTMLElement,
  container: {} as HTMLElement
})

export const createDefaultTouchState = (): TouchState => ({
  pressed: false,
  positionX: 0,
  positionY: 0,
  currentX: 0,
  currentY: 0,
  multiplier: 1.482
})

// Create a closure-based state store
const createHoloStore = () => {
  let state: HoloState = {instances: {}}

  return {
    // Get a copy of instance state
    getInstance: (id: string): CarouselInstance | undefined =>
      state.instances[id] ? {...state.instances[id]} : undefined,

    // Get all carousel instances
    getAllInstances: (): Record<string, CarouselInstance> => ({
      ...state.instances
    }),

    // Get only the virtual DOM state
    getVirtualDom: (id: string): VirtualDomState | undefined =>
      state.instances[id] ? {...state.instances[id].virtualDom} : undefined,

    // Get only the DOM state
    getDom: (id: string): DomState | undefined =>
      state.instances[id] ? {...state.instances[id].Dom} : undefined,

    // Get dimensions of a carousel
    getDimensions: (id: string) => {
      const instance = state.instances[id]
      if (!instance) return undefined

      return {
        car: {
          w: instance.Dom.width || 0,
          h: instance.Dom.height || 0
        },
        con: {
          w: instance.virtualDom.container.width || 0,
          h: instance.virtualDom.container.height || 0,
          x: instance.virtualDom.transformX,
          y: instance.virtualDom.transformY,
          z: instance.virtualDom.transformZ
        }
      }
    },

    // Register a new carousel instance
    registerInstance: (
      id: string,
      domElements: {carousel: HTMLElement; container: HTMLElement},
      options: Partial<HoloIOOptions> = {}
    ): CarouselInstance => {
      const virtualDom = createDefaultVirtualDom(id)
      // Apply custom options
      virtualDom.io = {...virtualDom.io, ...options}

      const Dom: DomState = {
        carousel: domElements.carousel,
        container: domElements.container
      }

      const instance: CarouselInstance = {
        id,
        virtualDom,
        Dom,
        touchState: createDefaultTouchState(),
        updateStyle: false
      }

      state = {
        ...state,
        instances: {
          ...state.instances,
          [id]: instance
        }
      }

      return {...instance}
    },

    // Update a carousel instance (partial update)
    updateInstance: (
      id: string,
      updates: Partial<CarouselInstance>
    ): CarouselInstance | undefined => {
      if (!state.instances[id]) return undefined

      const updated = {
        ...state.instances[id],
        ...updates,
        // Merge nested objects if they exist in updates
        virtualDom: updates.virtualDom
          ? {...state.instances[id].virtualDom, ...updates.virtualDom}
          : state.instances[id].virtualDom,
        Dom: updates.Dom
          ? {...state.instances[id].Dom, ...updates.Dom}
          : state.instances[id].Dom,
        touchState: updates.touchState
          ? {...state.instances[id].touchState, ...updates.touchState}
          : state.instances[id].touchState
      }

      state = {
        ...state,
        instances: {
          ...state.instances,
          [id]: updated
        }
      }

      return {...updated}
    },

    // Update only the virtual DOM state
    updateVirtualDom: (
      id: string,
      updates: Partial<VirtualDomState>
    ): VirtualDomState | undefined => {
      if (!state.instances[id]) return undefined

      const updatedVirtualDom = {
        ...state.instances[id].virtualDom,
        ...updates,
        // Handle nested objects
        carousel: updates.carousel
          ? {...state.instances[id].virtualDom.carousel, ...updates.carousel}
          : state.instances[id].virtualDom.carousel,
        container: updates.container
          ? {...state.instances[id].virtualDom.container, ...updates.container}
          : state.instances[id].virtualDom.container,
        io: updates.io
          ? {...state.instances[id].virtualDom.io, ...updates.io}
          : state.instances[id].virtualDom.io,
        item: updates.item
          ? {...state.instances[id].virtualDom.item, ...updates.item}
          : state.instances[id].virtualDom.item
      }

      state = {
        ...state,
        instances: {
          ...state.instances,
          [id]: {
            ...state.instances[id],
            virtualDom: updatedVirtualDom
          }
        }
      }

      return {...updatedVirtualDom}
    },

    // Update DOM state
    updateDom: (
      id: string,
      updates: Partial<DomState>
    ): DomState | undefined => {
      if (!state.instances[id]) return undefined

      const updatedDom = {
        ...state.instances[id].Dom,
        ...updates
      }

      state = {
        ...state,
        instances: {
          ...state.instances,
          [id]: {
            ...state.instances[id],
            Dom: updatedDom
          }
        }
      }

      return {...updatedDom}
    },

    // Update touch state
    updateTouchState: (
      id: string,
      updates: Partial<TouchState>
    ): TouchState | undefined => {
      if (!state.instances[id]) return undefined

      const updatedTouch = {
        ...state.instances[id].touchState,
        ...updates
      }

      state = {
        ...state,
        instances: {
          ...state.instances,
          [id]: {
            ...state.instances[id],
            touchState: updatedTouch
          }
        }
      }

      return {...updatedTouch}
    },

    // Update DOM style property
    updateStyle: (id: string, enableTransition: boolean): void => {
      if (!state.instances[id]) return

      state = {
        ...state,
        instances: {
          ...state.instances,
          [id]: {
            ...state.instances[id],
            updateStyle: enableTransition
          }
        }
      }
    },

    // Apply style to DOM element based on state
    applyDomTransform: (id: string): void => {
      const instance = state.instances[id]
      if (!instance) return

      // Apply transition style if needed
      if (instance.updateStyle) {
        instance.Dom.container.style.transitionDuration =
          instance.virtualDom.duration + 'ms'
        instance.Dom.container.style.transitionTimingFunction =
          instance.virtualDom.transitionTiming
      } else {
        instance.Dom.container.style.transitionDuration = '0ms'
        instance.Dom.container.style.transitionTimingFunction = 'linear'
      }

      // Apply transform
      instance.Dom.container.style.transform = `translate3d(${instance.virtualDom.transformX}px, ${instance.virtualDom.transformY}px, ${instance.virtualDom.transformZ}px)`
    },

    // Remove a carousel instance
    removeInstance: (id: string): boolean => {
      if (!state.instances[id]) return false

      const {[id]: removed, ...rest} = state.instances

      state = {
        ...state,
        instances: rest
      }

      return true
    },

    // Check if an instance exists
    hasInstance: (id: string): boolean => !!state.instances[id]
  }
}

// Create and export singleton store
export const holoStore = createHoloStore()

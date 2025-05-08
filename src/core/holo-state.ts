// src/core/holo-state.ts

import {cyre} from 'cyre'
import type {
  HoloVirtual,
  HoloShadow,
  HoloInstance,
  HoloIOOptions
} from '../types/interface'
import {DEFAULT_IO_OPTIONS, ANIMATION, EVENTS} from '../config/holo-config'
import {createEventIds} from '../config/holo-config'

/**
 * Create default virtual state with immutable pattern
 */
export const createDefaultVirtual = (id: string = ''): HoloVirtual => {
  return {
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
    endOfSlide: 0,
    endOfSlidePosition: 0,
    item: {
      max: 8,
      width: 0,
      height: 0,
      min: 1
    },
    noOfChildren: 0,
    startNumber: 0,
    // Add consistent event IDs
    eventIds: createEventIds(id)
  }
}

/**
 * Create default IO options
 */
export const createDefaultIOOptions = (id: string = ''): HoloIOOptions => {
  return {
    ...DEFAULT_IO_OPTIONS,
    id
  }
}

/**
 * Create default shadow state
 */
export const createDefaultShadow = (): HoloShadow => {
  return {
    carousel: {} as HTMLElement,
    container: {} as HTMLElement
  }
}

/**
 * Create an enhanced Holo instance with improved state management
 */
export const createHoloInstance = (
  slide: HTMLElement,
  io: Partial<HoloIOOptions> = {}
): HoloInstance => {
  // Ensure valid ID
  const id = slide.id || `holo-${Date.now()}`
  slide.id = id // Apply ID to element if it didn't have one

  // Find container or create one if missing
  const container = slide.getElementsByClassName(
    'holo-container'
  )[0] as HTMLElement

  if (!container) {
    console.error('@Holo: holo-container not found in:', id)
    throw new Error('Missing holo-container element')
  }

  // Create shadow DOM references
  const shadow: HoloShadow = {
    carousel: slide,
    container
  }

  // Create initial virtual state
  const virtual = createDefaultVirtual(id)

  // Apply custom IO options
  virtual.io = {
    ...virtual.io,
    ...io,
    id
  }

  // Get initial dimensions
  const carouselWidth = shadow.carousel.clientWidth || 0
  const carouselHeight = shadow.carousel.clientHeight || 0
  const containerWidth = shadow.container.clientWidth || 0
  const containerHeight = shadow.container.clientHeight || 0
  const childrenCount = shadow.container.children.length || 0

  // Initialize virtual state with dimensions
  const initializedVirtual = {
    ...virtual,
    carousel: {
      width: carouselWidth,
      height: carouselHeight
    },
    container: {
      width: containerWidth,
      height: containerHeight
    },
    noOfChildren: childrenCount,
    startNumber: 0,
    // Calculate end position based on orientation
    endOfSlidePosition: virtual.io.orientation
      ? -Math.max(0, containerHeight - carouselHeight)
      : -Math.max(0, containerWidth - carouselWidth)
  }

  // Register subscriber for state changes (prevent "no subscriber" error)
  const stateUpdatedId = `state_updated_${id}`

  // Add a simple subscriber to prevent no-subscriber errors
  cyre.on(stateUpdatedId, state => {
    // Do nothing - just a placeholder to avoid console errors
    return undefined
  })

  // Register action with throttling and change detection
  cyre.action({
    id: stateUpdatedId,
    throttle: 16, // ~60fps
    detectChanges: true // Only process if actual changes
  })

  // Create the interface for the instance with pure functions
  const instance: HoloInstance = {
    virtual: initializedVirtual,
    shadow,

    // Getters - Return immutable copies
    get getVirtual(): HoloVirtual {
      return {...this.virtual}
    },

    get getShadow(): HoloShadow {
      return this.shadow
    },

    get getState() {
      return {
        virtual: this.getVirtual,
        shadow: this.getShadow
      }
    },

    get getDimensions() {
      return {
        car: {
          w: this.shadow.carousel.clientWidth || 0,
          h: this.shadow.carousel.clientHeight || 0
        },
        con: {
          w: this.shadow.container.clientWidth || 0,
          h: this.shadow.container.clientHeight || 0,
          x: this.virtual.transformX,
          y: this.virtual.transformY,
          z: this.virtual.transformZ
        }
      }
    },

    // Setters - Update state and DOM with side effects
    set setState(updatedVirtual: HoloVirtual) {
      if (!updatedVirtual) return

      // Update virtual state immutably
      this.virtual = {...this.virtual, ...updatedVirtual}

      // Update DOM with side effect
      this.updateDOMTransform()

      // Notify about state update
      cyre.call(`state_updated_${id}`, this.virtual)
    },

    set setDimension(updatedVirtual: HoloVirtual) {
      if (!updatedVirtual) return

      // Update virtual state immutably
      this.virtual = {...this.virtual, ...updatedVirtual}

      // Update DOM dimensions with side effect
      this.updateDOMDimensions()
    },

    set updateStyle(on: number) {
      // Update transition style based on flag
      this.updateTransitionStyle(on === 1)
    },

    // Helper methods to update DOM
    updateDOMTransform() {
      if (!this.shadow.container) return

      // Apply transform to container
      this.shadow.container.style.transform = `translate3d(${this.virtual.transformX}px, ${this.virtual.transformY}px, ${this.virtual.transformZ}px)`
    },

    updateDOMDimensions() {
      if (!this.shadow.carousel) return

      // Apply dimensions based on orientation
      if (this.virtual.io.orientation) {
        this.shadow.carousel.style.height = `${this.virtual.carousel.height}px`
      } else {
        this.shadow.carousel.style.width = `${this.virtual.carousel.width}px`
      }
    },

    updateTransitionStyle(enableTransition: boolean) {
      if (!this.shadow.container) return

      // Set transition properties
      if (enableTransition) {
        this.shadow.container.style.transitionDuration = `${this.virtual.duration}ms`
        this.shadow.container.style.transitionTimingFunction =
          this.virtual.transitionTiming
      } else {
        this.shadow.container.style.transitionDuration = '0ms'
        this.shadow.container.style.transitionTimingFunction = 'linear'
      }
    }
  }

  return instance
}

/**
 * Update Holo instance with new options
 */
export const updateHoloInstance = (
  instance: HoloInstance,
  options: Partial<HoloIOOptions>
): HoloInstance => {
  if (!instance || !instance.virtual) {
    console.error('@Holo: Cannot update invalid instance')
    return instance
  }

  // Filter valid attributes only
  const validOptions = Object.entries(options).reduce((valid, [key, value]) => {
    if (key in instance.virtual.io) {
      return {...valid, [key]: value}
    }
    console.warn('@Holo: unknown carousel parameter:', key)
    return valid
  }, {})

  // Update IO options immutably
  const updatedIO = {
    ...instance.virtual.io,
    ...validOptions
  }

  // Update virtual state
  instance.setState = {
    ...instance.getVirtual,
    io: updatedIO
  }

  return instance
}

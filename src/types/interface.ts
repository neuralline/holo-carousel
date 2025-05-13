//src/types/interface.ts

/**
 * Types and interfaces for Holo Carousel
 */

export interface HoloDimensions {
  width: number
  height: number
}

/**
 * Extended item dimensions including gap information
 */
export interface HoloItemDimensions extends HoloDimensions {
  max?: number
  min?: number
  actualWidth?: number // Width of the item without gap
  actualHeight?: number // Height of the item without gap
  gap?: number // Size of the gap between items
}

/**
 * Input/Output options for carousel configuration
 */
export interface HoloIOOptions {
  id: string
  enabled: number
  wheel: number
  controller: number
  drag: number
  swipe: number
  snap: number
  focus: number
  animate: number
  animateDirection: number
  duration: number
  loop: number
  orientation: number
  active: boolean
  onClick: boolean
  onDoubleClick: boolean
}

/**
 * Virtual state representation of carousel
 */
export interface HoloVirtual {
  id: string
  carousel: Partial<HoloDimensions>
  container: Partial<HoloDimensions>
  io: HoloIOOptions
  title: string | null
  description: string | null
  duration: number
  transitionTiming: string
  transformX: number
  transformY: number
  transformZ: number
  numberOfSlots: number
  endOfSlide: number
  endOfSlidePosition: number
  item: HoloItemDimensions
  noOfChildren: number
  startNumber: number
  eventIds?: {
    animate?: string
    snap?: string
    prevSlide?: string
    nextSlide?: string
    lastSlide?: string
    firstSlide?: string
    goToSlide?: string
    activate?: string
    refresh?: string
    transform?: string
    stateUpdate?: string
    dimensionUpdate?: string
    error?: string
  }
}

/**
 * Shadow state for DOM references
 */
export interface HoloShadow {
  carousel: HTMLElement
  container: HTMLElement
}

/**
 * Combined state wrapper
 */
export interface HoloState {
  virtual: HoloVirtual
  shadow: HoloShadow
}

/**
 * Holo instance with getters and setters
 */
export interface HoloInstance {
  virtual: HoloVirtual
  shadow: HoloShadow
  get getVirtual(): HoloVirtual
  get getShadow(): HoloShadow
  get getState(): HoloState
  get getDimensions(): {
    car: {w: number; h: number}
    con: {w: number; h: number; x: number; y: number; z: number}
  }
  set setState(virtual: HoloVirtual)
  set setDimension(virtual: HoloVirtual)
  set updateStyle(on: number)
  updateDOMTransform(): void
  updateDOMDimensions(): void
  updateTransitionStyle(enableTransition: boolean): void
}

/**
 * Global database of carousel instances
 */
export interface HoloDatabase {
  [key: string]: HoloInstance
}

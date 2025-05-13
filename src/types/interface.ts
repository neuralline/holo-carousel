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

  // New options
  nestedMode?: number // 0 = normal, 1 = allow nested carousels
  accordionMode?: number // 0 = normal, 1 = accordion mode
  deepLinking?: number // 0 = disabled, 1 = enabled
}

/**
 * Accordion state for tracking open/closed panels
 */
export interface AccordionState {
  openPanels: number[]
  previouslyOpen?: number[]
  expandedHeight?: number
  expandedWidth?: number
  collapsedHeight?: number
  collapsedWidth?: number
}

/**
 * Accordion options
 */
export interface AccordionOptions {
  mode: number
  expand: number
  defaultOpen: number
  animation: number
  headerHeight: number
  headerWidth: number
}

/**
 * Deep linking options
 */
export interface DeepLinkingOptions {
  enabled: boolean
  paramPrefix: string
  updateHistory: boolean
  scrollToCarousel: boolean
  nestedSeparator: string
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

  // Event IDs for this carousel
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

  // New feature states
  accordionState?: AccordionState
  accordionOptions?: AccordionOptions
  deepLinkingOptions?: DeepLinkingOptions

  // Nested carousel relationships
  parentId?: string
  childIds?: string[]
  nestedLevel?: number

  // Internal state properties
  _nestedOriginalSettings?: any
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

/**
 * Relationship between parent and child carousels
 */
export interface HoloRelationship {
  id: string
  parentId?: string
  childIds: string[]
  level: number
}
/**
 * TouchState interface for tracking touch interactions
 */
export interface TouchState {
  id: string | null
  virtual: HoloVirtual | null
  startX: number
  startY: number
  currentX: number
  currentY: number
  lastX: number // Added to track direction more accurately
  lastY: number // Added to track direction more accurately
  distanceX: number
  distanceY: number
  directionX: number // Added to explicitly track direction (1 = right, -1 = left)
  directionY: number // Added to explicitly track direction (1 = down, -1 = up)
  velocityX: number
  velocityY: number
  startTransformX: number
  startTransformY: number
  pressed: boolean
  startTime: number
  multiplier: number
  orientation: boolean
  targetElement: HTMLElement | null
  moved: boolean // Added to differentiate between taps and actual swipes
  isNested: boolean // Added to track if this is a nested carousel
}
/**
 * Configuration interface for deep linking
 */
export interface DeepLinkingOptions {
  enabled: boolean
  paramPrefix: string // Default: 'slide'
  updateHistory: boolean // Update browser history
  scrollToCarousel: boolean // Scroll to carousel when navigating via URL
  nestedSeparator: string // Separator for nested carousel IDs (default: '.')
}

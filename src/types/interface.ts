//src/types/interface.ts

import type {CyreBranch} from 'cyre'

// A carousel's (or accordion's) own Cyre v5 branch: holo/<id> or
// accordion/<id>. Every channel the instance owns lives on it, so two
// instances can use the same local ids without colliding.
export type HoloBranch = CyreBranch

// Core carousel state interfaces
export interface VirtualDomState {
  id: string
  carousel: {
    width?: number
    height?: number
  }
  container: {
    width?: number
    height?: number
  }
  io: HoloIOOptions
  title: string | null
  description: string | null
  /** slide transition length in ms (io.transition, 0 with reduced motion) */
  duration: number
  transitionTiming: string
  transformX: number
  transformY: number
  transformZ: number
  /** items visible at once */
  numberOfSlots: number
  /** 1 = at the start, -1 = at the end, 0 = in between (kept from v2) */
  endOfSlide: number
  /** furthest the container can move (negative px) */
  endOfSlidePosition: number
  noOfChildren?: number
  startNumber?: number
  /** first visible item */
  index: number
  /** last index the first visible item can have (count - slots) */
  maxIndex: number
  /** items moved by one next/prev */
  step: number
  page: number
  pages: number
  item: {
    width?: number
    height?: number
    min?: number
    max?: number
  }
}

export interface DomState {
  carousel: HTMLElement
  container: HTMLElement
  /** built by io.controller */
  controls?: {
    root: HTMLElement
    prev: HTMLButtonElement
    next: HTMLButtonElement
    dots: HTMLElement
    play?: HTMLButtonElement
  }
  width?: number
  height?: number
  transformX?: number
  transformY?: number
  transformZ?: number
}

export interface TouchState {
  pressed: boolean
  /** the pointer moved far enough along the carousel's axis to drag */
  dragging: boolean
  /** the gesture went across the axis: the page scrolls, Holo lets go */
  cancelled: boolean
  pointerId: number
  positionX: number
  positionY: number
  currentX: number
  currentY: number
  id?: string
  multiplier: number
  virtual?: VirtualDomState
  snapShotWidth?: number
  snapShotHeight?: number
  distance?: number
  TouchStartTimeStamp?: number
  /** recent [time, position] samples, for the release velocity */
  samples: Array<[number, number]>
  /** swallow the click that ends a drag */
  suppressClick: boolean
  targetHoloComponent?: HTMLElement | null
}

export interface HoloIOOptions {
  id: string
  enabled: number
  /** mouse wheel / trackpad navigation */
  wheel: number
  /** build prev/next buttons and dots */
  controller: number
  /** mouse drag */
  drag: number
  /** touch / pen swipe */
  swipe: number
  /** snap to whole items on release (0 = free) */
  snap: number
  /** clicking an item brings it into view and marks it active */
  focus: number
  /** auto-play (0 = off) */
  animate: number
  animateDirection: number
  /** auto-play interval in ms (0 = 5000) */
  duration: number
  /** next on the last item goes back to the first (and prev the other way) */
  loop: number
  orientation: number
  /** items moved per next/prev (0 = a page: every visible item) */
  step: number
  /** items visible at once (0 = as many as fit) */
  slots: number
  /** slide transition in ms */
  transition: number
  /** arrow keys, Home / End when the carousel has focus */
  keyboard: number
  active: boolean
  onClick: boolean
  onDoubleClick: boolean
}

/** why auto-play is held: hover, focus, pointer, hidden, offscreen, user */
export type HoldReason =
  | 'hover'
  | 'focus'
  | 'pointer'
  | 'hidden'
  | 'offscreen'
  | 'user'

export interface CarouselInstance {
  id: string
  virtualDom: VirtualDomState
  Dom: DomState
  touchState: TouchState
  updateStyle: boolean
  branch: HoloBranch
  /** auto-play holds; auto-play runs only while this is empty */
  hold: Partial<Record<HoldReason, true>>
  /** removes this carousel's DOM listeners and observers */
  cleanup: () => void
  /** a pending requestAnimationFrame for the drag */
  frame: number
}

/** page-wide Holo state: one per page, shared by every carousel */
export interface HoloSystemState {
  initialized: boolean
  /** the holo branch every carousel branch sits under */
  root: HoloBranch | null
  /** the carousel a pointer is pressed on */
  pressedId: string | null
  /** ids already built by the AUTO scan */
  autoInitialized: Record<string, true>
  /** for ids of carousels without an id attribute */
  sequence: number
  /** removes the page-wide listeners */
  cleanup: () => void
}

export interface HoloState {
  system: HoloSystemState
  instances: Record<string, CarouselInstance>
}

/** what Holo.on(id, 'change', fn) receives */
export interface HoloChange {
  id: string
  index: number
  page: number
  pages: number
  count: number
  slots: number
  atStart: boolean
  atEnd: boolean
}

// --- Accordion --------------------------------------------------------
// Mirrors the Holo carousel's own shape one-for-one: a HoloBranch,
// per-instance options, and a state directory that owns every instance
// rather than components holding their own local maps.

export interface AccordionIOOptions {
  id: string
  enabled: number
  multiple: number // 1 = allow more than one panel open at a time
  duration: number // ms, panel expand/collapse transition
  startOpen: number // index open by default, -1 = none
}

export interface AccordionItemState {
  id: string
  header: HTMLElement
  panel: HTMLElement
  open: boolean
}

export interface AccordionInstance {
  id: string
  root: HTMLElement
  items: AccordionItemState[]
  io: AccordionIOOptions
  branch: HoloBranch
  /** removes this accordion's DOM listeners */
  cleanup?: () => void
}

export interface AccordionState {
  root: HoloBranch | null
  autoInitialized: Record<string, true>
  sequence: number
  instances: Record<string, AccordionInstance>
}

export interface CyreEvent {
  id: string
  payload?: any
}

export interface TouchEvents {
  start: string
  move: string
  end: string
  enter: string
}

export interface StyleOptions {
  transitionDuration: string
  transitionTimingFunction: string
}

export interface SlidePosition {
  x?: number
  y?: number
}

export interface DimensionResult {
  car: {
    w: number
    h: number
  }
  con: {
    w: number
    h: number
    x: number
    y: number
    z: number
  }
}

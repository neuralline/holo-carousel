//src/types/interface.ts

import type {CyreBranch, CyreControl, CyrePublic} from 'cyre'
import type {Gesture} from '../config/holo-config'
import type {GestureTuning} from '../components/holo-tune'

// A Holo instance's branch (holo), a carousel's (holo/<id>, nested
// holo/<id>/<child>) or an accordion's. Every channel a carousel owns
// lives on its own branch, so carousels never collide.
export type HoloBranch = CyreBranch

/** a node Holo can hang its branch under: root cyre or one of the app's branches */
export type CyreNode = CyrePublic | CyreBranch

/** what a stage effect draws for one item */
export interface StageStyle {
  transform: string
  opacity: number
  zIndex: number
  /** wipes and irises reveal by clipping */
  clipPath?: string
}

export interface StageContext {
  /** item size along the axis */
  size: number
  count: number
  vertical: boolean
}

/**
 * A stage effect: how to draw an item from its distance `d` to the
 * current position (fractional while moving; shortest way round when the
 * carousel wraps). `raw` is the plain index - track, for effects that
 * wrap their own way (shuffle).
 */
export interface HoloEffectDefinition {
  name: string
  style: (d: number, index: number, context: StageContext, raw: number) => StageStyle
  /** 3D depth (carousel perspective, px) */
  perspective?: number
  /** room above and below for cards that scatter or swing (px) */
  margin?: number
  /** always wraps (the last item next to the first) */
  wraps?: boolean
  /** hide items' backs (cards that turn over) */
  backface?: boolean
}

export type HoloEffect =
  | 'slide'
  | 'center'
  | 'fade'
  | 'ring'
  /** every item shown, in wrapping rows (3.5) - nothing moves */
  | 'grid'
  /** every item shown, stacked (3.5) - nothing moves */
  | 'list'
  | 'coverflow'
  | 'album'
  | 'shuffle'
  | 'flip'
  | 'cube'
  | 'zoom'
  | 'cover'
  | 'reveal'
  | 'wipe'
  | 'iris'
  | 'kenburns'
  | (string & {})

/** fill a slot with one item; called again when the item changes */
export type HoloRender<T = any> = (item: T, index: number, slot: HTMLElement) => void

// --- options -----------------------------------------------------------

/** what an app passes to holo.create(...) / data-* attributes */
export interface HoloOptions<T = any> {
  /** carousel id (default: the element's id, or holo-<n>) */
  id?: string
  enabled?: boolean | number
  /** mouse wheel / trackpad */
  wheel?: boolean | number
  /** prev / next buttons, dots, pause button */
  controller?: boolean | number
  drag?: boolean | number
  swipe?: boolean | number
  /** land on whole items on release (false = free glide) */
  snap?: boolean | number
  /** clicking an item brings it into view */
  focus?: boolean | number
  keyboard?: boolean | number
  /** auto-play: true (every `duration` ms) or an interval in ms */
  animate?: boolean | number
  animateDirection?: 1 | -1
  /** auto-play interval in ms */
  duration?: number
  /** false, 'rewind' (jump back at the ends) or 'infinite' (seamless) */
  loop?: boolean | number | 'rewind' | 'infinite'
  orientation?: 0 | 1 | 'horizontal' | 'vertical'
  /** 'auto' (the page's direction), 'ltr' or 'rtl': a horizontal carousel
   *  runs right to left in rtl (drag, keys, arrows and effects mirror) */
  direction?: 'auto' | 'ltr' | 'rtl'
  /** the carousel's height follows the tallest visible item */
  autoHeight?: boolean | number
  /** pinch, ctrl+wheel or double-tap zooms the current item; pan while
   *  zoomed. true = up to 3x, a number = that max scale */
  pinchZoom?: boolean | number
  /** items per next / prev (0 = a page) */
  step?: number
  /** items visible at once (0 = as many as fit) */
  slots?: number
  /** slide transition in ms */
  transition?: number
  effect?: HoloEffect
  /** options by minimum carousel width: {0: {slots: 1}, 768: {slots: 3}} */
  breakpoints?: Record<number, Partial<HoloOptions>>
  /** load data-src images this many pages ahead (0 = off) */
  lazy?: boolean | number
  /** keep the position in the URL: #<hash>=<index> */
  hash?: string
  /** this carousel's slides are pages: one path segment each (data-route,
   *  route(item, index), or the number); routed carousels inside a slide
   *  are the next segment */
  route?: boolean | ((item: T, index: number) => string)
  /** register channels and listeners only once the carousel is near the screen */
  defer?: boolean

  /** while images or async items load: 'shimmer' (default), 'pulse', 'blur', 'none' */
  placeholder?: 'shimmer' | 'pulse' | 'blur' | 'none'
  /** skeleton slots while items load (default: as many as fit) */
  placeholders?: number
  /** a bar counting down to the next auto-play move */
  progress?: boolean | number
  /** [data-build] content in the current slide animates in, in turn */
  builds?: boolean | number

  // data mode
  /** the items - or a promise of them (placeholders show until it settles) */
  items?: T[] | Promise<T[]> | (() => Promise<T[]>)
  render?: HoloRender<T>
  /** stable key per item, so updates reuse slots */
  /** a property name ('id') or a function giving each item a stable key */
  key?: string | ((item: T, index: number) => string | number)
  /** called when a slot is emptied (unmount framework content here) */
  unrender?: (slot: HTMLElement, item: T) => void

  // groups (3.6)
  /** sort the items into groups - a heading and a lane each, every lane moving on its own; the look (effect) is every lane's */
  group?: (item: T, index: number) => string | number
  /** a group's heading text (default: its key) */
  groupLabel?: (key: string, items: T[]) => string
  /** draw a group's heading yourself */
  renderGroup?: (key: string, items: T[], head: HTMLElement) => void
  /** the most groups it shows: a lane each, made with the carousel - before a Cyre lock (default 8) */
  groups?: number
  /** keep only the visible items (plus `buffer` either side) in the DOM */
  virtual?: boolean
  buffer?: number
  /** a released drag glides on by its speed (default true) */
  momentum?: boolean | number
  /** release speed (px/ms at the strip) that counts as a flick; default page tune */
  flick?: number
  /** max items a fling may travel (`maxGlide` in tune) */
  glide?: number
  /** how fast a glide slows (px/ms²); higher = shorter flings (`deceleration`) */
  brake?: number
  /** override global tune() for this carousel only (slopTouch, axisLock, …) */
  gesture?: Partial<GestureTuning>
}

/** the normalised options a carousel runs on (numbers, so data-* fit) */
export interface HoloIOOptions {
  id: string
  enabled: number
  wheel: number
  controller: number
  drag: number
  swipe: number
  snap: number
  focus: number
  keyboard: number
  animate: number
  animateDirection: number
  duration: number
  /** 0 = off, 1 = rewind, 2 = infinite */
  loop: number
  orientation: number
  direction: string
  autoHeight: number
  pinchZoom: number
  step: number
  slots: number
  transition: number
  effect: HoloEffect
  lazy: number
  hash: string
  defer: number
  virtual: number
  buffer: number
  momentum: number
  route: number
  placeholder: string
  placeholders: number
  progress: number
  builds: number
  active: boolean
  onClick: boolean
  onDoubleClick: boolean
}

// --- carousel state ----------------------------------------------------

export interface VirtualDomState {
  id: string
  carousel: {width?: number; height?: number}
  container: {width?: number; height?: number}
  io: HoloIOOptions
  title: string | null
  description: string | null
  /** transition in ms (0 with reduced motion) */
  duration: number
  transitionTiming: string
  /** rendered container offset (slide / center) */
  transformX: number
  transformY: number
  transformZ: number
  /** items visible at once */
  numberOfSlots: number
  /** 1 = at the start, -1 = at the end, 0 = in between */
  endOfSlide: number
  /** furthest the strip can move (negative px) */
  endOfSlidePosition: number
  /** item count */
  noOfChildren: number
  startNumber?: number
  /** first visible (or active) item, 0..count-1 */
  index: number
  /** furthest index without wrapping */
  maxIndex: number
  /**
   * continuous position in items. Equals index unless the carousel wraps
   * (infinite loop, ring, fading loop), where it keeps counting past the
   * ends so the motion never runs backwards. A drag makes it fractional.
   */
  track: number
  /** the carousel wraps around (track can leave 0..maxIndex) */
  wrap: boolean
  /** a horizontal carousel running right to left */
  rtl?: boolean
  /** the track as drawn right now (behind `track` while a move animates) */
  shown: number
  /** length of the current move (ms): longer for longer glides */
  moveDuration: number
  /**
   * speed (items/ms) the current move starts at, for moves that continue
   * a gesture (a released drag, a trackpad swipe); null for commands
   * (buttons, keys, auto-play), which ease out
   */
  launch: number | null
  /** elastic snap-back from an overscroll (not a fling) */
  spring: boolean
  /** items moved by one next / prev */
  step: number
  page: number
  pages: number
  /** carousel viewport size along its axis (px) */
  viewport: number
  /** where each item starts, when items differ in size (slide); null when all match */
  offsets: number[] | null
  item: {width?: number; height?: number; min?: number; max?: number}
}

export interface DomState {
  carousel: HTMLElement
  container: HTMLElement
  controls?: {
    root: HTMLElement
    prev: HTMLButtonElement
    next: HTMLButtonElement
    dots: HTMLElement
    play?: HTMLButtonElement
  }
}

export interface TouchState {
  pressed: boolean
  dragging: boolean
  /** the gesture went across the axis: the page has it, Holo only watches */
  cancelled: boolean
  pointerType: string
  /** a long press fired during this press */
  longPressed: boolean
  /** the press caught a move mid-glide (it stopped where it was) */
  caught: boolean
  longPressTimer: ReturnType<typeof setTimeout> | 0
  /** clicks before this time (ms) are swallowed: they end a drag */
  suppressUntil: number
  /** the last tap, for double taps */
  lastTap: {time: number; x: number; y: number}
  /** a trackpad gesture in progress */
  wheel: {
    /** '' none, 'main' following the fingers, 'cross' the page's, 'glide' flung: Holo carries it, the system's tail is swallowed */
    axis: '' | 'main' | 'cross' | 'glide'
    last: number
    /** movement gathered before deciding whose the gesture is */
    main: number
    cross: number
    timer: ReturnType<typeof setTimeout> | 0
    /** the last event's size (px), the biggest so far, and how many in a row shrank / grew */
    prev: number
    peak: number
    falling: number
    rising: number
  }
  pointerId: number
  positionX: number
  positionY: number
  currentX: number
  currentY: number
  /** track when the drag started */
  startTrack: number
  TouchStartTimeStamp?: number
  /** recent [time, track] samples, for the release velocity */
  samples: Array<[number, number]>
  targetHoloComponent?: HTMLElement | null
}

/** items and slots of a carousel built from data */
export interface DataState {
  items: unknown[]
  keys: string[]
  render: HoloRender
  key?: string | ((item: any, index: number) => string | number)
  unrender?: (slot: HTMLElement, item: any) => void
  /** slot element per key (or per track position when virtual) */
  slots: Record<string, HTMLElement>
  /** item each slot last rendered */
  rendered: Record<string, unknown>
  /** spare slots for the virtual window */
  pool: HTMLElement[]
  /** items are on their way: skeleton slots stand in */
  loading: boolean
  /** a pending draw of new items (one per frame) */
  frame: number
}

export type HoldReason = 'hover' | 'focus' | 'pointer' | 'hidden' | 'offscreen' | 'user'

export interface CarouselInstance {
  /** local id (also the element id) */
  id: string
  /** full branch path, e.g. ui/holo/gallery/thumbs */
  path: string
  /** path of the Holo instance it belongs to */
  holo: string
  /** path of the carousel it is nested in */
  parent: string | null
  children: string[]
  virtualDom: VirtualDomState
  /** null for a headless carousel */
  Dom: DomState | null
  touchState: TouchState
  updateStyle: boolean
  branch: HoloBranch
  hold: Partial<Record<HoldReason, true>>
  /** options as created, before breakpoints */
  baseIo: HoloIOOptions
  breakpoints: Array<[number, Partial<HoloIOOptions>]>
  /** the breakpoint now applied (-1 = none) */
  breakpoint: number
  data: DataState | null
  /** removes the listeners and controls its options asked for */
  cleanup: () => void
  /** removes the resize / load observers */
  unobserve: () => void
  /** removes links to other carousels (and a preset's controls) */
  links: Array<() => void>
  /** a preset's own state (the furthest step reached, ...) */
  meta: Record<string, unknown>
  frame: number
  /** a running move animation (stage effects) */
  tween: {from: number; to: number; start: number; duration: number; frame: number} | null
  /** an elastic settle at an end is drawing (unclamped, from what is seen) */
  springing?: boolean
  /** channels registered (false while deferred) */
  loaded: boolean
  /** a timer that normalises a wrapped track after a move */
  settleTimer: ReturnType<typeof setTimeout> | 0
}

/** an element (or list) bound to a channel; its slots for keyed lists */
export interface BindingRecord {
  id: string
  kind: 'bind' | 'list' | 'input'
  unbind: () => void
  slots: Record<string, HTMLElement>
  rendered: Record<string, unknown>
}

/** one useHolo() */
export interface HoloInstanceState {
  path: string
  root: HoloBranch
  /** this instance started Cyre (no app did) */
  owns: boolean
  control: CyreControl | null
  /** top-level carousel paths */
  carousels: string[]
  /** elements bound to channels (holo.bind / list / bindInput) */
  bindings: Record<string, BindingRecord>
}

/** the router (one per page) */
export interface HoloRouterState {
  /** '' until started */
  mode: '' | 'hash' | 'history'
  base: string
  titles: boolean
  baseTitle: string
  /** moving carousels to a path (their changes don't write it back) */
  applying: boolean
  cleanup: () => void
}

/** page-wide state shared by every Holo instance */
export interface HoloSystemState {
  /** the carousel a pointer is pressed on */
  pressedPath: string | null
  /** carousels using the page-wide listeners */
  listeners: number
  cleanup: () => void
  sequence: number
  /** element id -> carousel path, for the id-based API */
  ids: Record<string, string>
  /** the instance the v2 global API (Holo.INIT, ...) uses */
  defaultHolo: string
  router: HoloRouterState
}

export interface HoloState {
  system: HoloSystemState
  holos: Record<string, HoloInstanceState>
  carousels: Record<string, CarouselInstance>
  /** registered stage effects by name */
  effects: Record<string, HoloEffectDefinition>
  /** gesture tuning, page-wide (defaults: GESTURE in config) */
  gesture: Gesture
}

/** what Holo.on(id, 'change', fn) receives */
export interface HoloChange {
  id: string
  path: string
  index: number
  page: number
  pages: number
  count: number
  slots: number
  atStart: boolean
  atEnd: boolean
  /** a grouped carousel: the group whose lane moved */
  group?: string
}

// --- Accordion --------------------------------------------------------

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

export interface DimensionResult {
  car: {w: number; h: number}
  con: {w: number; h: number; x: number; y: number; z: number}
}

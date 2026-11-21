//src/config/holo-config.ts

/**
 * Holo Carousel Configuration
 */

// Branch every carousel's own branch sits under: holo/<carousel id>
export const HOLO_BRANCH = 'holo'

// Event IDs
//
// REFRESH_SCREEN is the one page-wide channel (holo/refresh-screen) - it
// fans out to every carousel's own REFRESH_CAROUSEL channel.
//
// Every other id is a *local* channel id, registered on each carousel's
// own branch (holo/<id>/next-slide, ...), so two carousels never collide.
export const EVENTS = {
  // Page-wide event
  REFRESH_SCREEN: 'refresh-screen',

  // Per-carousel (branch-local) events
  REFRESH_CAROUSEL: 'refresh-carousel',
  SNAP: 'snap',
  SHAKE: 'shake',
  SETTLE: 'settle',

  // Navigation events
  GO_TO: 'go-to',
  ANIMATE: 'animate',
  ANIMATE_FORWARD: 'animate-forward',
  ANIMATE_BACKWARD: 'animate-backward',
  NEXT_SLIDE: 'next-slide',
  PREV_SLIDE: 'prev-slide',
  FIRST_SLIDE: 'first-slide',
  LAST_SLIDE: 'last-slide',
  ACTIVATE: 'activate',
  WHEELER: 'wheeler',

  // Gestures (emitted; subscribe with carousel.on('swipe', fn) ...)
  TAP: 'tap',
  DOUBLE_TAP: 'double-tap',
  LONG_PRESS: 'long-press',
  SWIPE: 'swipe',

  // Data mode: the item list (call it from anywhere to replace the items)
  ITEMS: 'items',

  // Emitted after the visible items change: Holo.on(id, 'change', fn)
  CHANGE: 'change'
} as const

// The class every carousel element carries once built, and the attribute
// with its branch path (how nested carousels find their nearest one)
export const PATH_ATTRIBUTE = 'data-holo-path'

// Default animation settings
export const ANIMATION = {
  DURATION: 600,
  TIMING: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  /** auto-play interval when io.duration is 0 */
  INTERVAL: 5000
}

// Gesture tuning
export const GESTURE = {
  /** px a pointer moves before Holo decides what the gesture is */
  SLOP: 6,
  SLOP_MOUSE: 4,
  SLOP_TOUCH: 10,
  /** within this angle of the carousel's axis (deg) a move is a drag */
  AXIS_LOCK: 35,
  /** beyond this angle (deg) it is a move across: the page scrolls */
  AXIS_CROSS: 55,
  /** ms a still press takes to become a long press */
  LONG_PRESS: 500,
  /** ms and px between two taps that make a double tap */
  DOUBLE_TAP: 300,
  DOUBLE_TAP_DISTANCE: 30,
  /** a move this long (px) on release is reported as a swipe */
  SWIPE_MIN: 30,
  /** ms after a drag or long press during which clicks are swallowed */
  CLICK_GUARD: 400,
  /** ms without wheel events that ends a trackpad gesture */
  WHEEL_IDLE: 110,
  /** px a trackpad gesture moves before Holo decides whose it is */
  WHEEL_DECIDE: 4,
  /** a trackpad swipe that moved this far (items) lands on the next item */
  WHEEL_INTENT: 0.3,
  /** how fast a released glide slows down (px/ms²) - lower glides further */
  DECELERATION: 0.0035,
  /** the furthest one glide goes (items) */
  MAX_GLIDE: 40,
  /** longest move animation (ms), for long glides */
  GLIDE_MAX_DURATION: 1800,
  /** how far past either end a drag can pull, as a share of the distance */
  RESISTANCE: 0.3,
  /** release speed (px/ms) that counts as a flick */
  FLICK: 0.35,
  /** ms of travel a flick is projected forward by */
  MOMENTUM: 220,
  /** ms of samples the release velocity is read from */
  VELOCITY_WINDOW: 100,
  /** the nudge at an end with nothing further to show (px) */
  SHAKE: 28,
  /** ms between wheel steps, so one trackpad swipe moves once */
  WHEEL_THROTTLE: 450,
  /** ms resize / image loads are gathered before re-measuring */
  REFRESH_DEBOUNCE: 60
}

// Default IO options
export const DEFAULT_IO_OPTIONS = {
  id: '', // Will be populated with carousel ID
  enabled: 1, // Enable/disable carousel
  wheel: 0, // Mouse wheel navigation
  controller: 0, // Built-in prev/next buttons and dots
  drag: 1, // Mouse drag
  swipe: 1, // Touch swipe
  snap: 1, // Snap to whole items on release (0 = free)
  focus: 1, // Clicking an item brings it into view
  animate: 0, // Auto-play (0=off)
  animateDirection: 1, // Auto-play direction (1=forward, -1=backward)
  duration: 0, // Auto-play interval (ms, 0 = 5000)
  loop: 0, // next/prev wrap around at the ends
  orientation: 0, // 0=horizontal, 1=vertical
  step: 0, // Items per next/prev (0 = a page)
  slots: 0, // Items visible at once (0 = as many as fit)
  transition: 600, // Slide transition (ms)
  keyboard: 1, // Arrow keys / Home / End when focused
  effect: 'slide' as const, // slide | center | fade | ring
  lazy: 1, // load data-src images this many pages ahead
  hash: '', // keep the position in the URL (#<hash>=<index>)
  defer: 0, // set up only once near the screen
  virtual: 0, // keep only the visible items in the DOM (data mode)
  buffer: 2, // items rendered beyond each side of a virtual window
  momentum: 1, // 1 = a released drag glides on by its speed; 0 = it stops where it was let go
  placeholder: 'shimmer', // while images or async items load: shimmer | pulse | blur | none
  placeholders: 0, // skeleton slots while items load (0 = as many as fit)
  progress: 0, // a bar counting down to the next auto-play move
  builds: 0, // [data-build] content in the current slide animates in, in turn
  active: true, // Whether carousel is active
  onClick: true, // Enable click events
  onDoubleClick: false // Enable double-click events
}

// Options readable from data-* attributes on the carousel element
// (data-animate="1" data-duration="4000" data-loop="1" ...)
export const DATA_OPTIONS = [
  'enabled',
  'wheel',
  'controller',
  'drag',
  'swipe',
  'snap',
  'focus',
  'animate',
  'animateDirection',
  'duration',
  'loop',
  'orientation',
  'step',
  'slots',
  'transition',
  'keyboard',
  'lazy',
  'defer',
  'virtual',
  'buffer',
  'momentum',
  'placeholders',
  'progress',
  'builds'
] as const

// data-* options that are words, not numbers
export const DATA_WORDS = ['effect', 'hash', 'loop', 'orientation', 'placeholder'] as const

// Options that change which listeners / controls a carousel has; a
// breakpoint that changes one of them sets the features up again
export const FEATURE_OPTIONS = [
  'enabled',
  'wheel',
  'controller',
  'drag',
  'swipe',
  'keyboard',
  'animate',
  'duration',
  'effect',
  'orientation',
  'virtual',
  'progress',
  'builds',
  'placeholder'
] as const

// Effects that always wrap: the last item sits next to the first
export const WRAPPING_EFFECTS = ['ring', 'shuffle']

// Effects whose items are stacked in one place and drawn one by one from
// the track each frame (Holo tweens the track, so every card can follow
// its own path - a shuffled card swings out and back under the deck)
export const STAGE_EFFECTS = [
  'coverflow',
  'album',
  'shuffle',
  'flip',
  'cube',
  'zoom',
  // presentation transitions
  'cover',
  'reveal',
  'wipe',
  'iris',
  'kenburns'
]

// Effects that show one item in the middle (one step per move)
export const SINGLE_EFFECTS = ['fade', 'ring', ...STAGE_EFFECTS]

// 3D depth for the stage effects (carousel perspective, px)
export const PERSPECTIVE: Record<string, number> = {
  coverflow: 1200,
  shuffle: 1600,
  flip: 1000,
  cube: 1000
}

// CSS class names (for consistency)
export const CSS_CLASSES = {
  CAROUSEL: 'holo-carousel',
  CONTAINER: 'holo-container',
  ITEM: 'holo',
  ACTIVE: 'active',
  TRANSITION: 'transition',
  DRAGGING: 'holo-dragging',
  VISIBLE: 'holo-visible',
  CONTROLS: 'holo-controls',
  PREV: 'holo-prev',
  NEXT: 'holo-next',
  DOTS: 'holo-dots',
  DOT: 'holo-dot',
  PLAY: 'holo-play',
  VERTICAL: 'holo-vertical',
  PAUSED: 'holo-paused',
  CURRENT: 'holo-current',
  CURRENT_SLIDE: 'holo-current-slide',
  SKELETON: 'holo-skeleton',
  LOADING: 'holo-loading',
  LOADED: 'holo-loaded',
  ENTER: 'holo-enter',
  PROGRESS: 'holo-progress',
  BURNING: 'holo-burning'
}

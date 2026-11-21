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

  // Emitted after the visible items change: Holo.on(id, 'change', fn)
  CHANGE: 'change'
} as const

// Default animation settings
export const ANIMATION = {
  DURATION: 600,
  TIMING: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  /** auto-play interval when io.duration is 0 */
  INTERVAL: 5000
}

// Gesture tuning
export const GESTURE = {
  /** px the pointer moves before Holo decides drag vs page scroll */
  SLOP: 6,
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
  'keyboard'
] as const

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
  PLAY: 'holo-play'
}

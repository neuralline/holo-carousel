//src/config/holo-config.ts

/**
 * Holo Carousel Configuration
 */

// Event IDs
export const EVENTS = {
  // Carousel events
  REFRESH_CAROUSEL: 'refresh carousel',
  REFRESH_SCREEN: 'refresh screen',
  SNAP: 'SNAP',
  SHAKE: 'SHAKE',

  // Navigation events
  ANIMATE: 'Animate',
  ANIMATE_FORWARD: 'AnimateForward',
  ANIMATE_BACKWARD: 'AnimateBackward',
  NEXT_SLIDE: 'nxtSlide',
  PREV_SLIDE: 'prvSlide',
  FIRST_SLIDE: 'firstSlide',
  LAST_SLIDE: 'lastSlide',
  ACTIVATE: 'activate',
  WHEELER: 'wheeler',

  // Error events
  ERROR: 'holo-error'
}

// Default animation settings
export const ANIMATION = {
  DURATION: 600,
  TIMING: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
}

// Default IO options
export const DEFAULT_IO_OPTIONS = {
  id: '', // Will be populated with carousel ID
  enabled: 1, // Enable/disable carousel
  wheel: 0, // Mouse wheel navigation
  controller: 0, // Built-in controllers
  drag: 1, // Mouse drag
  swipe: 1, // Touch swipe
  snap: 3, // Snap behavior (0=none, 1=loose, 2=medium, 3=strict)
  focus: 1, // Focus on active slide
  animate: 0, // Auto-animation (0=off)
  animateDirection: 1, // Animation direction (1=forward, -1=backward)
  duration: 600, // Animation duration (ms)
  loop: 0, // Loop when reaching end (0=no, 1=yes, n=number of times)
  orientation: 0, // Carousel orientation (0=horizontal, 1=vertical)
  active: true, // Whether carousel is active
  onClick: true, // Enable click events
  onDoubleClick: false // Enable double-click events
}

// CSS class names (for consistency)
export const CSS_CLASSES = {
  CAROUSEL: 'holo-carousel',
  CONTAINER: 'holo-container',
  ITEM: 'holo',
  ACTIVE: 'active',
  TRANSITION: 'transition'
}

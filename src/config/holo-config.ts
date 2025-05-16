//src/config/holo-config.ts

/**
 * Holo Carousel Configuration
 *
 * Central configuration file with all constants, default settings,
 * and event definitions for the Holo Carousel library
 */

import type {
  TouchState,
  DeepLinkingOptions,
  HoloIOOptions
} from '../types/interface'

// Touch event constants
export const TOUCH_EVENTS = {
  TOUCH_START: 'touch_start',
  TOUCH_MOVE: 'touch_move',
  TOUCH_END: 'touch_end',
  TRACK_TOUCH_MOVE: 'track_touch_move', // Added for initial direction detection
  DRAG_HORIZONTAL: 'drag_horizontal',
  DRAG_VERTICAL: 'drag_vertical',
  TRACK_VELOCITY: 'track_velocity',
  PROCESS_TOUCH_END: 'process_touch_end'
}

// Standard event naming constants
export const EVENTS = {
  // Initialization events
  INIT_CAROUSEL: 'init_carousel',
  INIT_DIMENSIONS: 'init_dimensions',

  // State events
  STATE_UPDATE: 'state_update',
  STATE_BATCH_UPDATE: 'state_batch_update',
  UPDATE_OPTIONS: 'update_options',
  INSTANCE_STATE_CHANGED: 'instance_state_changed',

  // Dimension events
  REFRESH_CAROUSEL: 'refresh_carousel',
  REFRESH_SCREEN: 'refresh_screen',
  FORCE_REFRESH_CAROUSELS: 'force_refresh_carousels',

  // Positioning events
  SNAP_TO_POSITION: 'snap_to_position',
  SNAP: 'snap',
  TRANSFORM_COMPLETE: 'transform_complete',

  // Navigation events
  ANIMATE: 'animate',
  NEXT_SLIDE: 'next_slide',
  PREV_SLIDE: 'prev_slide',
  FIRST_SLIDE: 'first_slide',
  LAST_SLIDE: 'last_slide',
  GO_TO_SLIDE: 'go_to_slide',
  ACTIVATE: 'activate',

  // Input events
  WHEEL_EVENT: 'wheel_event',
  KEYBOARD_EVENT: 'keyboard_event',

  // Feature events
  ACCORDION_TOGGLE: 'accordion_toggle',
  DEEP_LINK_UPDATE: 'deep_link_update',
  NESTED_INTERACTION: 'nested_interaction',
  CONVERT_TO_ACCORDION: 'convert_to_accordion',
  CONVERT_TO_CAROUSEL: 'convert_to_carousel',
  ENABLE_DEEP_LINKING: 'enable_deep_linking',
  DISABLE_DEEP_LINKING: 'disable_deep_linking',

  // Error handling
  ERROR_HANDLER: 'error_handler',
  ERROR_RECOVERY: 'error_recovery',

  // Performance events
  PERFORMANCE_MONITOR: 'performance_monitor',
  PERFORMANCE_OPTIMIZE: 'performance_optimize',
  GET_PERFORMANCE_HISTORY: 'get_performance_history',
  PERFORMANCE_HISTORY_RESULT: 'performance_history_result',
  PERFORMANCE_TEST: 'performance_test'
}

// Default animation settings
export const ANIMATION = {
  DURATION: 600,
  TIMING: 'cubic-bezier(0.215, 0.61, 0.355, 1)' // Improved easing curve
}

// Default IO options
export const DEFAULT_IO_OPTIONS: HoloIOOptions = {
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
  onDoubleClick: false, // Enable double-click events
  nestedMode: 0, // Enable nested carousel mode (0=off, 1=on)
  accordionMode: 0, // Enable accordion mode (0=off, 1=on)
  deepLinking: 0 // Enable deep linking (0=off, 1=on)
}

// CSS class names (for consistency)
export const CSS_CLASSES = {
  CAROUSEL: 'holo-carousel',
  CONTAINER: 'holo-container',
  ITEM: 'holo',
  ACTIVE: 'active',
  TRANSITION: 'transition',
  LOADING: 'loading',
  CONTROLS: 'holo-controls',
  DOT: 'holo-dot',
  NAV: 'holo-nav',
  PREV: 'holo-prev',
  NEXT: 'holo-next',
  ACCORDION: 'accordion',
  NESTED: 'nested'
}

// Default touch state - initial state for touch interactions
export const DEFAULT_TOUCH_STATE: TouchState = {
  id: null,
  virtualDom: null,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  lastX: 0,
  lastY: 0,
  distanceX: 0,
  distanceY: 0,
  directionX: 0,
  directionY: 0,
  velocityX: 0,
  velocityY: 0,
  startTransformX: 0,
  startTransformY: 0,
  pressed: false,
  startTime: 0,
  multiplier: 1.5,
  orientation: false,
  targetElement: null,
  moved: false,
  isNested: false,
  trackingPoints: [], // For improved velocity calculation
  initialMove: true // Track initial movement to determine primary direction
}

// Default accordion options
export const DEFAULT_ACCORDION_OPTIONS = {
  mode: 0, // 0=disabled, 1=enabled
  expand: 0, // 0=single panel, 1=multiple panels can be open
  defaultOpen: 0, // Index of default open panel (-1 for all closed)
  animation: 1, // 0=snap, 1=smooth animation
  headerHeight: 48, // Height of header in pixels (for vertical)
  headerWidth: 48 // Width of header in pixels (for horizontal)
}

// Default deep linking options
export const DEFAULT_DEEP_LINKING_OPTIONS: DeepLinkingOptions = {
  enabled: true,
  paramPrefix: 'slide',
  updateHistory: true,
  scrollToCarousel: true,
  nestedSeparator: '.'
}

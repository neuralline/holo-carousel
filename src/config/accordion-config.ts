//src/config/accordion-config.ts

/**
 * Local channel ids for one accordion instance's own Cyre branch. A branch
 * turns each of these into a globally-unique path (e.g. 'faq/toggle' vs
 * 'pricing/toggle'), the same reasoning as EVENTS in holo-config.ts - two
 * accordions on one page can reuse identical local names without their
 * channel config or handlers overwriting each other on a shared
 * root channel.
 */
export const ACCORDION_EVENTS = {
  TOGGLE: 'toggle',
  OPEN: 'open',
  CLOSE: 'close',
  OPEN_ALL: 'open-all',
  CLOSE_ALL: 'close-all'
} as const

// Branch every accordion's own branch sits under: accordion/<id>
export const ACCORDION_BRANCH = 'accordion'

// The one page-wide channel every accordion instance's re-render fans out
// from (accordion/refresh-screen, see core/accordion-event-manager.ts).
export const ACCORDION_REFRESH_SCREEN = 'refresh-screen'

export const ACCORDION_DEFAULT_IO = {
  enabled: 1,
  multiple: 0,
  duration: 260,
  startOpen: -1
}

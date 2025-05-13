//src/components/holo-deep-linking.ts

import {cyre, CyreLog} from 'cyre'
import {_holo} from '../libs/holo-essentials'
import {_holoRelationships, getAncestors, getChildren} from './holo-relations'
import {goToSlide} from '../libs/holo-navigation'
import {DEFAULT_DEEP_LINKING_OPTIONS, EVENTS} from '../config/holo-config'
import {DeepLinkingOptions} from '~/types/interface'

/**
 * Store for deep linking options per carousel
 */
const _deepLinkingOptions: Record<string, DeepLinkingOptions> = {}

/**
 * Initialize deep linking for a carousel
 */
export const initializeDeepLinking = (
  id: string,
  options: Partial<DeepLinkingOptions> = {}
): void => {
  // Store options with defaults
  _deepLinkingOptions[id] = {
    ...DEFAULT_DEEP_LINKING_OPTIONS,
    ...options
  }

  // Parse hash on initialization and go to correct slide if needed
  applyHashNavigation()

  // Only set up global listeners once
  if (!window._holoDeepLinkingInitialized) {
    // Listen for hash changes
    window.addEventListener('hashchange', applyHashNavigation)

    // Mark as initialized
    window._holoDeepLinkingInitialized = true
  }

  // Register event handler for slide changes
  cyre.on(`${id}_slide_changed`, (slideIndex: number) => {
    updateUrlHash(id, slideIndex)
  })

  // Configure action with throttling
  cyre.action({
    id: `${id}_slide_changed`,
    throttle: 200
  })

  // Listen for transform complete events to update URL
  cyre.on(
    EVENTS.TRANSFORM_COMPLETE,
    (payload: {id: string; position: number}) => {
      if (payload.id === id) {
        // Emit slide changed event
        cyre.call(`${id}_slide_changed`, payload.position)
      }
    }
  )
}

/**
 * Parse the current URL hash and apply navigation
 */
export const applyHashNavigation = (): void => {
  const hash = window.location.hash.substring(1)
  if (!hash) return

  const params = new URLSearchParams(hash)

  // Check all carousels
  Object.keys(_deepLinkingOptions).forEach(id => {
    const options = _deepLinkingOptions[id]
    if (!options.enabled) return

    const virtual = _holo[id]?.getVirtual
    if (!virtual) return

    // Check for this carousel's parameter
    const paramName = `${options.paramPrefix}-${id}`
    if (params.has(paramName)) {
      const value = params.get(paramName)

      // Parse the value - may include nested carousel info
      const parts = value.split(options.nestedSeparator)

      // Navigate to main carousel slide
      const slideIndex = parseInt(parts[0], 10)
      if (!isNaN(slideIndex)) {
        goToSlide(virtual, slideIndex)

        // Scroll to carousel if enabled
        if (options.scrollToCarousel) {
          setTimeout(() => {
            const element = document.getElementById(id)
            if (element) {
              element.scrollIntoView({behavior: 'smooth', block: 'nearest'})
            }
          }, 100)
        }

        // Process nested carousel parts
        if (parts.length > 1 && _holoRelationships[id]) {
          processNestedNavigation(id, parts.slice(1))
        }
      }
    }
  })
}

/**
 * Process navigation for nested carousels
 */
const processNestedNavigation = (
  parentId: string,
  pathParts: string[]
): void => {
  if (!_holoRelationships[parentId] || pathParts.length === 0) return

  // Get child carousels
  const childIds = getChildren(parentId)
  if (childIds.length === 0) return

  // Find child carousel based on its index within the parent
  const childIndex = parseInt(pathParts[0].split(':')[0], 10)
  if (isNaN(childIndex) || childIndex >= childIds.length) return

  const childId = childIds[childIndex]
  const slideIndex = parseInt(pathParts[0].split(':')[1], 10)

  // Navigate to child slide
  const childVirtual = _holo[childId]?.getVirtual
  if (childVirtual && !isNaN(slideIndex)) {
    // Small delay to ensure parent has finished its navigation
    setTimeout(() => {
      goToSlide(childVirtual, slideIndex)

      // Process further nesting
      if (pathParts.length > 1) {
        processNestedNavigation(childId, pathParts.slice(1))
      }
    }, 100)
  }
}

/**
 * Update URL hash based on carousel state
 */
export const updateUrlHash = (id: string, slideIndex: number): void => {
  const options = _deepLinkingOptions[id]
  if (!options?.enabled || !options.updateHistory) return

  // Get current hash parameters
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)

  // Parameter name for this carousel
  const paramName = `${options.paramPrefix}-${id}`

  // Update this carousel's parameter
  const nestedPath = buildNestedPath(id, slideIndex)
  params.set(paramName, nestedPath)

  // Update URL without reloading page
  const newHash = `#${params.toString()}`

  if (window.location.hash !== newHash) {
    if (options.updateHistory) {
      window.history.pushState(null, '', newHash)
    } else {
      window.location.hash = newHash
    }
  }
}

/**
 * Build a path string including nested carousel states
 */
const buildNestedPath = (id: string, slideIndex: number): string => {
  const options = _deepLinkingOptions[id]
  let path = `${slideIndex}`

  // Check if this carousel has active children
  if (_holoRelationships[id]?.childIds?.length > 0) {
    // Get children that are currently visible
    const childIds = getChildren(id)
    const visibleChildren = childIds.filter(childId => {
      // A child is considered visible if it's in the current slide
      const childElement = document.getElementById(childId)
      if (!childElement) return false

      // Check if child is in a currently visible slide
      const parentSlides = Array.from(document.querySelectorAll(`#${id} .holo`))
      const slideElement = parentSlides[slideIndex]

      return slideElement && slideElement.contains(childElement)
    })

    // Add visible children to path
    visibleChildren.forEach(childId => {
      const childIndex = childIds.indexOf(childId)
      const childVirtual = _holo[childId]?.getVirtual

      if (childVirtual) {
        const childSlideIndex = getCurrentSlideIndex(childVirtual)
        const childPath = buildNestedPath(childId, childSlideIndex)

        path += `${options.nestedSeparator}${childIndex}:${childPath}`
      }
    })
  }

  return path
}

/**
 * Get current slide index for a carousel
 */
const getCurrentSlideIndex = (virtual: HoloVirtual): number => {
  // Calculate based on transform position and item width/height
  const slideDimension = virtual.io.orientation
    ? virtual.item.height || 1
    : virtual.item.width || 1

  const position = virtual.io.orientation
    ? Math.abs(virtual.transformY)
    : Math.abs(virtual.transformX)

  return Math.round(position / slideDimension)
}

/**
 * Public API for manually navigating via deep link
 */
export const navigateToDeepLink = (path: string): void => {
  // Set hash and let the hashchange handler do the work
  window.location.hash = path
}

/**
 * Public API for generating a deep link for a specific carousel state
 */
export const getDeepLinkPath = (id: string): string => {
  const virtual = _holo[id]?.getVirtual
  if (!virtual) return ''

  const slideIndex = getCurrentSlideIndex(virtual)
  return buildNestedPath(id, slideIndex)
}

/**
 * Enable deep linking for a carousel
 */
export const enableDeepLinking = (
  id: string,
  options: Partial<DeepLinkingOptions> = {}
): void => {
  initializeDeepLinking(id, {
    ...DEFAULT_DEEP_LINKING_OPTIONS,
    ...options,
    enabled: true
  })
}

/**
 * Disable deep linking for a carousel
 */
export const disableDeepLinking = (id: string): void => {
  if (_deepLinkingOptions[id]) {
    _deepLinkingOptions[id].enabled = false
  }
}

// Add to window for TypeScript
declare global {
  interface Window {
    _holoDeepLinkingInitialized?: boolean
  }
}

//src/components/holo-create-element.ts

import {CyreLog} from 'cyre'
import type {HoloIOOptions} from '../types/interface'
import {_holo} from '../libs/holo-essentials'
import setupIOManager from './holo-io-manager'
import {createHoloInstance} from '../core/holo-state'
import {registerNestedCarousel} from './holo-relations'
import {initializeAccordionMode} from './holo-accordion'
import {initializeDeepLinking} from './holo-deep-link'
import {CSS_CLASSES} from '../config/holo-config'

/**
 * Create and initialize a carousel element
 * @param slide - DOM element to convert to carousel
 * @param io - Input/Output options
 */
export const holoCreateElement = (
  slide: HTMLElement,
  io: Partial<HoloIOOptions> = {}
): string | null => {
  if (!slide || !slide.nodeType) {
    console.error('@Holo: Invalid DOM element provided')
    return null
  }

  // Ensure slide has an ID
  if (!slide.id) {
    slide.id = `holo-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  }

  try {
    // Create and register the carousel instance
    _holo[slide.id] = createHoloInstance(slide, io)

    console.log('@Holo: Created carousel:', slide.id)

    // Check if this carousel is inside another carousel (nested)
    const parentCarousel = findParentCarousel(slide)
    if (parentCarousel && parentCarousel.id !== slide.id) {
      // This is a nested carousel
      registerNestedCarousel(slide.id, parentCarousel.id)

      // Apply special handling for nested carousels
      applyNestedCarouselSettings(slide.id, parentCarousel.id)
    }

    // Initialize accordion mode if enabled
    if (io.accordionMode) {
      initializeAccordionMode(
        _holo[slide.id].getVirtual,
        _holo[slide.id].getShadow
      )
    }

    // Initialize deep linking if enabled
    if (io.deepLinking) {
      initializeDeepLinking(slide.id)
    }

    // Setup event handlers
    setupIOManager(_holo[slide.id].getVirtual, _holo[slide.id].getShadow)

    return slide.id
  } catch (error) {
    console.error('@Holo: Error creating carousel:', error)
    return null
  }
}

/**
 * Find parent carousel element
 * @param element Element to check for carousel parent
 */
const findParentCarousel = (element: HTMLElement): HTMLElement | null => {
  // Start with parent element
  let parent = element.parentElement

  // Traverse up the DOM tree
  while (parent) {
    // Check if this element is a holo carousel
    if (parent.classList.contains(CSS_CLASSES.CAROUSEL)) {
      return parent
    }

    // Move up to next parent
    parent = parent.parentElement
  }

  return null
}

/**
 * Apply special settings for nested carousels
 * @param childId Child carousel ID
 * @param parentId Parent carousel ID
 */
const applyNestedCarouselSettings = (
  childId: string,
  parentId: string
): void => {
  const childVirtual = _holo[childId]?.getVirtual
  if (!childVirtual) return

  // Add data attribute to mark as nested
  const childElement = document.getElementById(childId)
  if (childElement) {
    childElement.setAttribute('data-nested', 'true')
    childElement.setAttribute('data-parent', parentId)
  }

  // Override some settings for better nested behavior
  _holo[childId].setState = {
    ...childVirtual,
    io: {
      ...childVirtual.io,
      // These settings work better for nested carousels
      nestedMode: 1,
      wheel: 0 // Disable wheel to prevent confusing scrolling
      // Keep other settings from user config
    }
  }

  CyreLog.info(
    `Applied nested carousel settings for ${childId} (parent: ${parentId})`
  )
}

/**
 * Enhanced auto-initialize function that detects nested carousels
 * @param carouselName Class name to identify carousels
 */
export const holoInitiate = (
  carouselName: string = CSS_CLASSES.CAROUSEL
): void => {
  console.log('@holo: auto activated:', carouselName)

  // Get all elements with the specified class name
  const carousels = document.getElementsByClassName(carouselName)

  if (carousels.length === 0) {
    console.log('@Holo: carousel structure not found')
    return
  }

  // First, initialize top-level carousels
  const initializedIds: string[] = []

  Array.from(carousels).forEach(carousel => {
    try {
      const element = carousel as HTMLElement

      // Skip if this is nested inside another carousel
      if (findParentCarousel(element)) {
        return
      }

      const id = holoCreateElement(element, {} as Partial<HoloIOOptions>)
      if (id) {
        initializedIds.push(id)
      }
    } catch (error) {
      CyreLog.error('Error auto-initializing carousel:', error)
    }
  })

  // Then, initialize nested carousels
  Array.from(carousels).forEach(carousel => {
    try {
      const element = carousel as HTMLElement

      // Skip if already initialized (top-level carousel)
      if (initializedIds.includes(element.id)) {
        return
      }

      // Skip if not nested
      const parentCarousel = findParentCarousel(element)
      if (!parentCarousel) {
        return
      }

      const id = holoCreateElement(element, {
        nestedMode: 1
      } as Partial<HoloIOOptions>)

      if (id) {
        initializedIds.push(id)
      }
    } catch (error) {
      CyreLog.error('Error auto-initializing nested carousel:', error)
    }
  })

  CyreLog.info(`Auto-initialized ${initializedIds.length} carousels`)
}

//src/components/holo-accordion.ts

import {cyre, CyreLog} from 'cyre'
import type {HoloVirtual, HoloShadow} from '../types/interface'
import {_holo} from '../libs/holo-essentials'
import {EVENTS} from '../config/holo-config'

/**
 * Accordion-specific options
 */
export interface AccordionOptions {
  mode: number // 0 = disabled, 1 = enabled
  expand: number // 0 = single panel, 1 = multiple panels can be open
  defaultOpen: number // Index of default open panel (-1 for all closed)
  animation: number // 0 = snap, 1 = smooth animation
  headerHeight: number // Height of header in pixels (for vertical)
  headerWidth: number // Width of header in pixels (for horizontal)
}

/**
 * Default accordion options
 */
export const DEFAULT_ACCORDION_OPTIONS: AccordionOptions = {
  mode: 0,
  expand: 0,
  defaultOpen: 0,
  animation: 1,
  headerHeight: 48,
  headerWidth: 48
}

/**
 * Initialize accordion mode for a carousel
 * @param virtual Virtual state
 * @param shadow Shadow DOM elements
 */
export const initializeAccordionMode = (
  virtual: HoloVirtual,
  shadow: HoloShadow
): void => {
  if (!virtual.io.accordionMode) return

  CyreLog.info(`Initializing accordion mode for ${virtual.id}`)

  // Get all panels
  const panels = Array.from(shadow.container.children) as HTMLElement[]

  if (panels.length === 0) {
    CyreLog.warn(`No panels found in accordion ${virtual.id}`)
    return
  }

  // Measure max dimensions for each panel and get collapse dimensions
  const panelDimensions = panels.map(panel => {
    // Store original styles
    const originalStyle = panel.style.cssText

    // Temporarily set panel to "expanded" for measurement
    panel.style.height = 'auto'
    panel.style.width = 'auto'
    panel.style.display = 'block'
    panel.style.overflow = 'visible'

    // Force reflow
    void panel.offsetHeight

    // Measure
    const expandedDimensions = {
      width: panel.offsetWidth,
      height: panel.offsetHeight
    }

    // Restore original style
    panel.style.cssText = originalStyle

    return expandedDimensions
  })

  // Determine collapsed dimensions based on orientation
  const isVertical = !!virtual.io.orientation
  const collapsedHeight = isVertical
    ? virtual.accordionOptions?.headerHeight || 48
    : panelDimensions[0].height
  const collapsedWidth = isVertical
    ? panelDimensions[0].width
    : virtual.accordionOptions?.headerWidth || 48

  // Find max dimensions
  const maxHeight = Math.max(...panelDimensions.map(d => d.height))
  const maxWidth = Math.max(...panelDimensions.map(d => d.width))

  // Set initial accordion state
  const defaultOpen =
    virtual.accordionOptions?.defaultOpen >= 0 &&
    virtual.accordionOptions.defaultOpen < panels.length
      ? [virtual.accordionOptions.defaultOpen]
      : []

  // Update virtual state with accordion info
  _holo[virtual.id].setState = {
    ...virtual,
    accordionState: {
      openPanels: defaultOpen,
      previouslyOpen: [],
      expandedHeight: maxHeight,
      expandedWidth: maxWidth,
      collapsedHeight,
      collapsedWidth
    }
  }

  // Apply initial state to panels
  applyAccordionState(virtual.id)

  // Set up event listeners for panel headers
  setupAccordionEvents(virtual.id, panels)
}

/**
 * Set up click events for accordion panels
 */
const setupAccordionEvents = (id: string, panels: HTMLElement[]): void => {
  panels.forEach((panel, index) => {
    // Find or create header element
    let header = panel.querySelector('.accordion-header') as HTMLElement

    if (!header) {
      // Create a header if none exists
      header = document.createElement('div')
      header.className = 'accordion-header'

      // Find and use panel title if available
      const title = panel.querySelector('h1, h2, h3, h4, h5, h6')
      if (title) {
        header.innerHTML = title.outerHTML
        title.remove() // Remove original title
      } else {
        header.textContent = `Panel ${index + 1}`
      }

      // Insert header at beginning of panel
      if (panel.firstChild) {
        panel.insertBefore(header, panel.firstChild)
      } else {
        panel.appendChild(header)
      }
    }

    // Create content wrapper if needed
    let content = panel.querySelector('.accordion-content') as HTMLElement
    if (!content) {
      content = document.createElement('div')
      content.className = 'accordion-content'

      // Move all elements except header into content
      Array.from(panel.children).forEach(child => {
        if (
          child !== header &&
          !child.classList.contains('accordion-content')
        ) {
          content.appendChild(child)
        }
      })

      panel.appendChild(content)
    }

    // Add click handler to header
    header.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()

      toggleAccordionPanel(id, index)
    })
  })
}

/**
 * Toggle an accordion panel open/closed
 */
export const toggleAccordionPanel = (id: string, panelIndex: number): void => {
  const virtual = _holo[id]?.getVirtual

  if (!virtual || !virtual.accordionState) {
    CyreLog.error(`Invalid accordion state for ${id}`)
    return
  }

  // Store current state for transition reference
  const previouslyOpen = [...virtual.accordionState.openPanels]

  // Determine new state
  let openPanels: number[]

  if (virtual.accordionState.openPanels.includes(panelIndex)) {
    // Close this panel
    openPanels = virtual.accordionState.openPanels.filter(
      idx => idx !== panelIndex
    )
  } else {
    if (virtual.accordionOptions?.expand) {
      // Multiple panels can be open - add this one
      openPanels = [...virtual.accordionState.openPanels, panelIndex]
    } else {
      // Single panel mode - replace with just this one
      openPanels = [panelIndex]
    }
  }

  // Update state
  _holo[id].setState = {
    ...virtual,
    accordionState: {
      ...virtual.accordionState,
      openPanels,
      previouslyOpen
    }
  }

  // Apply the new state
  applyAccordionState(id)
}

/**
 * Apply accordion state to the DOM elements
 */
const applyAccordionState = (id: string): void => {
  const virtual = _holo[id]?.getVirtual
  const shadow = _holo[id]?.getShadow

  if (!virtual || !shadow || !virtual.accordionState) {
    CyreLog.error(`Cannot apply accordion state for ${id}`)
    return
  }

  const panels = Array.from(shadow.container.children) as HTMLElement[]
  const openPanels = virtual.accordionState.openPanels
  const isVertical = !!virtual.io.orientation

  // Process each panel
  panels.forEach((panel, index) => {
    const isOpen = openPanels.includes(index)
    const header = panel.querySelector('.accordion-header') as HTMLElement
    const content = panel.querySelector('.accordion-content') as HTMLElement

    // Update panel classes
    panel.classList.toggle('accordion-open', isOpen)
    panel.classList.toggle('accordion-closed', !isOpen)

    if (header) {
      header.classList.toggle('accordion-header-open', isOpen)
      header.classList.toggle('accordion-header-closed', !isOpen)
    }

    if (content) {
      content.classList.toggle('accordion-content-open', isOpen)
      content.classList.toggle('accordion-content-closed', !isOpen)

      // Apply dimensions based on state and orientation
      if (isVertical) {
        // Vertical accordion
        content.style.height = isOpen
          ? `${virtual.accordionState.expandedHeight}px`
          : '0'
        content.style.overflow = isOpen ? 'visible' : 'hidden'
      } else {
        // Horizontal accordion
        content.style.width = isOpen
          ? `${virtual.accordionState.expandedWidth}px`
          : '0'
        content.style.overflow = isOpen ? 'visible' : 'hidden'
      }

      // Apply transition if animation is enabled
      if (virtual.accordionOptions?.animation) {
        content.style.transition = isVertical
          ? `height ${virtual.duration}ms ${virtual.transitionTiming}`
          : `width ${virtual.duration}ms ${virtual.transitionTiming}`
      } else {
        content.style.transition = 'none'
      }
    }
  })

  // Update overall container dimensions if needed
  calculateAccordionDimensions(id)
}

/**
 * Calculate and apply overall accordion dimensions based on open panels
 */
const calculateAccordionDimensions = (id: string): void => {
  const virtual = _holo[id]?.getVirtual
  const shadow = _holo[id]?.getShadow

  if (!virtual || !shadow || !virtual.accordionState) return

  const isVertical = !!virtual.io.orientation
  const panels = Array.from(shadow.container.children) as HTMLElement[]
  const openPanels = virtual.accordionState.openPanels

  if (isVertical) {
    // For vertical accordion, calculate total height
    let totalHeight = 0

    panels.forEach((panel, index) => {
      // Add header height
      totalHeight += virtual.accordionState?.collapsedHeight || 0

      // If panel is open, add content height
      if (openPanels.includes(index)) {
        totalHeight += virtual.accordionState?.expandedHeight || 0
      }
    })

    // Apply to container
    shadow.container.style.height = `${totalHeight}px`
  } else {
    // For horizontal accordion, calculate total width
    let totalWidth = 0

    panels.forEach((panel, index) => {
      // Add header width
      totalWidth += virtual.accordionState?.collapsedWidth || 0

      // If panel is open, add content width
      if (openPanels.includes(index)) {
        totalWidth += virtual.accordionState?.expandedWidth || 0
      }
    })

    // Apply to container
    shadow.container.style.width = `${totalWidth}px`
  }
}

/**
 * Apply accordion-specific CSS
 */
export const injectAccordionStyles = (): void => {
  if (document.getElementById('holo-accordion-styles')) return

  const style = document.createElement('style')
  style.id = 'holo-accordion-styles'

  style.textContent = `
    /* Base accordion styles */
    .holo-carousel[data-mode="accordion"] {
      overflow: visible;
    }
    
    .holo-carousel[data-mode="accordion"] .holo-container {
      display: flex;
      flex-direction: column;
      transform: none !important; /* Override carousel transform */
    }
    
    .holo-carousel[data-mode="accordion"][data-orientation="horizontal"] .holo-container {
      flex-direction: row;
    }
    
    /* Panel styles */
    .holo-carousel[data-mode="accordion"] .holo {
      transition: all 0.3s ease;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
    }
    
    /* Header styles */
    .holo-carousel[data-mode="accordion"] .accordion-header {
      cursor: pointer;
      padding: 12px 15px;
      background: rgba(0, 0, 0, 0.03);
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      user-select: none;
      display: flex;
      align-items: center;
      position: relative;
    }
    
    .holo-carousel[data-mode="accordion"] .accordion-header::after {
      content: "▼";
      font-size: 0.8em;
      margin-left: auto;
      transition: transform 0.3s ease;
    }
    
    .holo-carousel[data-mode="accordion"] .accordion-header-closed::after {
      transform: rotate(-90deg);
    }
    
    /* Content styles */
    .holo-carousel[data-mode="accordion"] .accordion-content {
      transition: height 0.3s ease, width 0.3s ease;
      overflow: hidden;
    }
    
    /* Vertical specific */
    .holo-carousel[data-mode="accordion"][data-orientation="vertical"] .accordion-content {
      width: 100%;
    }
    
    /* Horizontal specific */
    .holo-carousel[data-mode="accordion"][data-orientation="horizontal"] .holo {
      height: 100%;
      display: flex;
      flex-direction: row;
    }
    
    .holo-carousel[data-mode="accordion"][data-orientation="horizontal"] .accordion-header {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      height: 100%;
      width: auto;
      border-right: 1px solid rgba(0, 0, 0, 0.1);
      border-bottom: none;
    }
    
    .holo-carousel[data-mode="accordion"][data-orientation="horizontal"] .accordion-header::after {
      transform: rotate(90deg);
      margin-top: 10px;
      margin-left: 0;
    }
    
    .holo-carousel[data-mode="accordion"][data-orientation="horizontal"] .accordion-header-closed::after {
      transform: rotate(0deg);
    }
    
    .holo-carousel[data-mode="accordion"][data-orientation="horizontal"] .accordion-content {
      height: 100%;
    }
  `

  document.head.appendChild(style)
}

/**
 * Convert a carousel to accordion mode
 */
export const convertToAccordion = (
  id: string,
  options: Partial<AccordionOptions> = {}
): void => {
  const virtual = _holo[id]?.getVirtual
  const shadow = _holo[id]?.getShadow

  if (!virtual || !shadow) {
    CyreLog.error(`Cannot convert carousel ${id} to accordion: not found`)
    return
  }

  // Ensure accordion styles are injected
  injectAccordionStyles()

  // Merge with default options
  const accordionOptions = {
    ...DEFAULT_ACCORDION_OPTIONS,
    ...options,
    mode: 1 // Enable accordion mode
  }

  // Update options with accordion-specific settings
  _holo[id].setState = {
    ...virtual,
    io: {
      ...virtual.io,
      accordionMode: 1
    },
    accordionOptions
  }

  // Apply data attributes for styling
  shadow.carousel.setAttribute('data-mode', 'accordion')
  shadow.carousel.setAttribute(
    'data-orientation',
    options.mode !== undefined
      ? options.mode
        ? 'vertical'
        : 'horizontal'
      : virtual.io.orientation
      ? 'vertical'
      : 'horizontal'
  )

  // Initialize accordion mode
  initializeAccordionMode(_holo[id].getVirtual, shadow)
}

/**
 * Public API for toggling accordion panels
 */
export const toggleAccordion = (id: string, panelIndex: number): void => {
  toggleAccordionPanel(id, panelIndex)
}

/**
 * Public API for opening an accordion panel
 */
export const openAccordionPanel = (id: string, panelIndex: number): void => {
  const virtual = _holo[id]?.getVirtual

  if (!virtual || !virtual.accordionState) {
    CyreLog.error(`Invalid accordion state for ${id}`)
    return
  }

  // If not already open, toggle it
  if (!virtual.accordionState.openPanels.includes(panelIndex)) {
    toggleAccordionPanel(id, panelIndex)
  }
}

/**
 * Public API for closing an accordion panel
 */
export const closeAccordionPanel = (id: string, panelIndex: number): void => {
  const virtual = _holo[id]?.getVirtual

  if (!virtual || !virtual.accordionState) {
    CyreLog.error(`Invalid accordion state for ${id}`)
    return
  }

  // If already open, toggle it
  if (virtual.accordionState.openPanels.includes(panelIndex)) {
    toggleAccordionPanel(id, panelIndex)
  }
}

/**
 * Convert back from accordion to normal carousel
 */
export const convertToCarousel = (id: string): void => {
  const virtual = _holo[id]?.getVirtual
  const shadow = _holo[id]?.getShadow

  if (!virtual || !shadow) {
    CyreLog.error(`Cannot convert accordion ${id} to carousel: not found`)
    return
  }

  // Update accordion mode setting
  _holo[id].setState = {
    ...virtual,
    io: {
      ...virtual.io,
      accordionMode: 0
    },
    // Remove accordion state
    accordionState: undefined,
    accordionOptions: undefined
  }

  // Remove data attributes
  shadow.carousel.removeAttribute('data-mode')
  shadow.carousel.removeAttribute('data-orientation')

  // Reset container styles
  shadow.container.style.height = ''
  shadow.container.style.width = ''

  // Reset panel styles
  const panels = Array.from(shadow.container.children) as HTMLElement[]

  panels.forEach(panel => {
    panel.classList.remove('accordion-open', 'accordion-closed')

    // Reset content styles
    const content = panel.querySelector('.accordion-content') as HTMLElement
    if (content) {
      content.style.height = ''
      content.style.width = ''
      content.style.overflow = ''
      content.style.transition = ''

      // Move content back to panel directly
      Array.from(content.children).forEach(child => {
        panel.appendChild(child)
      })

      // Remove content wrapper
      content.remove()
    }

    // Remove header if it was auto-created
    const header = panel.querySelector('.accordion-header') as HTMLElement
    if (header) {
      header.remove()
    }
  })

  // Refresh the carousel
  cyre.call(EVENTS.REFRESH_CAROUSEL, _holo[id].getState)
}

//src/libs/holo-dom.ts

import {CyreLog} from 'cyre'
import type {HoloVirtual, HoloShadow, HoloDimensions} from '../types/interface'
import {_holo} from './holo-essentials'
import {EVENTS} from '../config/holo-config'

/**
 * Check if DOM visibility APIs are available
 * Ensures we don't calculate dimensions when document is not visible
 */
export const isVisibilityAvailable = (): boolean => {
  return (
    document.visibilityState === undefined ||
    document.visibilityState === 'visible'
  )
}

/**
 * Get flex gap value from container element
 * Handles both inline styles and CSS variables
 */
export const getFlexGap = (container: HTMLElement): number => {
  if (!container) return 0

  try {
    // Try to get computed style
    const style = window.getComputedStyle(container)

    // Check for gap property (most modern browsers)
    if (style.gap && style.gap !== 'normal') {
      // Parse gap value (remove 'px' or other units)
      const gapValue = parseInt(style.gap, 10)
      if (!isNaN(gapValue)) {
        return gapValue
      }
    }

    // Check for CSS variable (fallback)
    const rootStyle = window.getComputedStyle(document.documentElement)
    const gapVar = rootStyle.getPropertyValue('--holo-slide-gap')

    if (gapVar) {
      const gapValue = parseInt(gapVar, 10)
      if (!isNaN(gapValue)) {
        return gapValue
      }
    }

    // Check for row-gap and column-gap separately
    const rowGap =
      style.rowGap && style.rowGap !== 'normal' ? parseInt(style.rowGap, 10) : 0
    const columnGap =
      style.columnGap && style.columnGap !== 'normal'
        ? parseInt(style.columnGap, 10)
        : 0

    // For horizontal carousels, column-gap matters most
    // For vertical carousels, row-gap matters most
    return Math.max(rowGap || 0, columnGap || 0)
  } catch (error) {
    CyreLog.warn('Error detecting flex gap:', error)
    return 0 // Default to no gap if detection fails
  }
}

/**
 * Get element dimensions including margins with additional safeguards
 */
export const getElementDimensions = (element: HTMLElement): HoloDimensions => {
  if (!element) return {width: 0, height: 0}

  try {
    // Try to get dimensions from inline styles first (most reliable)
    let width = 0
    let height = 0

    // Get from inline style if available
    if (element.style.width && element.style.height) {
      width = parseInt(element.style.width, 10) || 0
      height = parseInt(element.style.height, 10) || 0
    }

    // If inline styles didn't work, try getBoundingClientRect
    if (width === 0 || height === 0) {
      const rect = element.getBoundingClientRect()
      width = rect.width || 0
      height = rect.height || 0
    }

    // If still zero, try offsetWidth/offsetHeight
    if (width === 0 || height === 0) {
      width = element.offsetWidth || 0
      height = element.offsetHeight || 0
    }

    // Get margins from computed style
    const style = window.getComputedStyle(element)
    const marginLeft = parseInt(style.marginLeft, 10) || 0
    const marginRight = parseInt(style.marginRight, 10) || 0
    const marginTop = parseInt(style.marginTop, 10) || 0
    const marginBottom = parseInt(style.marginBottom, 10) || 0

    // Add margins to dimensions
    width += marginLeft + marginRight
    height += marginTop + marginBottom

    // Final safeguard against zero or NaN values
    if (width <= 0 || isNaN(width)) width = 200
    if (height <= 0 || isNaN(height)) height = 200

    return {width, height}
  } catch (error) {
    CyreLog.error('Error calculating element dimensions:', error)
    return {width: 200, height: 200} // Fallback dimensions
  }
}

/**
 * Calculate carousel dimensions with improved robustness
 * This is the main dimension calculation function
 */
export const calculateCarouselDimensions = (
  virtual: HoloVirtual,
  shadow: HoloShadow
): HoloVirtual | null => {
  // Ensure we have DOM elements
  if (!shadow?.container || !shadow?.carousel) {
    CyreLog.error('Missing carousel DOM elements')
    return null
  }

  try {
    // Safety check for DOM readiness
    if (
      shadow.container.offsetWidth === 0 &&
      shadow.container.offsetHeight === 0
    ) {
      CyreLog.warn(`DOM not ready for measurement, carousel: ${virtual.id}`)
      return null
    }

    // Store original styles to restore later
    const originalCarouselStyle = shadow.carousel.style.cssText
    const originalContainerStyle = shadow.container.style.cssText

    // Force visibility for measurement
    shadow.carousel.style.visibility = 'visible'
    shadow.carousel.style.display = 'block'
    shadow.container.style.visibility = 'visible'
    shadow.container.style.display = 'flex'

    // Force layout recalculation
    void shadow.carousel.offsetHeight
    void shadow.container.offsetHeight

    // Get all slides
    const slides = Array.from(shadow.container.children) as HTMLElement[]

    if (slides.length === 0) {
      CyreLog.warn(`No slides found in carousel ${virtual.id}`)

      // Restore original styles
      shadow.carousel.style.cssText = originalCarouselStyle
      shadow.container.style.cssText = originalContainerStyle

      return null
    }

    // Get parent container dimensions with fallbacks
    const parentWidth = Math.max(
      shadow.carousel.parentElement?.clientWidth || 0,
      shadow.carousel.clientWidth || 0,
      window.innerWidth || 1024
    )

    const parentHeight = Math.max(
      shadow.carousel.parentElement?.clientHeight || 0,
      shadow.carousel.clientHeight || 0,
      window.innerHeight || 768
    )

    // CRITICAL: Detect flex gap now and include it in calculations
    const flexGap = getFlexGap(shadow.container)

    // IMPROVED: More accurate calculation of total width and max slide dimensions
    let totalWidth = 0
    let totalHeight = 0
    let maxSlideWidth = 0
    let maxSlideHeight = 0

    // Measure each slide individually to account for varying widths
    slides.forEach((slide, index) => {
      // Make sure the slide is visible for measurement
      const originalSlideStyle = slide.style.cssText
      slide.style.visibility = 'visible'
      slide.style.display = 'inline-block'

      // Force recalculation
      void slide.offsetHeight

      // Get computed style to include margins
      const style = window.getComputedStyle(slide)
      const marginLeft = parseInt(style.marginLeft) || 0
      const marginRight = parseInt(style.marginRight) || 0
      const marginTop = parseInt(style.marginTop) || 0
      const marginBottom = parseInt(style.marginBottom) || 0

      // Calculate slide dimensions with margins
      const slideWidth = slide.offsetWidth + marginLeft + marginRight
      const slideHeight = slide.offsetHeight + marginTop + marginBottom

      // Track maximum dimensions
      maxSlideWidth = Math.max(maxSlideWidth, slideWidth)
      maxSlideHeight = Math.max(maxSlideHeight, slideHeight)

      // Add to total dimensions - CRITICAL for scrolling all slides
      totalWidth += slideWidth

      // If not the last item, add gap for horizontal layout
      if (index < slides.length - 1) {
        totalWidth += flexGap
      }

      totalHeight += slideHeight

      // If not the last item, add gap for vertical layout
      if (index < slides.length - 1) {
        totalHeight += flexGap
      }

      // Restore original style
      slide.style.cssText = originalSlideStyle
    })

    // Add safety margin to ensure last slide is fully visible
    totalWidth += maxSlideWidth * 0.1 // Add 10% of a slide width as padding

    // Fallback if dimensions are still zero
    if (maxSlideWidth === 0) maxSlideWidth = 200
    if (maxSlideHeight === 0) maxSlideHeight = 200
    if (totalWidth === 0)
      totalWidth = (maxSlideWidth + flexGap) * slides.length - flexGap
    if (totalHeight === 0)
      totalHeight = (maxSlideHeight + flexGap) * slides.length - flexGap

    // Calculate how many items can fit in view
    const numberOfSlots = Math.min(
      Math.max(1, Math.floor(parentWidth / (maxSlideWidth + flexGap))),
      virtual.item.max || 10
    )

    // Calculate carousel dimensions (the viewport)
    const carouselWidth = virtual.io.orientation
      ? parentWidth
      : Math.min(
          numberOfSlots * (maxSlideWidth + flexGap) - flexGap,
          parentWidth
        )

    const carouselHeight = virtual.io.orientation
      ? Math.min(
          numberOfSlots * (maxSlideHeight + flexGap) - flexGap,
          parentHeight
        )
      : maxSlideHeight

    // CRITICAL FIX: Calculate container dimensions to include ALL slides
    // This ensures all slides are accessible by scrolling
    const containerWidth = virtual.io.orientation
      ? parentWidth // For vertical orientation, container width is just parent width
      : totalWidth // For horizontal, it's the ACCURATE sum of all slide widths

    const containerHeight = virtual.io.orientation
      ? totalHeight // For vertical orientation, container height is the sum of all slide heights
      : maxSlideHeight // For horizontal, it's just the maximum slide height

    // CRITICAL FIX: Calculate end position to ensure all slides are accessible
    const endOfSlidePosition = virtual.io.orientation
      ? -Math.max(0, containerHeight - carouselHeight)
      : -Math.max(0, containerWidth - carouselWidth)

    // Store the detected flex gap in the virtual state for later use
    const slideWithGap = {
      width: maxSlideWidth + flexGap,
      height: maxSlideHeight + flexGap,
      actualWidth: maxSlideWidth,
      actualHeight: maxSlideHeight,
      gap: flexGap
    }

    // Restore original styles
    shadow.carousel.style.cssText = originalCarouselStyle
    shadow.container.style.cssText = originalContainerStyle

    // Log the calculated dimensions for debugging
    CyreLog.info(`Carousel ${virtual.id} dimensions calculated:`, {
      slides: slides.length,
      slideWidth: maxSlideWidth,
      slideHeight: maxSlideHeight,
      flexGap,
      slideWithGapWidth: slideWithGap.width,
      slideWithGapHeight: slideWithGap.height,
      carouselWidth,
      carouselHeight,
      containerWidth,
      containerHeight,
      endOfSlidePosition,
      totalWidth
    })

    // Create updated virtual state with new dimensions
    return {
      ...virtual,
      item: {
        ...virtual.item,
        ...slideWithGap
      },
      numberOfSlots,
      carousel: {
        width: carouselWidth,
        height: carouselHeight
      },
      container: {
        width: containerWidth,
        height: containerHeight
      },
      endOfSlidePosition,
      noOfChildren: slides.length
    }
  } catch (error) {
    CyreLog.error(`Error in dimension calculation for ${virtual.id}:`, error)
    return null
  }
}

/**
 * Force calculation of carousel dimensions and retry if needed
 */
export const forceCalculateCarouselDimensions = (
  id: string
): Promise<boolean> => {
  return new Promise(resolve => {
    if (!_holo[id]) {
      CyreLog.error(`Carousel ${id} not found`)
      resolve(false)
      return
    }

    const state = _holo[id].getState
    const {virtual, shadow} = state

    // Log what we're about to do
    CyreLog.info(`Force calculating dimensions for carousel ${id}`)

    // Try to calculate dimensions immediately
    const updatedVirtual = calculateCarouselDimensions(virtual, shadow)

    if (updatedVirtual) {
      // Store the updated dimensions
      _holo[id].setDimension = {...updatedVirtual}

      // Check if we have valid dimensions
      if (
        (virtual.io.orientation === 0 && updatedVirtual.item.width > 0) ||
        (virtual.io.orientation === 1 && updatedVirtual.item.height > 0)
      ) {
        CyreLog.info(`Successfully calculated dimensions for ${id}:`, {
          width: updatedVirtual.item.width,
          height: updatedVirtual.item.height,
          gap: updatedVirtual.item.gap
        })
        resolve(true)
        return
      }
    }

    // If we got here, we need to retry with a delay
    CyreLog.warn(
      `Initial dimension calculation failed for ${id}, retrying with delay`
    )

    // Try again with a delay to ensure DOM is ready
    setTimeout(() => {
      try {
        // Force display to be set before calculating
        if (shadow.carousel) {
          shadow.carousel.style.display = 'block'
        }
        if (shadow.container) {
          shadow.container.style.display = 'flex'
        }

        // Force a reflow
        if (shadow.carousel) {
          void shadow.carousel.offsetHeight
        }
        if (shadow.container) {
          void shadow.container.offsetHeight
        }

        // Try again
        const retryVirtual = calculateCarouselDimensions(virtual, shadow)

        if (retryVirtual) {
          // Store the updated dimensions
          _holo[id].setDimension = {...retryVirtual}

          CyreLog.info(`Retry succeeded for ${id}:`, {
            width: retryVirtual.item.width,
            height: retryVirtual.item.height,
            gap: retryVirtual.item.gap
          })

          resolve(true)
        } else {
          CyreLog.error(`Dimension calculation failed for ${id} after retry`)
          resolve(false)
        }
      } catch (error) {
        CyreLog.error(`Error during retry for ${id}:`, error)
        resolve(false)
      }
    }, 300) // Delay long enough for DOM to be ready
  })
}

/**
 * Force refresh of all carousels to correct initialization issues
 */
export const forceRefreshAllCarousels = async (): Promise<void> => {
  const carouselIds = Object.keys(_holo)
  CyreLog.info(`Force refreshing ${carouselIds.length} carousels`)

  // Process each carousel one at a time to avoid race conditions
  for (const id of carouselIds) {
    await forceCalculateCarouselDimensions(id)
  }
}

/**
 * Get the current visible slide index
 */
export const getCurrentSlideIndex = (virtual: HoloVirtual): number => {
  if (!virtual?.id) {
    return 0
  }

  // Calculate based on transform position and item width/height
  // Use width/height that includes gap for proper calculations
  const slideDimension = virtual.io.orientation
    ? virtual.item.height || 1
    : virtual.item.width || 1

  const position = virtual.io.orientation
    ? Math.abs(virtual.transformY)
    : Math.abs(virtual.transformX)

  return Math.round(position / slideDimension)
}

/**
 * Get offsets for all slides in a carousel
 * With gap consideration for accurate positioning
 */
export const getSlideOffsets = (
  virtual: HoloVirtual,
  selectedElement?: HTMLElement
): {offsets: number[]; selectedIndex: number} => {
  if (!virtual?.id) {
    return {offsets: [], selectedIndex: -1}
  }

  const container = document.querySelector(`#${virtual.id} .holo-container`)
  if (!container) {
    return {offsets: [], selectedIndex: -1}
  }

  const slides = Array.from(container.children) as HTMLElement[]
  const gap = virtual.item.gap || 0

  // Calculate offsets with gap consideration
  const offsets = slides.map((slide, index) => {
    if (virtual.io.orientation) {
      // For vertical orientation
      const baseOffset = index * (virtual.item.actualHeight + gap)
      return baseOffset || 0
    } else {
      // For horizontal orientation
      const baseOffset = index * (virtual.item.actualWidth + gap)
      return baseOffset || 0
    }
  })

  // Find the index of the selected element
  let selectedIndex = -1
  if (selectedElement) {
    selectedIndex = slides.findIndex(slide => slide === selectedElement)
  }

  return {offsets, selectedIndex}
}

/**
 * Set active class on the current slide
 */
export const updateActiveSlide = (virtual: HoloVirtual): void => {
  if (!virtual?.id) return

  const currentIndex = getCurrentSlideIndex(virtual)
  const container = document.querySelector(`#${virtual.id} .holo-container`)

  if (!container) return

  // Remove active class from all slides
  const slides = Array.from(container.children)
  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index === currentIndex)
  })
}

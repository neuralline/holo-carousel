//src/libs/holo-dom-fix.ts

import {CyreLog} from 'cyre'
import type {HoloVirtual, HoloShadow, HoloDimensions} from '../types/interface'
import {_holo} from './holo-essentials'
import {EVENTS} from '../config/holo-config'

/**
 * Force calculation of carousel dimensions and retry if needed
 * This is a more robust version that ensures dimensions are calculated
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
    const updatedVirtual = calculateCarouselDimensionsFixed(virtual, shadow)

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
          height: updatedVirtual.item.height
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
        const retryVirtual = calculateCarouselDimensionsFixed(virtual, shadow)

        if (retryVirtual) {
          // Store the updated dimensions
          _holo[id].setDimension = {...retryVirtual}

          CyreLog.info(`Retry succeeded for ${id}:`, {
            width: retryVirtual.item.width,
            height: retryVirtual.item.height
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
 * Calculate carousel dimensions with improved robustness
 * Fixed to properly handle all cards in the carousel
 */
export const calculateCarouselDimensionsFixed = (
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

    // Store original styles
    const originalCarouselStyle = shadow.carousel.style.cssText
    const originalContainerStyle = shadow.container.style.cssText

    // Force visibility for measurement (but don't change position to avoid layout shifts)
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

    // Get dimensions of each slide with margins included
    let totalWidth = 0
    let totalHeight = 0
    let maxSlideWidth = 0
    let maxSlideHeight = 0

    // Measure each slide individually to account for varying widths
    slides.forEach(slide => {
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

      // Add to total dimensions
      totalWidth += slideWidth
      totalHeight += slideHeight

      // Restore original style
      slide.style.cssText = originalSlideStyle
    })

    // Fallback if dimensions are still zero
    if (maxSlideWidth === 0) maxSlideWidth = 200
    if (maxSlideHeight === 0) maxSlideHeight = 200
    if (totalWidth === 0) totalWidth = maxSlideWidth * slides.length
    if (totalHeight === 0) totalHeight = maxSlideHeight * slides.length

    // Calculate how many items can fit in view - this is just for display
    // purposes, not to limit the actual number of slides
    const numberOfSlots = Math.min(
      Math.max(1, Math.floor(parentWidth / maxSlideWidth)),
      virtual.item.max || 10
    )

    // Calculate carousel dimensions (the viewport)
    const carouselWidth = virtual.io.orientation
      ? parentWidth
      : Math.min(numberOfSlots * maxSlideWidth, parentWidth)

    const carouselHeight = virtual.io.orientation
      ? Math.min(numberOfSlots * maxSlideHeight, parentHeight)
      : maxSlideHeight

    // CRITICAL FIX: Calculate container dimensions to include ALL slides
    // This ensures all slides are accessible by scrolling
    const containerWidth = virtual.io.orientation
      ? parentWidth // For vertical orientation, container width is just parent width
      : totalWidth // For horizontal, it's the sum of all slide widths

    const containerHeight = virtual.io.orientation
      ? totalHeight // For vertical orientation, container height is the sum of all slide heights
      : maxSlideHeight // For horizontal, it's just the maximum slide height

    // Calculate end position (how far carousel can scroll)
    // CRITICAL FIX: This calculation determines if all slides can be accessed
    const endOfSlidePosition = virtual.io.orientation
      ? -Math.max(0, containerHeight - carouselHeight)
      : -Math.max(0, containerWidth - carouselWidth)

    // Restore original styles
    shadow.carousel.style.cssText = originalCarouselStyle
    shadow.container.style.cssText = originalContainerStyle

    // Log the calculated dimensions for debugging
    CyreLog.info(`Carousel ${virtual.id} dimensions calculated:`, {
      slides: slides.length,
      slideWidth: maxSlideWidth,
      slideHeight: maxSlideHeight,
      carouselWidth,
      carouselHeight,
      containerWidth,
      containerHeight,
      endOfSlidePosition
    })

    // Create updated virtual state with new dimensions
    return {
      ...virtual,
      item: {
        ...virtual.item,
        width: maxSlideWidth,
        height: maxSlideHeight
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
    CyreLog.error(
      `Error in fixed dimension calculation for ${virtual.id}:`,
      error
    )
    return null
  }
}

/**
 * Get element dimensions including margins with additional safeguards
 */
export const getElementDimensionsFixed = (
  element: HTMLElement
): HoloDimensions => {
  if (!element) return {width: 0, height: 0}

  // Try to get dimensions from inline styles first (most reliable)
  let width = 0
  let height = 0

  // Get from inline style if available
  if (element.style.width && element.style.height) {
    width = parseInt(element.style.width, 10) || 0
    height = parseInt(element.style.height, 10) || 0

    if (width > 0 && height > 0) {
      CyreLog.info(`Using inline dimensions: ${width}x${height}`)
    }
  }

  // If inline styles didn't work, try getBoundingClientRect
  if (width === 0 || height === 0) {
    const rect = element.getBoundingClientRect()
    width = rect.width || 0
    height = rect.height || 0

    if (width > 0 && height > 0) {
      CyreLog.info(`Using getBoundingClientRect dimensions: ${width}x${height}`)
    }
  }

  // If still zero, try offsetWidth/offsetHeight
  if (width === 0 || height === 0) {
    width = element.offsetWidth || 0
    height = element.offsetHeight || 0

    if (width > 0 && height > 0) {
      CyreLog.info(`Using offset dimensions: ${width}x${height}`)
    }
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
  if (width <= 0 || isNaN(width)) {
    CyreLog.warn(`Invalid width calculated: ${width}, using default of 200px`)
    width = 200 // Default fallback width
  }

  if (height <= 0 || isNaN(height)) {
    CyreLog.warn(`Invalid height calculated: ${height}, using default of 200px`)
    height = 200 // Default fallback height
  }

  return {
    width,
    height
  }
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

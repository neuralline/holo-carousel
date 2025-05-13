// src/components/orientation-handler.ts

import type {HoloVirtual} from '../types/interface'
import {snapToGrid} from '../libs/holo-essentials'
import {CyreLog} from 'cyre'

// src/components/orientation-handler.ts

// src/components/orientation-handler.ts

/**
 * Handles horizontal transformations
 * Apply constraints and snap to grid functionality
 * Improved to handle all slides properly
 */
export const transformX = (virtual: HoloVirtual): HoloVirtual => {
  // Check for valid dimensions to avoid NaN errors
  if (!virtual.item.width || isNaN(virtual.item.width)) {
    CyreLog.warn(
      `Missing width for horizontal carousel ${virtual.id}. Using fallback.`
    )
    virtual.item.width = 200
  }

  // Create a new object to maintain immutability
  const updatedVirtual = {
    ...virtual,
    transformY: 0,
    transformX:
      virtual.io.snap && virtual.item.width
        ? snapToGrid(virtual.transformX, virtual.item.width || 0)
        : virtual.transformX
  }

  // IMPROVED: Make sure we have valid container and carousel dimensions
  const containerWidth = virtual.container.width || 0
  const carouselWidth = virtual.carousel.width || 0

  // Calculate the true end position based on the FULL container width
  const calculatedEndPosition = -Math.max(0, containerWidth - carouselWidth)

  // If the calculated end position is different from stored, log it
  if (calculatedEndPosition !== virtual.endOfSlidePosition) {
    CyreLog.info(
      `Updating end position for ${virtual.id}: ${virtual.endOfSlidePosition} -> ${calculatedEndPosition}`
    )
    updatedVirtual.endOfSlidePosition = calculatedEndPosition
  }

  // Apply boundary constraints
  if (updatedVirtual.transformX >= 0) {
    updatedVirtual.transformX = 0
    updatedVirtual.endOfSlide = 1 // Left end of the carousel
  } else if (updatedVirtual.transformX <= updatedVirtual.endOfSlidePosition) {
    updatedVirtual.transformX = updatedVirtual.endOfSlidePosition
    updatedVirtual.endOfSlide = -1 // Right end of the carousel
  } else {
    updatedVirtual.endOfSlide = 0 // In the middle of carousel
  }

  return updatedVirtual
}

/**
 * Handles vertical transformations
 * Apply constraints and snap to grid functionality
 * Improved to handle all slides properly
 */
export const transformY = (virtual: HoloVirtual): HoloVirtual => {
  // Check for valid dimensions first to avoid NaN errors
  if (!virtual.item.height || isNaN(virtual.item.height)) {
    CyreLog.warn(
      `Missing height for vertical carousel ${virtual.id}. Using fallback.`
    )
    // Set a fallback height to prevent further issues
    virtual.item.height = 200
  }

  // Create a new object to maintain immutability
  const updatedVirtual = {
    ...virtual,
    transformX: 0, // Reset X transform for vertical carousels
    transformY:
      virtual.io.snap && virtual.item.height
        ? snapToGrid(virtual.transformY, virtual.item.height || 0)
        : virtual.transformY
  }

  // IMPROVED: Make sure we have valid container and carousel dimensions
  const containerHeight = virtual.container.height || 0
  const carouselHeight = virtual.carousel.height || 0

  // Calculate the true end position based on the FULL container height
  const calculatedEndPosition = -Math.max(0, containerHeight - carouselHeight)

  // If the calculated end position is different from stored, update it
  if (calculatedEndPosition !== virtual.endOfSlidePosition) {
    CyreLog.info(
      `Updating end position for ${virtual.id}: ${virtual.endOfSlidePosition} -> ${calculatedEndPosition}`
    )
    updatedVirtual.endOfSlidePosition = calculatedEndPosition
  }

  // Apply boundary constraints
  if (updatedVirtual.transformY >= 0) {
    updatedVirtual.transformY = 0
    updatedVirtual.endOfSlide = 1 // Top end of the carousel
  } else if (updatedVirtual.transformY <= updatedVirtual.endOfSlidePosition) {
    updatedVirtual.transformY = updatedVirtual.endOfSlidePosition
    updatedVirtual.endOfSlide = -1 // Bottom end of the carousel
  } else {
    updatedVirtual.endOfSlide = 0 // In the middle of carousel
  }

  return updatedVirtual
}
/**
 * Handles horizontal transformations (lightweight version)
 * Only applies boundary constraints without snapping
 */
export const transformXLite = (virtual: HoloVirtual): HoloVirtual => {
  // Create a new object to maintain immutability
  const updatedVirtual = {
    ...virtual,
    transformY: 0
  }

  // Apply boundary constraints only
  if (updatedVirtual.transformX >= 0) {
    updatedVirtual.transformX = 0
    updatedVirtual.endOfSlide = 1
  } else if (updatedVirtual.transformX <= updatedVirtual.endOfSlidePosition) {
    updatedVirtual.transformX = updatedVirtual.endOfSlidePosition
    updatedVirtual.endOfSlide = -1
  } else {
    updatedVirtual.endOfSlide = 0
  }

  return updatedVirtual
}

/**
 * Handles vertical transformations (lightweight version)
 * Only applies boundary constraints without snapping
 */
export const transformYLite = (virtual: HoloVirtual): HoloVirtual => {
  // Check for valid dimensions first
  if (!virtual.item.height || isNaN(virtual.item.height)) {
    CyreLog.warn(
      `Missing height for vertical carousel ${virtual.id}. Using fallback.`
    )
    // Set a fallback height to prevent further issues
    virtual.item.height = 200
  }

  // Create a new object to maintain immutability
  const updatedVirtual = {
    ...virtual,
    transformX: 0
  }

  // Apply boundary constraints only
  if (updatedVirtual.transformY >= 0) {
    updatedVirtual.transformY = 0
    updatedVirtual.endOfSlide = 1
  } else if (updatedVirtual.transformY <= updatedVirtual.endOfSlidePosition) {
    updatedVirtual.transformY = updatedVirtual.endOfSlidePosition
    updatedVirtual.endOfSlide = -1
  } else {
    updatedVirtual.endOfSlide = 0
  }

  return updatedVirtual
}

/**
 * Apply transformation based on orientation
 * @param virtual Virtual state
 * @param light Whether to use lightweight transform (no snapping)
 * @returns Updated virtual state with constraints applied
 */
export const applyTransform = (
  virtual: HoloVirtual,
  light: boolean = false
): HoloVirtual => {
  if (virtual.io.orientation) {
    return light ? transformYLite(virtual) : transformY(virtual)
  } else {
    return light ? transformXLite(virtual) : transformX(virtual)
  }
}

/**
 * Smart transform function that chooses the right transform based on context
 * @param virtual Virtual state
 * @param options Options for transformation
 * @returns Updated virtual state with transformation applied
 */
export const smartTransform = (
  virtual: HoloVirtual,
  options: {
    snap?: boolean
    light?: boolean
    target?: number
  } = {}
): HoloVirtual => {
  // Determine if we're going to a specific target position
  if (options.target !== undefined) {
    const isVertical = !!virtual.io.orientation
    const itemSize = isVertical
      ? virtual.item.height || 0
      : virtual.item.width || 0

    if (itemSize > 0) {
      const targetPosition = -Math.abs(options.target * itemSize)

      // Create a new state with the target position
      const targetVirtual = {
        ...virtual,
        transformX: isVertical ? 0 : targetPosition,
        transformY: isVertical ? targetPosition : 0
      }

      // Apply the appropriate transform to enforce boundaries
      return applyTransform(targetVirtual, !options.snap)
    }
  }

  // Otherwise just apply the normal transform
  return applyTransform(virtual, options.light)
}

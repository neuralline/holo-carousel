// src/components/orientation-handler.ts

import type {HoloVirtual} from '../types/interface'
import {snapToGrid} from '../libs/holo-essentials'

/**
 * Handles horizontal transformations
 * Apply constraints and snap to grid functionality
 */
export const transformX = (virtual: HoloVirtual): HoloVirtual => {
  // Create a new object to maintain immutability
  const updatedVirtual = {
    ...virtual,
    transformY: 0,
    transformX: virtual.io.snap
      ? snapToGrid(virtual.transformX, virtual.item.width || 0)
      : virtual.transformX
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
 * Handles vertical transformations
 * Apply constraints and snap to grid functionality
 */
export const transformY = (virtual: HoloVirtual): HoloVirtual => {
  // Create a new object to maintain immutability
  const updatedVirtual = {
    ...virtual,
    transformX: 0,
    transformY: virtual.io.snap
      ? snapToGrid(virtual.transformY, virtual.item.height || 0)
      : virtual.transformY
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
 * Handles vertical transformations (lightweight version)
 * Only applies boundary constraints without snapping
 */
export const transformYLite = (virtual: HoloVirtual): HoloVirtual => {
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

//src/components/orientation-handler.ts

import {VirtualDomState} from '../types/interface'
import {_snap} from './holo-essentials'

/**
 * Transform carousel horizontally with boundary checks
 */
export const _transformX = (virtualDom: VirtualDomState): VirtualDomState => {
  const updated = {...virtualDom}

  // Apply snap if enabled
  updated.transformX = updated.io.snap
    ? _snap(updated.transformX, updated.item.width || 0)
    : updated.transformX

  // Reset vertical position
  updated.transformY = 0

  // Handle boundaries
  if (updated.transformX >= 0) {
    updated.transformX = 0
    updated.endOfSlide = 1 // Left end of the carousel
  } else if (updated.transformX <= updated.endOfSlidePosition) {
    updated.transformX = updated.endOfSlidePosition
    updated.endOfSlide = -1 // Right end of the carousel
  } else {
    updated.endOfSlide = 0 // In the middle of carousel
  }

  return updated
}

/**
 * Transform carousel horizontally without snap (for smooth dragging)
 */
export const _transformXLite = (
  virtualDom: VirtualDomState
): VirtualDomState => {
  const updated = {...virtualDom}

  // Reset vertical position
  updated.transformY = 0

  // Handle boundaries without snap
  if (updated.transformX >= 0) {
    updated.transformX = 0
  } else if (updated.transformX <= updated.endOfSlidePosition) {
    updated.transformX = updated.endOfSlidePosition
  }

  return updated
}

/**
 * Transform carousel vertically with boundary checks
 */
export const _transformY = (virtualDom: VirtualDomState): VirtualDomState => {
  const updated = {...virtualDom}

  // Apply snap if enabled
  updated.transformY = updated.io.snap
    ? _snap(updated.transformY, updated.item.height || 0)
    : updated.transformY

  // Reset horizontal position
  updated.transformX = 0

  // Handle boundaries
  if (updated.transformY >= 0) {
    updated.transformY = 0
    updated.endOfSlide = 1 // Top end of the carousel
  } else if (updated.transformY <= updated.endOfSlidePosition) {
    updated.transformY = updated.endOfSlidePosition
    updated.endOfSlide = -1 // Bottom end of the carousel
  } else {
    updated.endOfSlide = 0 // In the middle of carousel
  }

  return updated
}

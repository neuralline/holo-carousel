//src/components/orientation-handler.ts

import {VirtualDomState} from '../types/interface'
import {_snap, clampIndex, pageOf} from './holo-essentials'

const itemSize = (virtualDom: VirtualDomState): number =>
  (virtualDom.io.orientation
    ? virtualDom.item.height
    : virtualDom.item.width) || 0

const edgeOf = (position: number, end: number): number =>
  position >= 0 ? 1 : position <= end ? -1 : 0

/**
 * Put the carousel at an item index: the position, which end it is at,
 * and the page, for either orientation. Pure.
 */
export const _place = (
  virtualDom: VirtualDomState,
  target: number
): Partial<VirtualDomState> => {
  const index = clampIndex(target, virtualDom.maxIndex)
  const position = Math.max(
    -index * itemSize(virtualDom) || 0,
    virtualDom.endOfSlidePosition
  )
  const vertical = !!virtualDom.io.orientation

  return {
    index,
    transformX: vertical ? 0 : position,
    transformY: vertical ? position : 0,
    endOfSlide:
      virtualDom.maxIndex === 0
        ? index === 0
          ? 1
          : -1
        : index === 0
          ? 1
          : index >= virtualDom.maxIndex
            ? -1
            : 0,
    page: pageOf(index, virtualDom.maxIndex, virtualDom.step)
  }
}

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
  updated.transformX = Math.min(
    0,
    Math.max(updated.transformX, updated.endOfSlidePosition)
  )
  updated.endOfSlide = edgeOf(updated.transformX, updated.endOfSlidePosition)

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
  updated.transformX = Math.min(
    0,
    Math.max(updated.transformX, updated.endOfSlidePosition)
  )

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
  updated.transformY = Math.min(
    0,
    Math.max(updated.transformY, updated.endOfSlidePosition)
  )
  updated.endOfSlide = edgeOf(updated.transformY, updated.endOfSlidePosition)

  return updated
}

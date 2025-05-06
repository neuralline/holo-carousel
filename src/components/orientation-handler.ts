//src/components/orientation-handler.ts

import {HoloVirtual} from '../types/interface'
import {_snap} from '../libs/holo-essentials'

/**
 * Handles horizontal transformations
 * @param virtual - Virtual state
 */
export const _transformX = (virtual: HoloVirtual): HoloVirtual => {
  virtual.transformX = virtual.io.snap
    ? _snap(virtual.transformX, virtual.item.width || 0)
    : virtual.transformX
  virtual.transformY = 0

  if (virtual.transformX >= 0) {
    virtual.transformX = 0
    virtual.endOfSlide = 1 //Left EnD of the carousel
  } else if (virtual.transformX <= virtual.endOfSlidePosition!) {
    virtual.transformX = virtual.endOfSlidePosition!
    virtual.endOfSlide = -1 //Right end of the carousel
  } else {
    virtual.endOfSlide = 0 //in the middle carousel
  }

  return virtual
}

/**
 * Handles horizontal transformations (lightweight version)
 * @param virtual - Virtual state
 */
export const _transformXLite = (virtual: HoloVirtual): HoloVirtual => {
  virtual.transformY = 0

  if (virtual.transformX >= 0) {
    virtual.transformX = 0
  } else if (virtual.transformX <= virtual.endOfSlidePosition!) {
    virtual.transformX = virtual.endOfSlidePosition!
  }

  return virtual
}

/**
 * Handles vertical transformations
 * @param virtual - Virtual state
 */
export const _transformY = (virtual: HoloVirtual): HoloVirtual => {
  virtual.transformY = virtual.io.snap
    ? _snap(virtual.transformY, virtual.item.height || 0)
    : virtual.transformY
  virtual.transformX = 0

  if (virtual.transformY >= 0) {
    virtual.transformY = 0
    virtual.endOfSlide = 1 //Left EnD of the carousel
  } else if (virtual.transformY <= virtual.endOfSlidePosition!) {
    virtual.transformY = virtual.endOfSlidePosition!
    virtual.endOfSlide = -1 //Right end of the carousel
  } else {
    virtual.endOfSlide = 0 //in the middle carousel
  }

  return virtual
}

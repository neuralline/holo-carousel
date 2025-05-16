//src/components/orientation-handler

import {_snap} from './holo-essentials'
/**
 *
 * @param {object} virtual
 */
export const _transformX = virtual => {
  virtual.transformX = virtual.io.snap
    ? _snap(virtual.transformX, virtual.item.width)
    : virtual.transformX
  virtual.transformY = 0
  if (virtual.transformX >= 0) {
    virtual.transformX = 0
    virtual.endOfSlide = 1 //Left EnD of the carousel
  } else if (virtual.transformX <= virtual.endOfSlidePosition) {
    virtual.transformX = virtual.endOfSlidePosition
    virtual.endOfSlide = -1 //Right end of the carousel
  } else {
    virtual.endOfSlide = 0 //in the middle carousel
  }
  return virtual
}

export const _transformXLite = virtual => {
  virtual.transformY = 0
  if (virtual.transformX >= 0) {
    virtual.transformX = 0
  } else if (virtual.transformX <= virtual.endOfSlidePosition) {
    virtual.transformX = virtual.endOfSlidePosition
  }
  return virtual
}

/**
 *
 * @param {object} virtual
 */
export const _transformY = virtual => {
  virtual.transformY = virtual.io.snap
    ? _snap(virtual.transformY, virtual.item.height)
    : virtual.transformY
  virtual.transformX = 0
  if (virtual.transformY >= 0) {
    virtual.transformY = 0
    virtual.endOfSlide = 1 //Left EnD of the carousel
  } else if (virtual.transformY <= virtual.endOfSlidePosition) {
    virtual.transformY = virtual.endOfSlidePosition
    virtual.endOfSlide = -1 //Right end of the carousel
  } else {
    virtual.endOfSlide = 0 //in the middle carousel
  }
  return virtual
}

//src/libs/holo-navigation.ts

import {cyre, CyreLog} from 'cyre'
import type {HoloVirtual} from '../types/interface'
import {_holo} from './holo-essentials'
import {EVENTS} from '../config/holo-config'
import {getSlideOffsets} from './holo-dom'

/**
 * Centralized navigation functions for Holo carousel
 */

/**
 * Go to next slide
 * @param virtual Virtual state
 */
export const goToNextSlide = (virtual: HoloVirtual): void => {
  if (!virtual?.id) {
    CyreLog.error('Cannot navigate: Invalid virtual state')
    return
  }

  // Check if at the end
  if (virtual.endOfSlide === -1 && !virtual.io.loop) {
    // Already at the end and no loop configured
    return
  }

  // Loop back to start if needed
  if (virtual.endOfSlide === -1 && virtual.io.loop) {
    cyre.call(EVENTS.FIRST_SLIDE, virtual)
    return
  }

  // Calculate slide width/height based on orientation
  const slideDimension = virtual.io.orientation
    ? virtual.item.height || 0
    : virtual.item.width || 0

  if (!slideDimension) {
    CyreLog.error(
      `Cannot navigate: Missing dimension for carousel ${virtual.id}`
    )
    return
  }

  // IMPROVED: Calculate the current position and determine next slide position
  const currentPosition = virtual.io.orientation
    ? virtual.transformY
    : virtual.transformX

  const currentIndex = Math.round(Math.abs(currentPosition) / slideDimension)

  // CRITICAL: Check if we're at the last slide
  const maxIndex = (virtual.noOfChildren || 0) - 1

  // Prevent going beyond the last slide
  let nextIndex = currentIndex + 1
  if (nextIndex > maxIndex && !virtual.io.loop) {
    nextIndex = maxIndex
  }

  // Calculate the new transform position precisely
  const newTransform = -Math.abs(nextIndex * slideDimension)

  // Ensure we don't go beyond limits
  const minPosition = virtual.endOfSlidePosition || 0
  const newPosition = Math.max(newTransform, minPosition)

  // Create updated virtual state with new position
  const updatedVirtual = {
    ...virtual,
    transformX: virtual.io.orientation ? virtual.transformX : newPosition,
    transformY: virtual.io.orientation ? newPosition : virtual.transformY
  }

  // Log navigation for debugging
  CyreLog.info(
    `Navigating to next slide: ${currentIndex} -> ${nextIndex}, position: ${currentPosition} -> ${newPosition}`
  )

  // Go to position
  cyre.call(EVENTS.SNAP_TO_POSITION, updatedVirtual)
}

/**
 * Go to previous slide
 * @param virtual Virtual state
 */
export const goToPrevSlide = (virtual: HoloVirtual): void => {
  if (!virtual?.id) {
    CyreLog.error('Cannot navigate: Invalid virtual state')
    return
  }

  // Check if at the beginning
  if (virtual.endOfSlide === 1 && !virtual.io.loop) {
    return
  }

  // Loop to end if needed
  if (virtual.endOfSlide === 1 && virtual.io.loop) {
    cyre.call(EVENTS.LAST_SLIDE, virtual)
    return
  }

  // Calculate slide width/height based on orientation
  const slideDimension = virtual.io.orientation
    ? virtual.item.height || 0
    : virtual.item.width || 0

  if (!slideDimension) {
    CyreLog.error(
      `Cannot navigate: Missing dimension for carousel ${virtual.id}`
    )
    return
  }

  // IMPROVED: Calculate current and previous slide position
  const currentPosition = virtual.io.orientation
    ? virtual.transformY
    : virtual.transformX

  const currentIndex = Math.round(Math.abs(currentPosition) / slideDimension)

  // Prevent going below the first slide
  let prevIndex = currentIndex - 1
  if (prevIndex < 0 && !virtual.io.loop) {
    prevIndex = 0
  }

  // Calculate the new transform position
  const newTransform = -Math.abs(prevIndex * slideDimension)

  // Create updated virtual state with new position
  const updatedVirtual = {
    ...virtual,
    transformX: virtual.io.orientation ? virtual.transformX : newTransform,
    transformY: virtual.io.orientation ? newTransform : virtual.transformY
  }

  // Log navigation for debugging
  CyreLog.info(`Navigating to previous slide: ${currentIndex} -> ${prevIndex}`)

  // Go to position
  cyre.call(EVENTS.SNAP_TO_POSITION, updatedVirtual)
}

/**
 * Go to first slide
 * @param virtual Virtual state
 */
export const goToFirstSlide = (virtual: HoloVirtual): void => {
  if (!virtual?.id) {
    CyreLog.error('Cannot navigate: Invalid virtual state')
    return
  }

  // Create updated virtual state with start position
  const updatedVirtual = {
    ...virtual,
    transformX: 0,
    transformY: 0,
    endOfSlide: 1 // At the start
  }

  // Go to position
  cyre.call(EVENTS.SNAP_TO_POSITION, updatedVirtual)
}

/**
 * Go to last slide
 * @param virtual Virtual state
 */
export const goToLastSlide = (virtual: HoloVirtual): void => {
  if (!virtual?.id) {
    CyreLog.error('Cannot navigate: Invalid virtual state')
    return
  }

  // IMPROVED: Calculate the position of the last slide directly
  const slideDimension = virtual.io.orientation
    ? virtual.item.height || 0
    : virtual.item.width || 0

  const maxIndex = (virtual.noOfChildren || 1) - 1
  const lastSlidePosition = -Math.abs(maxIndex * slideDimension)

  // Get absolute end position (from container dimensions)
  const absoluteEndPosition = virtual.endOfSlidePosition || 0

  // Use the greater (less negative) of the two to ensure we don't scroll too far
  const finalPosition = Math.max(lastSlidePosition, absoluteEndPosition)

  // Create updated virtual state with end position
  const updatedVirtual = {
    ...virtual,
    transformX: virtual.io.orientation ? 0 : finalPosition,
    transformY: virtual.io.orientation ? finalPosition : 0,
    endOfSlide: -1 // At the end
  }

  // Go to position
  cyre.call(EVENTS.SNAP_TO_POSITION, updatedVirtual)
}

/**
 * Go to specific slide index
 * @param virtual Virtual state
 * @param index Slide index to navigate to
 */
export const goToSlide = (virtual: HoloVirtual, index: number): void => {
  if (!virtual?.id) {
    CyreLog.error('Cannot navigate: Invalid virtual state')
    return
  }

  // Calculate slide width/height based on orientation
  const slideDimension = virtual.io.orientation
    ? virtual.item.height || 0
    : virtual.item.width || 0

  if (!slideDimension) {
    CyreLog.error(
      `Cannot navigate: Missing dimension for carousel ${virtual.id}`
    )
    return
  }

  // IMPROVED: Check against max index
  const maxIndex = (virtual.noOfChildren || 1) - 1
  const safeIndex = Math.min(Math.max(0, index), maxIndex)

  // Calculate the new transform position precisely
  const newTransform = -Math.abs(safeIndex * slideDimension)

  // Create updated virtual state with calculated position
  const updatedVirtual = {
    ...virtual,
    transformX: virtual.io.orientation ? 0 : newTransform,
    transformY: virtual.io.orientation ? newTransform : 0
  }

  // Log navigation for debugging
  CyreLog.info(`Navigating to specific slide: ${safeIndex}`)

  // Go to position
  cyre.call(EVENTS.SNAP_TO_POSITION, updatedVirtual)
}

/**
 * Activate a specific slide (focus on click)
 * @param element The slide element
 * @param virtual Virtual state
 */
export const activateSlide = (
  element: HTMLElement,
  virtual: HoloVirtual
): void => {
  if (!element || !virtual?.id) {
    CyreLog.error('Cannot activate slide: Invalid parameters')
    return
  }

  // Get offset positions of all slides
  const {offsets, selectedIndex} = getSlideOffsets(virtual, element)

  if (selectedIndex === -1) {
    CyreLog.error('Could not determine slide index')
    return
  }

  // Update active class
  document.querySelectorAll(`#${virtual.id} .holo`).forEach(el => {
    el.classList.remove('active')
  })
  element.classList.add('active')

  // Create updated virtual state with new position based on offset
  const updatedVirtual = {
    ...virtual,
    transformX: virtual.io.orientation
      ? virtual.transformX
      : -Math.abs(offsets[selectedIndex]),
    transformY: virtual.io.orientation
      ? -Math.abs(offsets[selectedIndex])
      : virtual.transformY
  }

  // Go to position
  cyre.call(EVENTS.SNAP_TO_POSITION, updatedVirtual)
}

/**
 * Animate carousel in specified direction
 * @param virtual Virtual state
 * @param directionForward Direction of animation (true = forward, false = backward)
 */
export const animateCarousel = (
  virtual: HoloVirtual,
  directionForward: boolean = true
): void => {
  if (!virtual?.id) {
    CyreLog.error('Cannot animate: Invalid virtual state')
    return
  }

  if (directionForward) {
    // Moving forward
    if (virtual.endOfSlide === -1 && virtual.io.loop) {
      // Loop back to start when at the end
      goToFirstSlide(virtual)
    } else {
      // Go to next slide
      goToNextSlide(virtual)
    }
  } else {
    // Moving backward
    if (virtual.endOfSlide === 1 && virtual.io.loop) {
      // Loop to end when at the start
      goToLastSlide(virtual)
    } else {
      // Go to previous slide
      goToPrevSlide(virtual)
    }
  }
}

/**
 * Handle mouse wheel events for carousel navigation
 * @param e Wheel event
 * @param id Carousel ID
 */
export const handleWheel = (e: WheelEvent, id: string): void => {
  e.preventDefault()
  const virtual = _holo[id]?.getVirtual

  if (!virtual) {
    CyreLog.error(`Cannot handle wheel: Carousel ${id} not found`)
    return
  }

  if (e.deltaY < 0) {
    goToPrevSlide(virtual)
  } else if (e.deltaY > 0) {
    goToNextSlide(virtual)
  }
}

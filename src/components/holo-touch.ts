//src/components/holo-touch.ts

import cyre from 'cyre'
import {VirtualDomState, TouchState} from '../types/interface'
import {holoStore} from '../core/state'
import {_isClicked, _swipe} from './holo-essentials'
import {_transformXLite, _transformY} from './orientation-handler'
import {EVENTS} from '../config/holo-config'

// Track animation frames for cleanup
const animationFrames: Record<string, number> = {}

/**
 * Handle touch/mouse start event
 */
export const _touchStart = (e: TouchEvent | MouseEvent, id: string): void => {
  if (!id) {
    cyre.call(EVENTS.ERROR, '@_touchStart: missing carousel ID')
    return
  }

  const instance = holoStore.getInstance(id)
  if (!instance) {
    cyre.call(EVENTS.ERROR, '@_touchStart: undefined getInstance fro: ' + id)
    return
  }

  // Cancel any existing animation
  if (animationFrames[id]) {
    cancelAnimationFrame(animationFrames[id])
    delete animationFrames[id]
  }

  // Get client coordinates
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

  // Update touch state
  const touchState: TouchState = {
    pressed: true,
    positionX: clientX,
    positionY: clientY,
    currentX: clientX,
    currentY: clientY,
    TouchStartTimeStamp: performance.now(),
    multiplier: 1.482,
    snapShotWidth: instance.virtualDom.transformX || 0,
    snapShotHeight: instance.virtualDom.transformY || 0
  }

  holoStore.updateTouchState(id, touchState)
  holoStore.updateStyle(id, false)

  // Start appropriate drag handler based on orientation
  if (instance.virtualDom.io.orientation) {
    _dragScrollVertical(id)
    e.preventDefault()
  } else {
    _dragScrollHorizontal(id)
    e.preventDefault()
  }
}

/**
 * Handle horizontal drag movement
 */
export const _dragScrollHorizontal = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance || !instance.touchState.pressed) return

  const {touchState, virtualDom} = instance

  // Calculate distance moved
  const distance = touchState.positionX - touchState.currentX

  // Update virtual DOM for horizontal movement
  const newTransformX =
    (touchState.snapShotWidth || 0) - distance * touchState.multiplier
  const updatedVirtual = _transformXLite({
    ...virtualDom,
    transformX: newTransformX
  })

  // Update store
  holoStore.updateVirtualDom(id, updatedVirtual)
  holoStore.updateTouchState(id, {distance})

  // Apply DOM transform
  holoStore.applyDomTransform(id)

  // Continue animation if still pressed
  if (instance.touchState.pressed) {
    animationFrames[id] = requestAnimationFrame(() => _dragScrollHorizontal(id))
  }
}

/**
 * Handle vertical drag movement
 */
export const _dragScrollVertical = (id: string): void => {
  const instance = holoStore.getInstance(id)
  if (!instance || !instance.touchState.pressed) return

  const {touchState, virtualDom} = instance

  // Calculate distance moved
  const distance = touchState.positionY - touchState.currentY

  // Update virtual DOM for vertical movement
  const newTransformY =
    (touchState.snapShotHeight || 0) - distance * touchState.multiplier
  const updatedVirtual = _transformY({
    ...virtualDom,
    transformY: newTransformY
  })

  // Update store
  holoStore.updateVirtualDom(id, updatedVirtual)
  holoStore.updateTouchState(id, {distance})

  // Apply DOM transform
  holoStore.applyDomTransform(id)

  // Continue animation if still pressed
  if (instance.touchState.pressed) {
    animationFrames[id] = requestAnimationFrame(() => _dragScrollVertical(id))
  }
}

/**
 * Handle touch/mouse end event
 */
export const _touchEnd = (e: TouchEvent | MouseEvent): void => {
  // Find the active carousel
  const instances = holoStore.getAllInstances()
  let activeId: string | null = null

  for (const id in instances) {
    if (instances[id].touchState.pressed) {
      activeId = id
      break
    }
  }

  if (!activeId) return

  const instance = holoStore.getInstance(activeId)
  if (!instance) return

  e.preventDefault()

  // Cancel animation frame
  if (animationFrames[activeId]) {
    cancelAnimationFrame(animationFrames[activeId])
    delete animationFrames[activeId]
  }

  // Mark as no longer pressed
  holoStore.updateTouchState(activeId, {pressed: false})

  const {touchState, virtualDom} = instance

  // Calculate timing and speed
  const touchEndTimeStamp = performance.now()
  const timeElapsed = touchEndTimeStamp - (touchState.TouchStartTimeStamp || 0)
  const speed = _swipe(touchState.distance || 0, timeElapsed)

  // Determine what action to take based on speed and time
  if (speed > 1.2) {
    cyre.call(EVENTS.NEXT_SLIDE, virtualDom)
  } else if (speed < -1.2) {
    cyre.call(EVENTS.PREV_SLIDE, virtualDom)
  } else if (_isClicked(timeElapsed)) {
    _focus(e, activeId)
  } else {
    cyre.call(EVENTS.SNAP, virtualDom)
  }
}

/**
 * Handle click/tap on carousel item
 */
export const _focus = (e: MouseEvent | TouchEvent, id: string): void => {
  const target = e.target as HTMLElement
  const holoItem = target.closest('li.holo')

  if (!holoItem) return cyre.call(EVENTS.ERROR, '_focus holo item not found')

  const instance = holoStore.getInstance(id)
  if (!instance)
    return cyre.call(EVENTS.ERROR, '_focus holo instance not found')

  // Remove active class from previous target
  if (instance.touchState.targetHoloComponent) {
    instance.touchState.targetHoloComponent.classList.remove('active')
  }

  // Store and highlight new target
  holoStore.updateTouchState(id, {targetHoloComponent: holoItem})

  // Activate selected slide
  cyre.call(EVENTS.ACTIVATE, [holoItem, instance.virtualDom])

  return true
}

/**
 * Setup global touch event listeners
 */
export const setupGlobalTouchListeners = (): (() => void) => {
  // Mouse move handler
  const handleMouseMove = (e: MouseEvent): void => {
    const instances = holoStore.getAllInstances()

    for (const id in instances) {
      if (instances[id].touchState.pressed) {
        holoStore.updateTouchState(id, {
          currentX: e.clientX,
          currentY: e.clientY
        })
      }
    }
  }

  // Touch move handler
  const handleTouchMove = (e: TouchEvent): void => {
    const instances = holoStore.getAllInstances()

    for (const id in instances) {
      if (instances[id].touchState.pressed) {
        holoStore.updateTouchState(id, {
          currentX: e.touches[0].clientX,
          currentY: e.touches[0].clientY
        })
      }
    }
  }

  // Mouse up handler
  const handleMouseUp = (e: MouseEvent): void => {
    e.preventDefault()

    const instances = holoStore.getAllInstances()
    let hasPressedInstance = false

    for (const id in instances) {
      if (instances[id].touchState.pressed) {
        hasPressedInstance = true
        break
      }
    }

    if (hasPressedInstance) {
      _touchEnd(e)
    }
  }

  // Touch end handler
  const handleTouchEnd = (e: TouchEvent): void => {
    const instances = holoStore.getAllInstances()
    let hasPressedInstance = false

    for (const id in instances) {
      if (instances[id].touchState.pressed) {
        hasPressedInstance = true
        break
      }
    }

    if (hasPressedInstance) {
      _touchEnd(e)
    }
  }

  // Add event listeners
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)

  // Return cleanup function
  return () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)

    // Cancel any ongoing animations
    Object.keys(animationFrames).forEach(id => {
      cancelAnimationFrame(animationFrames[id])
    })
  }
}

// Export everything as an object for default export
export default {
  _touchStart,
  _touchEnd,
  _dragScrollHorizontal,
  _dragScrollVertical,
  _focus,
  setupGlobalTouchListeners
}

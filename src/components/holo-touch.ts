// src/components/holo-touch.ts

import {cyre} from 'cyre'
import type {HoloTouchClass, HoloVirtual} from '../types/interface'
import {_holo, isClickEvent, calculateSwipeSpeed} from '../libs/holo-essentials'
import {transformXLite, transformY, applyTransform} from './orientation-handler'
import {EVENTS, TOUCH_EVENTS, PERFORMANCE} from '../config/holo-config'
import {safeEventCall} from '../core/holo-event-system'

/**
 * H.O.L.O - C.A.R.O.U.S.E.L
 * Enhanced touch system with error handling and performance optimizations
 */
const createTouchHandler = (): HoloTouchClass => {
  const touchHandler: HoloTouchClass = {
    positionX: 0,
    positionY: 0,
    pressed: 0,
    virtual: {} as HoloVirtual,
    multiplier: 1.5, // Slightly increased for smoother feel
    touch: {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup',
      enter: 'mouseenter'
    },
    targetHoloComponent: 0,
    TouchStartTimeStamp: 0,
    id: '',
    currentX: 0,
    currentY: 0,
    snapShotWidth: 0,
    snapShotHeight: 0,
    distance: 0,
    animationFrameId: 0, // For canceling animation frames

    /**
     * Register touch/click start event
     */
    _touchStart(e: MouseEvent | TouchEvent, id: string = ''): void {
      // Validation
      if (!id) {
        console.warn('Touch start: Missing carousel ID')
        return
      }

      if (this.pressed) {
        // Already in a touch/drag operation
        return
      }

      if (!_holo[id]) {
        console.error('Touch start: Invalid carousel ID:', id)
        return
      }

      this.TouchStartTimeStamp = performance.now()

      // Reset and initialize state
      this.virtual = _holo[id].getVirtual
      this.pressed = 1
      this.id = this.virtual.id

      // Get client coordinates from either mouse or touch event
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      this.positionX = clientX
      this.positionY = clientY
      this.currentX = clientX
      this.currentY = clientY
      this.snapShotWidth = this.virtual.transformX || 0
      this.snapShotHeight = this.virtual.transformY || 0

      // Start drag handling based on orientation
      if (this.virtual.io.orientation) {
        this._dragScrollVertical(e)
      } else {
        this._dragScrollHorizontal(e)
      }

      e.preventDefault()

      // Disable transition for the drag
      if (_holo[this.id]) {
        _holo[this.id].updateStyle = 0
      }
    },

    /**
     * Handle horizontal drag with optimized animation frame
     */
    _dragScrollHorizontal(
      e: MouseEvent | TouchEvent
    ): void | {ok: boolean; data: string} {
      if (!this.pressed || !this.id || !_holo[this.id]) {
        this.cancelDragAnimation()
        return {ok: false, data: 'Touch not active or invalid state'}
      }

      this.distance = this.positionX - this.currentX

      // Update virtual state with new position
      const updatedVirtual = {
        ...this.virtual,
        transformX: this.snapShotWidth - this.distance * this.multiplier || 0
      }

      // Apply constraints and update state
      const boundedVirtual = transformXLite(updatedVirtual)

      // Only update if position has changed
      if (boundedVirtual.transformX !== this.virtual.transformX) {
        _holo[this.id].setState = boundedVirtual
        this.virtual = boundedVirtual
      }

      // Use requestAnimationFrame for smooth animation
      this.animationFrameId = requestAnimationFrame(() =>
        this._dragScrollHorizontal(e)
      )
    },

    /**
     * Handle vertical drag with optimized animation frame
     */
    _dragScrollVertical(
      e: MouseEvent | TouchEvent
    ): void | {ok: boolean; data: string} {
      if (!this.pressed || !this.id || !_holo[this.id]) {
        this.cancelDragAnimation()
        return {ok: false, data: 'Touch not active or invalid state'}
      }

      this.distance = this.positionY - this.currentY

      // Update virtual state with new position
      const updatedVirtual = {
        ...this.virtual,
        transformY: this.snapShotHeight - this.distance * this.multiplier || 0
      }

      // Apply constraints and update state
      const boundedVirtual = transformY(updatedVirtual)

      // Only update if position has changed
      if (boundedVirtual.transformY !== this.virtual.transformY) {
        _holo[this.id].setState = boundedVirtual
        this.virtual = boundedVirtual
      }

      // Use requestAnimationFrame for smooth animation
      this.animationFrameId = requestAnimationFrame(() =>
        this._dragScrollVertical(e)
      )
    },

    /**
     * Cancel animation frame if needed
     */
    cancelDragAnimation(): void {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = 0
      }
    },

    /**
     * Handle touch/drag end event with fallback
     */
    _touchEnd(e: MouseEvent | TouchEvent): void | {ok: boolean; data: string} {
      // Cancel any ongoing animation
      this.cancelDragAnimation()

      if (!this.pressed || !this.id || !this.virtual?.id) {
        return {ok: false, data: 'Touch not active or invalid state'}
      }

      const touchEndTimeStamp = performance.now()
      e.preventDefault()
      this.pressed = 0 // Reset after drag event ended

      const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp
      const speed = calculateSwipeSpeed(this.distance, timeElapsed)
      const eventIds = this.virtual.eventIds || {}

      try {
        // Re-enable transitions first (for smooth snapping)
        if (_holo[this.id]) {
          _holo[this.id].updateStyle = 1
        }

        // Apply snapping for all cases
        let updatedVirtual = {...this.virtual}

        // For snap-enabled carousels, always apply grid snapping
        if (updatedVirtual.io.snap) {
          updatedVirtual = applyTransform(updatedVirtual, false)
        }

        // Determine the appropriate action based on the gesture
        if (Math.abs(speed) > 1.2) {
          // Fast swipe - treat as next/previous
          const eventId =
            speed > 0
              ? eventIds.nextSlide || EVENTS.NEXT_SLIDE
              : eventIds.prevSlide || EVENTS.PREV_SLIDE

          safeEventCall(
            eventId,
            speed > 0 ? EVENTS.NEXT_SLIDE : EVENTS.PREV_SLIDE,
            updatedVirtual
          )
        } else if (isClickEvent(timeElapsed)) {
          // Quick tap - treat as click
          return this.focus(e)
        } else {
          // Normal drag end - snap to position
          safeEventCall(
            eventIds.snap || `snap_${this.virtual.id}`,
            EVENTS.SNAP,
            updatedVirtual
          )
        }
      } catch (error) {
        console.error('Touch end error:', error)
        // Last resort fallback
        safeEventCall(EVENTS.SNAP, EVENTS.SNAP, this.virtual)
      }
    },

    /**
     * Focus/highlight the clicked slide
     */
    focus(e: MouseEvent | TouchEvent): boolean | void {
      const target = e.target as HTMLElement
      const closestHolo = target.closest('li.holo')

      if (!closestHolo || !this.id || !this.virtual?.id) {
        return false
      }

      // Remove active class from previous element
      if (this.targetHoloComponent instanceof HTMLElement) {
        this.targetHoloComponent.classList.remove('active')
      }

      this.targetHoloComponent = closestHolo

      try {
        // Get the event ID or use fallback
        const activateEvent = this.virtual.eventIds?.activate || EVENTS.ACTIVATE

        safeEventCall(activateEvent, EVENTS.ACTIVATE, [
          this.targetHoloComponent,
          this.virtual
        ])

        return true
      } catch (error) {
        console.error('Focus error:', error)
        // Direct DOM manipulation as last resort
        this.targetHoloComponent.classList.add('active')
        return true
      }
    }
  }

  return touchHandler
}

// Create a singleton touch handler instance
export const Touch = createTouchHandler()

/**
 * Setup global touch listeners
 */
export const setupGlobalTouchListeners = (): void => {
  // Mouse move event
  const handleMouseMove = (e: MouseEvent): void => {
    if (Touch.pressed) {
      Touch.currentX = e.clientX
      Touch.currentY = e.clientY
    }
  }

  // Mouse up event
  const handleMouseUp = (e: MouseEvent): void => {
    if (Touch.pressed) {
      Touch._touchEnd(e)
    }
  }

  // Touch move event
  const handleTouchMove = (e: TouchEvent): void => {
    if (Touch.pressed) {
      Touch.currentX = e.touches[0].clientX
      Touch.currentY = e.touches[0].clientY
      // Prevent page scrolling during carousel touch
      e.preventDefault()
    }
  }

  // Touch end event
  const handleTouchEnd = (e: TouchEvent): void => {
    if (Touch.pressed) {
      Touch._touchEnd(e)
    }
  }

  // Add throttled event listeners to improve performance
  document.addEventListener('mousemove', handleMouseMove, {passive: true})
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('touchmove', handleTouchMove, {passive: false})
  document.addEventListener('touchend', handleTouchEnd)
  document.addEventListener('touchcancel', handleTouchEnd)
}

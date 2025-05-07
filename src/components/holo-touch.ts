//src/components/holo-touch.ts

import {cyre} from 'cyre'
import type {HoloTouchClass, HoloVirtual} from '../types/interface'
import {_holo, isClickEvent, calculateSwipeSpeed} from '../libs/holo-essentials'
import {transformXLite, transformY} from './orientation-handler'

/**
 * H.O.L.O - C.A.R.O.U.S.E.L
 * TOUCH EVENTS HANDLER
 * Create a touch handler (functional approach)
 */
const createTouchHandler = (): HoloTouchClass => {
  const touchHandler: HoloTouchClass = {
    positionX: 0,
    positionY: 0,
    pressed: 0,
    virtual: {} as HoloVirtual,
    multiplier: 1.482,
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

    /**
     * Register if touch/click has occurred
     */
    _touchStart(e: MouseEvent | TouchEvent, id: string = ''): void {
      if (!id || this.pressed) {
        console.error('Holo touch: not my business')
        return
      }

      this.TouchStartTimeStamp = performance.now() // Start timer

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
      _holo[this.id].updateStyle = 0
    },

    /**
     * Handle horizontal drag touch moves
     */
    _dragScrollHorizontal(
      e: MouseEvent | TouchEvent
    ): void | {ok: boolean; data: string} {
      if (!this.pressed) return {ok: false, data: 'not active'}

      this.distance = this.positionX - this.currentX

      // Update virtual state with new position
      const updatedVirtual = {
        ...this.virtual,
        transformX: this.snapShotWidth - this.distance * this.multiplier || 0
      }

      // Apply constraints and update state
      const boundedVirtual = transformXLite(updatedVirtual)
      _holo[this.id!].setState = boundedVirtual
      this.virtual = boundedVirtual

      requestAnimationFrame(() => this._dragScrollHorizontal(e))
    },

    /**
     * Handle vertical drag touch moves
     */
    _dragScrollVertical(
      e: MouseEvent | TouchEvent
    ): void | {ok: boolean; data: string} {
      if (!this.pressed) return {ok: false, data: 'not active'}

      this.distance = this.positionY - this.currentY

      // Update virtual state with new position
      const updatedVirtual = {
        ...this.virtual,
        transformY: this.snapShotHeight - this.distance * this.multiplier || 0
      }

      // Apply constraints and update state
      const boundedVirtual = transformY(updatedVirtual)
      _holo[this.id!].setState = boundedVirtual
      this.virtual = boundedVirtual

      requestAnimationFrame(() => this._dragScrollVertical(e))
    },

    /**
     * Register event/mouse position when touch/drag ends
     * CRITICAL FIX: Call to generic methods instead of specific IDs when they're missing
     */
    _touchEnd(e: MouseEvent | TouchEvent): void | {ok: boolean; data: string} {
      if (!this.pressed) return {ok: false, data: 'not active'}

      const touchEndTimeStamp = performance.now()
      e.preventDefault()
      this.pressed = 0 // Reset after drag event ended

      const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp
      const speed = calculateSwipeSpeed(this.distance, timeElapsed)

      // FIXED: Use general events when specific ones aren't available
      // This prevents the "No subscriber found" error
      try {
        if (speed > 1.2) {
          // Try instance-specific ID first, fall back to general one if it fails
          if (this.virtual.eventIds?.nextSlide) {
            return cyre.call(this.virtual.eventIds.nextSlide, this.virtual)
          } else {
            // Fall back to general event
            return cyre.call('nxtSlide', this.virtual)
          }
        } else if (speed < -1.2) {
          if (this.virtual.eventIds?.prevSlide) {
            return cyre.call(this.virtual.eventIds.prevSlide, this.virtual)
          } else {
            return cyre.call('prvSlide', this.virtual)
          }
        } else if (isClickEvent(timeElapsed)) {
          return this.focus(e)
        } else {
          if (this.virtual.eventIds?.snap) {
            return cyre.call(this.virtual.eventIds.snap, this.virtual)
          } else {
            return cyre.call('SNAP', this.virtual)
          }
        }
      } catch (error) {
        console.error('Touch end error:', error)
        // Fall back to SNAP as last resort
        return cyre.call('SNAP', this.virtual)
      }
    },

    /**
     * Highlight active/selected slide
     * FIXED: Fall back to general activate event if specific one isn't available
     */
    focus(e: MouseEvent | TouchEvent): boolean | void {
      const target = e.target as HTMLElement
      const closestHolo = target.closest('li.holo')

      if (!closestHolo) return false

      // Remove active class from previous element
      if (this.targetHoloComponent) {
        ;(this.targetHoloComponent as HTMLElement).classList.remove('active')
      }

      this.targetHoloComponent = closestHolo

      try {
        // Try instance-specific event first
        if (this.virtual.eventIds?.activate) {
          return cyre.call(this.virtual.eventIds.activate, [
            this.targetHoloComponent,
            this.virtual
          ])
        } else {
          // Fall back to general event
          return cyre.call('activate', [this.targetHoloComponent, this.virtual])
        }
      } catch (error) {
        console.error('Focus error:', error)
        // Fall back to directly adding active class
        this.targetHoloComponent.classList.add('active')
        return true
      }
    }
  }

  return touchHandler
}

// Create a singleton touch handler instance
export const Touch = createTouchHandler()

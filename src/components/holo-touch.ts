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
     */
    _touchEnd(e: MouseEvent | TouchEvent): void | {ok: boolean; data: string} {
      if (!this.pressed) return {ok: false, data: 'not active'}

      const touchEndTimeStamp = performance.now()
      e.preventDefault()
      this.pressed = 0 // Reset after drag event ended

      const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp
      const speed = calculateSwipeSpeed(this.distance, timeElapsed)

      // Handle different cases based on speed and time
      if (speed > 1.2) {
        return cyre.call('nxtSlide' + this.id, this.virtual)
      } else if (speed < -1.2) {
        return cyre.call('prvSlide' + this.id, this.virtual)
      } else if (isClickEvent(timeElapsed)) {
        return this.focus(e)
      } else {
        return cyre.call('SNAP' + this.id, this.virtual)
      }
    },

    /**
     * Highlight active/selected slide
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
      return cyre.call('activate' + this.id, [
        this.targetHoloComponent,
        this.virtual
      ])
    }
  }

  return touchHandler
}

// Create a singleton touch handler instance
export const Touch = createTouchHandler()

//src/components/holo-touch.ts

import {cyre} from 'cyre'
import {HoloTouchClass, HoloVirtual} from '../types/interface'
import {_holo, _isClicked, _swipe} from '../libs/holo-essentials'
import {_transformXLite, _transformY} from './orientation-handler'

/**
 * H.O.L.O - C.A.R.O.U.S.E.L
 * TOUCH EVENTS HANDLER
 * Create a touch handler (functional approach)
 */
const createTouchHandler = (): HoloTouchClass => {
  const touch: HoloTouchClass = {
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
    currentX: 0,
    currentY: 0,
    snapShotWidth: 0,
    snapShotHeight: 0,

    /**
     * Register if touch/click has occurred
     */
    _touchStart(e: MouseEvent | TouchEvent, id: string = ''): void {
      if (!id || this.pressed) {
        console.error('Holo touch: not my business')
        return
      }

      this.TouchStartTimeStamp = performance.now() // Start timer

      // Reset default
      this.virtual = _holo[id].getVirtual
      this.pressed = 1

      // Get client coordinates from either mouse or touch event
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

      this.positionX = clientX
      this.positionY = clientY
      this.id = this.virtual.id
      this.currentX = clientX
      this.currentY = clientY
      this.snapShotWidth = this.virtual.transformX || 0
      this.snapShotHeight = this.virtual.transformY || 0

      // Start drag handling
      if (this.virtual.io.orientation) {
        this._dragScrollVertical(e)
      } else {
        this._dragScrollHorizontal(e)
      }

      e.preventDefault()
      _holo[this.id!].updateStyle = 0
    },

    /**
     * Handle horizontal drag touch moves
     */
    _dragScrollHorizontal(
      e: MouseEvent | TouchEvent
    ): void | {ok: boolean; data: string} {
      if (!this.pressed) return {ok: false, data: 'not active'}

      this.distance = this.positionX - this.currentX
      this.virtual.transformX =
        this.snapShotWidth - this.distance! * this.multiplier || 0
      _holo[this.id!].setState = _transformXLite(this.virtual)

      requestAnimationFrame(this._dragScrollHorizontal.bind(this))
    },

    /**
     * Handle vertical drag touch moves
     */
    _dragScrollVertical(
      e: MouseEvent | TouchEvent
    ): void | {ok: boolean; data: string} {
      if (!this.pressed) return {ok: false, data: 'not active'}

      this.distance = this.positionY - this.currentY
      this.virtual.transformY =
        this.snapShotHeight - this.distance! * this.multiplier || 0
      _holo[this.id!].setState = {..._transformY(this.virtual)}

      requestAnimationFrame(this._dragScrollVertical.bind(this))
    },

    /**
     * Register event/mouse position when touch/drag ends
     */
    _touchEnd(e: MouseEvent | TouchEvent): void | {ok: boolean; data: string} {
      if (!this.pressed) return {ok: false, data: 'not active'}

      const touchEndTimeStamp = performance.now()
      e.preventDefault()
      this.pressed = 0 // Reset after drag event ended
      const timeElapsed = touchEndTimeStamp - this.TouchStartTimeStamp!
      const speed = _swipe(this.distance!, timeElapsed)

      if (speed > 1.2) {
        cyre.call('nxtSlide' + this.id, this.virtual)
      } else if (speed < -1.2) {
        cyre.call('prvSlide' + this.id, this.virtual)
      } else if (_isClicked(timeElapsed)) {
        this.focus(e)
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

  return touch
}

// Create a singleton touch handler instance
const Touch = createTouchHandler()
export default Touch

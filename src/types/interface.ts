/** @format */

//src/types/interface.ts

export interface HoloVirtual {
  id: string
  carousel: {
    width?: number
    height?: number
  }
  container: {
    width?: number
    height?: number
  }
  io: HoloIOOptions
  title: string | null
  description: string | null
  duration: number
  transitionTiming: string
  transformX: number
  transformY: number
  transformZ: number
  numberOfSlots: number
  endOfSlide: number
  endOfSlidePosition?: number
  item: {
    max: number
    width?: number
    height?: number
    min?: number
  }
  noOfChildren?: number
  startNumber?: number
}

export interface HoloShadow {
  carousel: HTMLElement
  container: HTMLElement
}

export interface HoloIOOptions {
  id: string
  enabled: number
  wheel: number
  controller: number
  drag: number
  swipe: number
  snap: number
  focus: number
  animate: number
  animateDirection: number
  duration: number
  loop: number
  orientation: number
  active: boolean
  onClick: boolean
  onDoubleClick: boolean
}

export interface HoloInstance {
  virtual: HoloVirtual
  shadow: HoloShadow
  getVirtual: HoloVirtual
  getShadow: HoloShadow
  getState: {
    virtual: HoloVirtual
    shadow: HoloShadow
  }
  getDimensions: {
    car: {
      w: number
      h: number
    }
    con: {
      w: number
      h: number
      x: number
      y: number
      z: number
    }
  }
  setState: HoloVirtual
  setDimension: HoloVirtual
  updateStyle: number
}

export interface HoloTouchClass {
  positionX: number
  positionY: number
  pressed: number
  virtual: HoloVirtual
  multiplier: number
  touch: {
    start: string
    move: string
    end: string
    enter: string
  }
  targetHoloComponent: HTMLElement | number
  TouchStartTimeStamp?: number
  id?: string
  currentX: number
  currentY: number
  snapShotWidth: number
  snapShotHeight: number
  distance?: number
  _touchStart: (e: MouseEvent | TouchEvent, id: string) => void
  _dragScrollHorizontal: (e: MouseEvent | TouchEvent) => void | {ok: boolean; data: string}
  _dragScrollVertical: (e: MouseEvent | TouchEvent) => void | {ok: boolean; data: string}
  _touchEnd: (e: MouseEvent | TouchEvent) => void | {ok: boolean; data: string}
  focus: (e: MouseEvent | TouchEvent) => boolean | void
}

export interface HoloDimensions {
  width: number
  height: number
}

export type HoloDatabase = Record<string, HoloInstance>

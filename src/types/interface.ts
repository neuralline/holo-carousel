//src/types/interface.ts

// Core carousel state interfaces
export interface VirtualDomState {
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
  endOfSlidePosition: number
  noOfChildren?: number
  startNumber?: number
  item: {
    width?: number
    height?: number
    min?: number
    max?: number
  }
}

export interface DomState {
  carousel: HTMLElement
  container: HTMLElement
  width?: number
  height?: number
  transformX?: number
  transformY?: number
  transformZ?: number
}

export interface TouchState {
  pressed: boolean
  positionX: number
  positionY: number
  currentX: number
  currentY: number
  id?: string
  multiplier: number
  virtual?: VirtualDomState
  snapShotWidth?: number
  snapShotHeight?: number
  distance?: number
  TouchStartTimeStamp?: number
  targetHoloComponent?: HTMLElement | null
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

export interface CarouselInstance {
  id: string
  virtualDom: VirtualDomState
  Dom: DomState
  touchState: TouchState
  updateStyle: boolean
}

export interface HoloState {
  instances: Record<string, CarouselInstance>
}

export interface CyreEvent {
  id: string
  payload?: any
}

export interface TouchEvents {
  start: string
  move: string
  end: string
  enter: string
}

export interface StyleOptions {
  transitionDuration: string
  transitionTimingFunction: string
}

export interface SlidePosition {
  x?: number
  y?: number
}

export interface DimensionResult {
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

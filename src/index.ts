// src/index.ts

import Holo, {useHolo, HOLO_VERSION} from './app'
import Accordion from './accordion'

export default Holo
export {Holo, useHolo, Accordion, HOLO_VERSION}
export type {CarouselHandle, HoloHandle, UseHoloOptions, HoloInitOptions} from './app'
export type {
  HoloOptions,
  HoloEffect,
  HoloRender,
  HoloChange,
  CyreNode
} from './types/interface'
export type {LinkMode} from './components/holo-features'

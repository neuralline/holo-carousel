// src/lite.ts

/*
    Neural Line
    Reactive carousel - lite entry
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

// Everything except the stage effects (coverflow, album, shuffle, flip,
// cube, zoom, cover, reveal, wipe, iris, kenburns): slide, center, fade
// and ring are built in. Add effects from 'holo-carousel/effects' with
// registerEffect(coverflow, ...).

import Holo, {useHolo, HOLO_VERSION} from './app'
import Accordion from './accordion'

export default Holo
export {Holo, useHolo, Accordion, HOLO_VERSION}
export {tune} from './components/holo-tune'
export type {GestureTuning} from './components/holo-tune'
export type {CarouselHandle, HoloHandle, UseHoloOptions, HoloInitOptions} from './app'
export type {
  HoloOptions,
  HoloEffect,
  HoloEffectDefinition,
  StageStyle,
  StageContext,
  HoloRender,
  HoloChange,
  CyreNode
} from './types/interface'
export type {LinkMode} from './components/holo-features'
export type {TabsOptions, StepperOptions} from './components/holo-presets'
export type {StateHandle, ListOptions, InputOptions} from './components/holo-bind'
export type {RouterOptions} from './components/holo-router'

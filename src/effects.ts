// src/effects.ts

/*
    Neural Line
    Reactive carousel - effects
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import {holoStore} from './core/state'
import {HoloEffectDefinition} from './types/interface'
import {
  albumStyle,
  coverStyle,
  coverflowStyle,
  cubeStyle,
  flipStyle,
  irisStyle,
  kenburnsStyle,
  revealStyle,
  shuffleStyle,
  wipeStyle,
  zoomStyle
} from './components/orientation-handler'

/*
  The stage effects, one export each, so an app ships only the ones it
  uses. The core knows slide, center, fade and ring; these are added with
  registerEffect:

    import {useHolo} from 'holo-carousel/lite'
    import {registerEffect, coverflow, flip} from 'holo-carousel/effects'
    registerEffect(coverflow, flip)

  The full build ('holo-carousel', and the script-tag bundle) registers
  all of them. An effect is a plain object - write your own the same way.
*/

export const coverflow: HoloEffectDefinition = {
  name: 'coverflow',
  style: (d, _index, context) => coverflowStyle(d, context),
  perspective: 1200,
  margin: 12
}

export const album: HoloEffectDefinition = {
  name: 'album',
  style: (d, index, context) => albumStyle(d, index, context),
  margin: 28
}

export const shuffle: HoloEffectDefinition = {
  name: 'shuffle',
  // the deck wraps its own way: the plain distance, not the shortest
  style: (_d, _index, context, raw) => shuffleStyle(raw, context),
  perspective: 1600,
  margin: 28,
  wraps: true
}

export const flip: HoloEffectDefinition = {
  name: 'flip',
  style: (d, _index, context) => flipStyle(d, context),
  perspective: 1000,
  backface: true
}

export const cube: HoloEffectDefinition = {
  name: 'cube',
  style: (d, _index, context) => cubeStyle(d, context),
  perspective: 1000,
  backface: true
}

export const zoom: HoloEffectDefinition = {
  name: 'zoom',
  style: d => zoomStyle(d)
}

export const cover: HoloEffectDefinition = {
  name: 'cover',
  style: (d, _index, context) => coverStyle(d, context)
}

export const reveal: HoloEffectDefinition = {
  name: 'reveal',
  style: (d, _index, context) => revealStyle(d, context)
}

export const wipe: HoloEffectDefinition = {
  name: 'wipe',
  style: (d, _index, context) => wipeStyle(d, context)
}

export const iris: HoloEffectDefinition = {
  name: 'iris',
  style: d => irisStyle(d)
}

export const kenburns: HoloEffectDefinition = {
  name: 'kenburns',
  style: d => kenburnsStyle(d)
}

/** every stage effect */
export const allEffects: HoloEffectDefinition[] = [
  coverflow,
  album,
  shuffle,
  flip,
  cube,
  zoom,
  cover,
  reveal,
  wipe,
  iris,
  kenburns
]

/** make effects available to every carousel by name */
export const registerEffect = (...effects: HoloEffectDefinition[]): void => {
  for (const effect of effects) holoStore.registerEffect(effect)
}

/** register every stage effect (what the full build does) */
export const registerAllEffects = (): void => registerEffect(...allEffects)

// src/index.ts

// The full build: the lite core plus every stage effect.

import Holo from './lite'
import {registerAllEffects} from './effects'

registerAllEffects()

export default Holo
export * from './lite'
export {
  registerEffect,
  registerAllEffects,
  allEffects,
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
} from './effects'

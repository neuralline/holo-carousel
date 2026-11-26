// src/components/holo-tune.ts

/*
    Neural Line
    Reactive carousel - gesture tuning
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

// The public face of the gesture numbers: tune({deceleration: 0.002}).
// The values live in the store (holoStore.gesture()), one set for the
// page, read on every gesture - so a change applies to the next swipe of
// every carousel. Debounce / throttle timings (refreshDebounce,
// wheelThrottle) are read when a carousel is created: tune those first.

import {log} from 'cyre'
import {holoStore} from '../core/state'
import {Gesture} from '../config/holo-config'

type CamelTail<S extends string> = S extends `${infer H}_${infer T}`
  ? `${Capitalize<Lowercase<H>>}${CamelTail<T>}`
  : Capitalize<Lowercase<S>>
type Camel<S extends string> = S extends `${infer H}_${infer T}` ? `${Lowercase<H>}${CamelTail<T>}` : Lowercase<S>

/** every gesture number by its camelCase name: wheelFling, deceleration, ... */
export type GestureTuning = {[K in keyof Gesture as Camel<K & string>]: number}

/** wheelFling -> WHEEL_FLING (WHEEL_FLING stays). Pure. */
export const gestureKey = (name: string): string =>
  /[a-z]/.test(name) ? name.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase() : name

/** WHEEL_FLING -> wheelFling. Pure. */
export const tuningKey = (key: string): string =>
  key.toLowerCase().replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())

/** the store's values by their public names. Pure. */
export const tuningOf = (gesture: Gesture): GestureTuning =>
  Object.fromEntries(Object.entries(gesture).map(([key, value]) => [tuningKey(key), value])) as GestureTuning

/**
 * Change gesture numbers for the whole page and get them all back.
 * tune() reads them; tune('reset') puts the defaults back. Unknown names
 * and values that are not finite numbers ≥ 0 are skipped with a warning.
 */
/**
 * Shorthand on create / options(): `flick` (px/ms at the strip),
 * `glide` (max items per fling), `brake` (deceleration px/ms²). Merged
 * with `gesture: { ... }`.
 */
export const gestureTuningFrom = (options: {
  gesture?: Partial<GestureTuning>
  flick?: number
  glide?: number
  brake?: number
}): Partial<GestureTuning> | undefined => {
  const tuning: Partial<GestureTuning> = options.gesture ? {...options.gesture} : {}
  if (options.flick !== undefined) tuning.flick = options.flick
  if (options.glide !== undefined) tuning.maxGlide = options.glide
  if (options.brake !== undefined) tuning.deceleration = options.brake
  return Object.keys(tuning).length ? tuning : undefined
}

/** merge new tuning into a carousel's stored gesture overrides */
export const applyGestureOptions = (
  current: Partial<Gesture> | undefined,
  options: {gesture?: Partial<GestureTuning>; flick?: number; glide?: number; brake?: number}
): Partial<Gesture> | undefined => {
  const patch = gestureTuningFrom(options)
  if (
    !patch &&
    options.gesture === undefined &&
    options.flick === undefined &&
    options.glide === undefined &&
    options.brake === undefined
  ) {
    return current
  }
  const merged = {...current, ...(patch ? gestureOverrides(patch) : {})}
  return Object.keys(merged).length ? merged : {}
}

export const gestureOverrides = (values: Partial<GestureTuning>): Partial<Gesture> => {
  const current = holoStore.gesture() as Record<string, number>
  const accepted: Partial<Gesture> = {}
  for (const [name, value] of Object.entries(values)) {
    const key = gestureKey(name)
    if (!(key in current)) {
      log.warn(`@HOLO tune: no gesture setting called "${name}"`)
      continue
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      log.warn(`@HOLO tune: ${name} needs a number ≥ 0, got ${String(value)}`)
      continue
    }
    accepted[key as keyof Gesture] = value
  }
  return accepted
}

export const tune = (values?: Partial<GestureTuning> | 'reset'): GestureTuning => {
  if (values === 'reset') return tuningOf(holoStore.resetGesture())
  if (!values) return tuningOf(holoStore.gesture())
  const current = holoStore.gesture() as Record<string, number>
  const accepted: Record<string, number> = {}
  for (const [name, value] of Object.entries(values)) {
    const key = gestureKey(name)
    if (!(key in current)) {
      log.warn(`@HOLO tune: no gesture setting called "${name}"`)
      continue
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      log.warn(`@HOLO tune: ${name} needs a number ≥ 0, got ${String(value)}`)
      continue
    }
    accepted[key] = value
  }
  return tuningOf(holoStore.tune(accepted as Partial<Gesture>))
}

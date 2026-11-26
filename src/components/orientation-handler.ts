//src/components/orientation-handler.ts

import {StageContext, StageStyle, VirtualDomState} from '../types/interface'
import {holoStore} from '../core/state'

export type {StageContext, StageStyle}
import {_snap, rubberBand, wrapIndex} from './holo-essentials'

/*
  Where things go, for each effect and orientation. Pure functions of
  the track (the carousel's position in items, fractional while dragged);
  holo-render.ts applies them to the DOM.
*/

/** item size along the carousel's axis */
export const axisSize = (virtualDom: VirtualDomState): number =>
  (virtualDom.io.orientation ? virtualDom.item.height : virtualDom.item.width) || 0

/** centre offset: how far the first item sits from the start of the viewport */
export const centreOffset = (virtualDom: VirtualDomState): number =>
  virtualDom.io.effect === 'center'
    ? Math.max(0, (virtualDom.viewport - axisSize(virtualDom)) / 2)
    : 0

// --- mixed-size items ----------------------------------------------

/** where each item starts (and, last, where the strip ends) */
export const offsetsOf = (sizes: number[]): number[] => {
  const offsets = [0]
  for (const size of sizes) offsets.push(offsets[offsets.length - 1] + size)
  return offsets
}

/**
 * px from the strip's start for a (fractional) track; past the ends by the
 * edge items' size. `wrap`: the strip repeats every offsets[n] px (an
 * infinite loop of mixed sizes), so track n + i is item i again.
 */
export const offsetAt = (offsets: number[], track: number, wrap = false): number => {
  const n = offsets.length - 1
  if (n <= 0) return 0
  if (wrap) {
    const turns = Math.floor(track / n)
    return turns * offsets[n] + offsetAt(offsets, track - turns * n)
  }
  if (track <= 0) return track * (offsets[1] - offsets[0])
  if (track >= n) return offsets[n] + (track - n) * (offsets[n] - offsets[n - 1])
  const i = Math.floor(track)
  return offsets[i] + (track - i) * (offsets[i + 1] - offsets[i])
}

/** the (fractional) track at px from the strip's start (`wrap`: see offsetAt) */
export const trackAt = (offsets: number[], px: number, wrap = false): number => {
  const n = offsets.length - 1
  if (n <= 0) return 0
  if (wrap && offsets[n] > 0) {
    const turns = Math.floor(px / offsets[n])
    return turns * n + trackAt(offsets, px - turns * offsets[n])
  }
  if (px <= 0) return px / (offsets[1] - offsets[0] || 1)
  if (px >= offsets[n]) return n + (px - offsets[n]) / (offsets[n] - offsets[n - 1] || 1)
  let low = 0
  let high = n - 1
  while (low < high) {
    const mid = (low + high + 1) >> 1
    if (offsets[mid] <= px) low = mid
    else high = mid - 1
  }
  return low + (px - offsets[low]) / (offsets[low + 1] - offsets[low] || 1)
}

/** a track moved by px (a drag, a trackpad delta), for either kind of item size */
export const trackMovedBy = (virtualDom: VirtualDomState, track: number, px: number): number =>
  virtualDom.offsets
    ? trackAt(virtualDom.offsets, offsetAt(virtualDom.offsets, track, virtualDom.wrap) + px, virtualDom.wrap)
    : track + px / (axisSize(virtualDom) || 1)

/**
 * The strip's offset (px) for a track. A strip that does not wrap stops
 * at its ends - with resistance while dragged (`stretch`).
 */
export const stripPosition = (
  virtualDom: VirtualDomState,
  track: number,
  stretch = false,
  free = false
): number => {
  const size = axisSize(virtualDom)
  const offset = centreOffset(virtualDom)
  const raw = offset - (virtualDom.offsets ? offsetAt(virtualDom.offsets, track, virtualDom.wrap) : track * size)
  // free: an elastic settle at an end draws its own overshoot, unclamped
  if (virtualDom.wrap || free) return raw
  const span = virtualDom.viewport || size * Math.max(1, virtualDom.numberOfSlots)
  if (virtualDom.io.effect === 'center') {
    const end = offset - virtualDom.maxIndex * size
    return stretch
      ? offset + rubberBand(raw - offset, end - offset, undefined, span)
      : Math.min(offset, Math.max(raw, end))
  }
  const end = virtualDom.endOfSlidePosition
  return stretch ? rubberBand(raw, end, undefined, span) : Math.min(0, Math.max(raw, end)) || 0
}

/**
 * The track a strip is seen at: past an end a dragged strip is drawn
 * rubber-banded (shorter than its track), and a settle starts from what
 * is seen, so letting go never jumps. Inside the ends it is the track.
 */
export const seenTrack = (virtualDom: VirtualDomState, track: number): number => {
  if (virtualDom.wrap || (track >= 0 && track <= virtualDom.maxIndex)) return track
  const px = centreOffset(virtualDom) - stripPosition(virtualDom, track, true)
  return virtualDom.offsets ? trackAt(virtualDom.offsets, px) : px / (axisSize(virtualDom) || 1)
}

/** seenTrack backwards: the (rubber-banded) track that is seen at `seen` */
export const trackSeenAt = (virtualDom: VirtualDomState, seen: number): number => {
  const max = virtualDom.maxIndex
  if (virtualDom.wrap || (seen >= 0 && seen <= max)) return seen
  const out = seen > max ? 1 : -1
  const edge = out > 0 ? max : 0
  let low = 0
  let high = 50
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2
    if (out * (seenTrack(virtualDom, edge + out * mid) - edge) < out * (seen - edge)) low = mid
    else high = mid
  }
  return edge + out * low
}

/**
 * Where a settle at an end is at `t` ms: a critically damped spring from
 * `x0` (items from the end) leaving at `v0` (items/ms). It carries the
 * release speed on - out a little past the end if it was still heading
 * out - and comes to rest without a bounce or a jolt. Pure.
 */
export const springAt = (t: number, x0: number, v0: number, omega: number): number =>
  (x0 + (v0 + omega * x0) * t) * Math.exp(-omega * t)

/**
 * The release speed a settle may keep so it overshoots the end by at most
 * `room` items (beyond where it already is). Pure.
 */
export const springLaunch = (x0: number, v0: number, omega: number, out: number, room: number): number => {
  const allowed = Math.max(room, out * x0)
  const peak = (v: number): number => {
    let most = -Infinity
    for (let i = 0; i <= 80; i++) most = Math.max(most, out * springAt((i / 80) * (8 / omega), x0, v, omega))
    return most
  }
  if (peak(v0) <= allowed) return v0
  let low = 0
  let high = 1
  for (let i = 0; i < 14; i++) {
    const mid = (low + high) / 2
    if (peak(v0 * mid) <= allowed) low = mid
    else high = mid
  }
  return v0 * low
}

/**
 * On a wrapping strip each item sits at the copy of its index nearest
 * the view, so the strip never runs out: item i goes to i + k·count with
 * k picked to keep it within half a ring of the visible items.
 */
export const wrappedSlot = (
  index: number,
  track: number,
  count: number,
  slots: number
): number => {
  const low = Math.floor(track) - Math.floor((count - slots) / 2)
  const k = Math.ceil((low - index) / count)
  return index + k * count
}

/**
 * wrappedSlot for mixed sizes: the px item `index` sits at - the copy
 * (offsets[index] + k·length) nearest the view at `track`.
 */
export const wrappedOffset = (
  offsets: number[],
  index: number,
  track: number,
  viewport: number
): number => {
  const length = offsets[offsets.length - 1] || 1
  // the copy whose middle is within half a strip of the view's middle
  const low = offsetAt(offsets, track, true) + viewport / 2 - length / 2
  const middle = (offsets[index] + offsets[index + 1]) / 2
  return offsets[index] + Math.ceil((low - middle) / length) * length
}

/** track positions a virtual window covers (each maps to an item) */
export const virtualWindow = (
  track: number,
  slots: number,
  buffer: number,
  count: number,
  wrap: boolean
): number[] => {
  const first = Math.floor(track) - buffer
  const last = Math.ceil(track) + slots - 1 + buffer
  const positions: number[] = []
  for (let t = first; t <= last; t++) {
    if (wrap || (t >= 0 && t < count)) positions.push(t)
  }
  return positions
}

/** which item a track position shows */
export const itemAt = (position: number, count: number, wrap: boolean): number =>
  wrap ? wrapIndex(position, count) : position

/** ring: angle between items and the radius that fits them edge to edge */
export const ringGeometry = (
  count: number,
  size: number
): {angle: number; radius: number} => {
  const angle = 360 / Math.max(1, count)
  const radius = count > 2 ? Math.round(size / 2 / Math.tan(Math.PI / count)) : size
  return {angle, radius}
}

/** fade: how visible item i is at a track (crossfades while dragged) */
export const fadeOpacity = (
  index: number,
  track: number,
  count: number,
  wrap: boolean
): number => {
  const distance = wrap
    ? Math.abs(((((index - track) % count) + count + count / 2) % count) - count / 2)
    : Math.abs(index - track)
  return Math.max(0, 1 - distance)
}

// --- stage effects ---------------------------------------------------

/** a stable 0..1 number per item (scatter angles that don't change) */
export const seeded = (n: number): number => {
  const x = Math.sin((n + 1) * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** how far item i is from the track: shortest way round when it wraps */
export const signedDistance = (
  index: number,
  track: number,
  count: number,
  wrap: boolean
): number => {
  if (!wrap || count <= 0) return index - track
  const d = (((index - track) % count) + count) % count
  return d > count / 2 ? d - count : d
}

const along = (vertical: boolean, px: number): string =>
  vertical ? `translateY(${px}px)` : `translateX(${px}px)`
const across = (vertical: boolean, px: number): string =>
  vertical ? `translateX(${px}px)` : `translateY(${px}px)`
const turn = (vertical: boolean, deg: number): string =>
  vertical ? `rotateX(${-deg}deg)` : `rotateY(${deg}deg)`

const hidden: StageStyle = {transform: 'scale(0.9)', opacity: 0, zIndex: 0}

/**
 * coverflow: the current item flat in front, the rest turned away
 * either side and packed behind it.
 */
export const coverflowStyle = (d: number, {size, vertical}: StageContext): StageStyle => {
  const distance = Math.abs(d)
  if (distance > 4.5) return hidden
  const near = Math.sign(d) * Math.min(1, distance)
  const offset = near * size * 0.55 + (d - near) * size * 0.3
  const depth = -Math.min(1, distance) * size * 0.5 - Math.max(0, distance - 1) * 30
  return {
    transform: `${along(vertical, offset)} translateZ(${depth}px) ${turn(vertical, -near * 55)}`,
    opacity: distance > 3.5 ? 4.5 - distance : 1,
    zIndex: Math.round(1000 - distance * 10)
  }
}

/**
 * album: a pile of photos, each at its own slight angle; the top one is
 * straight. Going forward the top photo slides off to the side.
 */
export const albumStyle = (d: number, index: number, {size, vertical}: StageContext): StageStyle => {
  const angle = (seeded(index) - 0.5) * 16
  const dx = (seeded(index + 7) - 0.5) * 28
  const dy = (seeded(index + 3) - 0.5) * 18
  if (d >= 0) {
    if (d > 6) return hidden
    const settle = Math.min(1, d) // the top photo straightens
    return {
      transform: `${along(vertical, dx * settle)} ${across(vertical, dy * settle)} rotate(${angle * settle}deg) scale(${1 - Math.min(d, 6) * 0.012})`,
      opacity: d > 5 ? 6 - d : 1,
      zIndex: Math.round(1000 - d * 10)
    }
  }
  const away = -d
  if (away >= 1) return hidden // gone once the move is over
  return {
    transform: `${along(vertical, -away * size * 1.15)} ${across(vertical, -away * 24)} rotate(${angle - away * 22}deg)`,
    opacity: away < 0.5 ? 1 : Math.max(0, 1 - (away - 0.5) * 2),
    zIndex: 1010
  }
}

/**
 * shuffle: a deck. Going forward the top card swings out to the side and
 * back in underneath; the rest move up one place.
 */
export const shuffleStyle = (d: number, {size, count, vertical}: StageContext): StageStyle => {
  const place = ((d % count) + count) % count // 0 = top ... count-1 = bottom
  const deck = (k: number) => {
    const depth = Math.min(k, 5)
    return {
      transform: `${across(vertical, -depth * 9)} scale(${1 - depth * 0.04})`,
      depthOpacity: k >= 5 ? Math.max(0, 6 - k) : 1
    }
  }
  if (place > count - 1) {
    // between the top (place → count) and the bottom (count - 1)
    const out = count - place // 0 at the top, 1 at the bottom
    const swing = Math.sin(Math.PI * out)
    const bottom = Math.min(count - 1, 5)
    return {
      transform: `${along(vertical, swing * size * 1.05)} ${across(vertical, -bottom * 9 * out)} rotate(${swing * 9}deg) scale(${1 - bottom * 0.04 * out})`,
      opacity: 1,
      zIndex: out < 0.5 ? 2000 : 0
    }
  }
  const {transform, depthOpacity} = deck(place)
  return {transform, opacity: depthOpacity, zIndex: Math.round(1000 - place * 10)}
}

/** flip: the card turns over to show the next one */
export const flipStyle = (d: number, {vertical}: StageContext): StageStyle =>
  Math.abs(d) >= 1
    ? hidden
    : {transform: turn(vertical, -d * 180), opacity: 1, zIndex: Math.round(1000 - Math.abs(d) * 10)}

/** cube: items on the faces of a turning cube */
export const cubeStyle = (d: number, {size, vertical}: StageContext): StageStyle =>
  Math.abs(d) >= 1
    ? hidden
    : {
        transform: `translateZ(${-size / 2}px) ${turn(vertical, d * 90)} translateZ(${size / 2}px)`,
        opacity: 1,
        zIndex: Math.round(1000 - Math.abs(d) * 10)
      }

/** zoom: the current item grows and fades out as the next one comes up */
export const zoomStyle = (d: number): StageStyle => {
  const distance = Math.abs(d)
  if (distance >= 1) return hidden
  return d < 0
    ? {transform: `scale(${1 + distance * 0.35})`, opacity: 1 - distance, zIndex: 1010}
    : {transform: `scale(${1 - distance * 0.2})`, opacity: 1 - distance * 0.6, zIndex: 1000}
}

// --- presentation transitions ---------------------------------------

/** cover: the next slide slides in over the current one, which dims back */
export const coverStyle = (d: number, {size, vertical}: StageContext): StageStyle => {
  if (d <= -1 || d >= 1) return hidden
  if (d > 0) return {transform: along(vertical, d * size), opacity: 1, zIndex: 1010}
  const under = -d
  return {transform: `scale(${1 - under * 0.06})`, opacity: 1 - under * 0.45, zIndex: 1000}
}

/** reveal: the current slide slides away, uncovering the next one */
export const revealStyle = (d: number, {size, vertical}: StageContext): StageStyle => {
  if (d <= -1 || d >= 1) return hidden
  if (d < 0) return {transform: along(vertical, d * size), opacity: 1, zIndex: 1010}
  return {transform: `scale(${0.94 + 0.06 * (1 - d)})`, opacity: 0.55 + 0.45 * (1 - d), zIndex: 1000}
}

/** wipe: the next slide is uncovered by an edge sweeping across */
export const wipeStyle = (d: number, {vertical}: StageContext): StageStyle => {
  if (d <= -1 || d >= 1) return hidden
  if (d > 0) {
    const cut = `${(d * 100).toFixed(3)}%`
    return {
      transform: '',
      opacity: 1,
      zIndex: 1010,
      clipPath: vertical ? `inset(${cut} 0 0 0)` : `inset(0 0 0 ${cut})`
    }
  }
  return {transform: '', opacity: 1, zIndex: 1000}
}

/** iris: the next slide opens from a circle in the middle */
export const irisStyle = (d: number): StageStyle => {
  if (d <= -1 || d >= 1) return hidden
  if (d > 0) {
    return {transform: '', opacity: 1, zIndex: 1010, clipPath: `circle(${((1 - d) * 75).toFixed(3)}% at 50% 50%)`}
  }
  return {transform: '', opacity: 1, zIndex: 1000}
}

/** ken burns: slides crossfade; the current one drifts and zooms slowly (CSS) */
export const kenburnsStyle = (d: number): StageStyle => {
  const distance = Math.abs(d)
  if (distance >= 1) return hidden
  return {transform: '', opacity: 1 - distance, zIndex: Math.round(1000 - distance * 10)}
}

/** the style of item `index` for a stage effect at a (fractional) track */
export const stageStyle = (
  effect: string,
  index: number,
  track: number,
  wrap: boolean,
  context: StageContext
): StageStyle => {
  const d = signedDistance(index, track, context.count, wrap)
  const definition = holoStore.getEffect(effect)
  if (definition) return definition.style(d, index, context, index - track)
  return {transform: '', opacity: d === 0 ? 1 : 0, zIndex: 0}
}

/**
 * Transform carousel horizontally with boundary checks (v2 helper)
 */
export const _transformX = (virtualDom: VirtualDomState): VirtualDomState => {
  const updated = {...virtualDom}
  updated.transformX = updated.io.snap
    ? _snap(updated.transformX, updated.item.width || 0)
    : updated.transformX
  updated.transformY = 0
  updated.transformX = Math.min(0, Math.max(updated.transformX, updated.endOfSlidePosition))
  updated.endOfSlide =
    updated.transformX >= 0 ? 1 : updated.transformX <= updated.endOfSlidePosition ? -1 : 0
  return updated
}

/**
 * Transform carousel horizontally without snap (v2 helper)
 */
export const _transformXLite = (virtualDom: VirtualDomState): VirtualDomState => {
  const updated = {...virtualDom}
  updated.transformY = 0
  updated.transformX = Math.min(0, Math.max(updated.transformX, updated.endOfSlidePosition))
  return updated
}

/**
 * Transform carousel vertically with boundary checks (v2 helper)
 */
export const _transformY = (virtualDom: VirtualDomState): VirtualDomState => {
  const updated = {...virtualDom}
  updated.transformY = updated.io.snap
    ? _snap(updated.transformY, updated.item.height || 0)
    : updated.transformY
  updated.transformX = 0
  updated.transformY = Math.min(0, Math.max(updated.transformY, updated.endOfSlidePosition))
  updated.endOfSlide =
    updated.transformY >= 0 ? 1 : updated.transformY <= updated.endOfSlidePosition ? -1 : 0
  return updated
}

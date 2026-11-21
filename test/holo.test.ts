// test/holo.test.ts

/* 
    Neural Line
    Reactive carousel
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

// The carousel's maths are pure functions; these run under vitest (and
// bun test) without a DOM layout.
import {
  clampIndex,
  pagesOf,
  pageOf,
  pageTarget,
  nearestIndex,
  rubberBand,
  releaseVelocity,
  releaseIndex,
  stepIndex,
  _numberOfSlots,
  _snap
} from '../src/components/holo-essentials'
import {_place} from '../src/components/orientation-handler'
import {createDefaultVirtualDom} from '../src/core/state'

describe('index maths', () => {
  it('clamps to 0..max', () => {
    expect(clampIndex(-3, 10)).toBe(0)
    expect(clampIndex(4.4, 10)).toBe(4)
    expect(clampIndex(12, 10)).toBe(10)
    expect(clampIndex(5, -1)).toBe(0)
  })

  it('counts pages with the end as its own stop', () => {
    expect(pagesOf(0, 3)).toBe(1)
    expect(pagesOf(10, 3)).toBe(5) // 0 3 6 9 10
    expect(pagesOf(9, 3)).toBe(4) // 0 3 6 9
    expect(pageOf(9, 10, 3)).toBe(3)
    expect(pageOf(10, 10, 3)).toBe(4)
    expect(pageTarget(4, 10, 3)).toBe(10)
    expect(pageTarget(2, 10, 3)).toBe(6)
  })

  it('steps, stops or wraps at the ends', () => {
    expect(stepIndex(0, 1, 5, 13, false)).toBe(5)
    expect(stepIndex(10, 1, 5, 13, false)).toBe(13)
    expect(stepIndex(13, 1, 5, 13, false)).toBe(-1)
    expect(stepIndex(13, 1, 5, 13, true)).toBe(0)
    expect(stepIndex(0, -1, 5, 13, true)).toBe(13)
    expect(stepIndex(3, -1, 5, 13, false)).toBe(0)
    expect(stepIndex(0, 1, 5, 0, true)).toBe(-1) // nothing to scroll
  })

  it('fits slots and snaps', () => {
    expect(_numberOfSlots(1280, 255, 8)).toBe(5)
    expect(_numberOfSlots(1280, 100, 8)).toBe(8)
    expect(_numberOfSlots(100, 255, 8)).toBe(1)
    expect(_snap(-380, 255)).toBe(-255)
    expect(nearestIndex(-380, 255)).toBe(1)
    expect(nearestIndex(-400, 255)).toBe(2)
  })
})

describe('gestures', () => {
  it('resists past either end', () => {
    expect(rubberBand(-100, -1000)).toBe(-100)
    expect(rubberBand(100, -1000, 0.3)).toBeCloseTo(30)
    expect(rubberBand(-1100, -1000, 0.3)).toBeCloseTo(-1030)
  })

  it('reads release speed from recent samples only', () => {
    const samples: Array<[number, number]> = [
      [0, 0],
      [900, 0],
      [950, -50],
      [1000, -100]
    ]
    expect(releaseVelocity(samples, 1000)).toBeCloseTo(-1)
    expect(releaseVelocity([[0, 0]], 10)).toBe(0)
  })

  it('snaps a slow release, carries a flick', () => {
    // slow, under half an item: back to where it started
    expect(releaseIndex(2, -2 * 255 - 100, 0, 255, 13)).toBe(2)
    // slow, past half: the next item
    expect(releaseIndex(2, -2 * 255 - 140, 0, 255, 13)).toBe(3)
    // a short flick still moves one item
    expect(releaseIndex(2, -2 * 255 - 20, -0.5, 255, 13)).toBe(3)
    // a fast flick moves several, never past the end
    expect(releaseIndex(2, -600, -3, 255, 13)).toBe(5)
    expect(releaseIndex(12, -3200, -6, 255, 13)).toBe(13)
  })
})

describe('placing', () => {
  const virtualDom = () => ({
    ...createDefaultVirtualDom('t'),
    item: {width: 255, height: 360},
    numberOfSlots: 5,
    maxIndex: 13,
    step: 5,
    endOfSlidePosition: -13 * 255
  })

  it('places by index and reports the end', () => {
    expect(_place(virtualDom(), 0)).toMatchObject({index: 0, transformX: 0, endOfSlide: 1, page: 0})
    expect(_place(virtualDom(), 5)).toMatchObject({index: 5, transformX: -1275, endOfSlide: 0, page: 1})
    expect(_place(virtualDom(), 40)).toMatchObject({index: 13, transformX: -3315, endOfSlide: -1, page: 3})
  })

  it('moves on y when vertical', () => {
    const vd = virtualDom()
    vd.io = {...vd.io, orientation: 1}
    vd.endOfSlidePosition = -13 * 360
    expect(_place(vd, 2)).toMatchObject({transformX: 0, transformY: -720})
  })
})

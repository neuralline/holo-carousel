// test/holo.test.ts

/*
    Neural Line
    Reactive carousel
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

// The model is pure functions plus channels, so carousels run headless
// here (no element, no layout) under vitest or bun test.
import {Cyre, cyre} from 'cyre'
import {
  clampIndex,
  wrapIndex,
  pagesOf,
  pageOf,
  pageTarget,
  nearestIndex,
  rubberBand,
  rubberTrack,
  rubberOverscroll,
  carrySpeed,
  releaseVelocity,
  smoothVelocity,
  releaseIndex,
  releaseTrack,
  stepIndex,
  shortestDelta,
  glideDistance,
  glideDuration,
  normalizeOptions,
  normalizeBreakpoints,
  breakpointFor,
  _numberOfSlots,
  _snap
} from '../src/components/holo-essentials'
import {
  wrappedSlot,
  virtualWindow,
  itemAt,
  ringGeometry,
  fadeOpacity
} from '../src/components/orientation-handler'
import {
  seeded,
  signedDistance,
  stageStyle,
  albumStyle,
  shuffleStyle,
  flipStyle
} from '../src/components/orientation-handler'
import {
  wheelTrend,
  classifyMove,
  landing,
  wheelLanding,
  swipeDirection,
  isNotchedWheel,
  moveAngle,
  releaseGesture
} from '../src/components/holo-touch'
import {moveAt} from '../src/components/holo-render'
import {wipeStyle, irisStyle, coverStyle, revealStyle} from '../src/components/orientation-handler'
import {SKELETON, dataList} from '../src/components/holo-essentials'
import {useHolo} from '../src/app'
import {registerAllEffects} from '../src/effects'
import {offsetsOf, offsetAt, trackAt, wrappedOffset, springAt, springLaunch} from '../src/components/orientation-handler'
import {glideAt} from '../src/components/holo-render'
import {createState} from '../src/components/holo-bind'
import {tune, gestureKey, tuningKey, gestureOverrides, gestureTuningFrom, applyGestureOptions} from '../src/components/holo-tune'
import {GESTURE} from '../src/config/holo-config'
import {segmentOf, applyRoute} from '../src/components/holo-router'
import {holoStore} from '../src/core/state'

// stage effects are separate imports since 3.4 - the full build registers them
registerAllEffects()

const items = (n: number) => Array.from({length: n}, (_, i) => ({id: `i${i}`, n: i}))

const tick = () => new Promise(resolve => setTimeout(resolve, 5))

describe('index maths', () => {
  it('clamps and wraps', () => {
    expect(clampIndex(-3, 10)).toBe(0)
    expect(clampIndex(4.4, 10)).toBe(4)
    expect(clampIndex(12, 10)).toBe(10)
    expect(wrapIndex(-1, 19)).toBe(18)
    expect(wrapIndex(20, 19)).toBe(1)
    expect(shortestDelta(18, 1, 19)).toBe(2)
    expect(shortestDelta(1, 18, 19)).toBe(-2)
  })

  it('counts pages with the end as its own stop', () => {
    expect(pagesOf(0, 3)).toBe(1)
    expect(pagesOf(10, 3)).toBe(5) // 0 3 6 9 10
    expect(pageOf(10, 10, 3)).toBe(4)
    expect(pageTarget(4, 10, 3)).toBe(10)
    expect(pagesOf(18, 5, true, 19)).toBe(4) // wrapping: ceil(count / step)
    expect(pageTarget(3, 18, 5, true)).toBe(15)
  })

  it('steps, stops or rewinds at the ends', () => {
    expect(stepIndex(0, 1, 5, 13, false)).toBe(5)
    expect(stepIndex(10, 1, 5, 13, false)).toBe(13)
    expect(stepIndex(13, 1, 5, 13, false)).toBe(-1)
    expect(stepIndex(13, 1, 5, 13, true)).toBe(0)
    expect(stepIndex(0, -1, 5, 13, true)).toBe(13)
  })

  it('fits slots and snaps', () => {
    expect(_numberOfSlots(1280, 255, 8)).toBe(5)
    expect(_numberOfSlots(100, 255, 8)).toBe(1)
    expect(_snap(-380, 255)).toBe(-255)
    expect(nearestIndex(-400, 255)).toBe(2)
  })
})

describe('options', () => {
  it('turns app options into numbers', () => {
    expect(normalizeOptions({loop: 'infinite', wheel: true, orientation: 'vertical', effect: 'ring'})).toEqual({
      loop: 2,
      wheel: 1,
      orientation: 1,
      effect: 'ring'
    })
    expect(normalizeOptions({loop: false, animate: 4000}).loop).toBe(0)
  })

  it('picks the breakpoint for a width', () => {
    const points = normalizeBreakpoints({1024: {slots: 4}, 0: {slots: 1}, 640: {slots: 2}})
    expect(points.map(([min]) => min)).toEqual([0, 640, 1024])
    expect(breakpointFor(points, 500)).toBe(0)
    expect(breakpointFor(points, 800)).toBe(640)
    expect(breakpointFor(points, 2000)).toBe(1024)
  })
})

describe('gestures', () => {
  it('resists past either end', () => {
    expect(rubberBand(100, -1000, 0.3)).toBeCloseTo(29.1, 1)
    expect(rubberBand(-1100, -1000, 0.3)).toBeCloseTo(-1029.1, 0)
    expect(rubberTrack(-1, 10)).toBeCloseTo(-0.233, 2)
    expect(rubberTrack(5, 10)).toBe(5)
  })

  it('reads release speed from recent samples (smoothed regression)', () => {
    expect(releaseVelocity([[0, 0], [900, 0], [950, -50], [1000, -100]], 1000)).toBeCloseTo(-1, 0)
    expect(smoothVelocity([[0, 0], [0, 1], [50, 5], [100, 9]], 100)).toBeCloseTo(0.09, 1)
    expect(releaseVelocity([[0, 0]], 10)).toBe(0)
  })

  it('snaps a slow release, carries a flick', () => {
    expect(releaseIndex(2, -2 * 255 - 100, 0, 255, 13)).toBe(2)
    expect(releaseIndex(2, -2 * 255 - 140, 0, 255, 13)).toBe(3)
    expect(releaseIndex(2, -600, -3, 255, 13)).toBe(5)
    // in items: a short flick still moves one
    expect(releaseTrack(4, 4.1, 0.004, 0.002)).toBe(5)
    expect(releaseTrack(4, 4.3, 0, 0.002)).toBe(4)
    expect(releaseTrack(4, 3.4, -0.01, 0.002)).toBe(1)
  })
})

describe('effects', () => {
  it('keeps every wrapped item within half a ring of the view', () => {
    const slots = [...Array(10).keys()].map(i => wrappedSlot(i, 0, 10, 3))
    expect(Math.min(...slots)).toBe(-3)
    expect(Math.max(...slots)).toBe(6)
    expect(wrappedSlot(9, 0, 10, 3)).toBe(-1) // the last item sits before the first
    expect(wrappedSlot(0, 9, 10, 3)).toBe(10) // and the first after the last
  })

  it('windows a virtual list', () => {
    expect(virtualWindow(0, 3, 2, 100, false)).toEqual([0, 1, 2, 3, 4])
    expect(virtualWindow(0, 3, 2, 100, true)).toEqual([-2, -1, 0, 1, 2, 3, 4])
    expect(itemAt(-1, 100, true)).toBe(99)
  })

  it('fits a ring and crossfades', () => {
    expect(ringGeometry(4, 200)).toEqual({angle: 90, radius: 100})
    expect(fadeOpacity(3, 3, 10, false)).toBe(1)
    expect(fadeOpacity(4, 3.25, 10, false)).toBeCloseTo(0.25)
    expect(fadeOpacity(0, 9.5, 10, true)).toBeCloseTo(0.5)
  })
})

describe('release physics', () => {
  it('settles at an end elastically, carrying the release speed', () => {
    const g = GESTURE
    const hit = releaseGesture(0, -1.2, 0.02, 200, 5, false, true, true, g)
    expect(hit.target).toBe(0)
    expect(hit.speed).toBe(0.02)
    expect(hit.spring).toBe(true)
    // a fling that would glide well past the end runs into it and settles there
    const ok = releaseGesture(0, 2.1, 0.02, 200, 5, false, true, true, g)
    expect(ok.target).toBe(5)
    expect(ok.speed).toBe(0.02)
    expect(ok.spring).toBe(true)
    // one that stops near the end glides into it
    const near = releaseGesture(0, 4.6, 0.0004, 200, 5, false, true, true, g)
    expect(near.target).toBe(5)
    expect(near.spring).toBe(false)
    expect(carrySpeed(0.001, 200, true, g.FLICK)).toBe(null)
    expect(carrySpeed(0.004, 200, true, g.FLICK)).toBe(0.004)
  })
})

describe('gesture recognition', () => {
  it('tells a drag along the axis from a move across it', () => {
    expect(classifyMove(3, 1, 10)).toBe('wait') // too short
    expect(classifyMove(20, 5, 10)).toBe('main') // ~14°
    expect(classifyMove(5, 20, 10)).toBe('cross') // ~76°
    expect(classifyMove(12, 10, 10)).toBe('main') // ~40°: main dominates (axisBias)
    expect(classifyMove(30, 24, 10)).toBe('main') // diagonal, long enough: the larger side
    expect(Math.round(moveAngle(10, 10))).toBe(45)
    expect(classifyMove(6, 14, 10, {...GESTURE, AXIS_BIAS: 1.5})).toBe('cross')
  })

  it('names swipe directions', () => {
    expect(swipeDirection(-80, 10)).toBe('left')
    expect(swipeDirection(5, 60)).toBe('down')
  })

  it('lands a long drag where it was let go, and glides on by its speed', () => {
    // dragged three items and let go still: stays there (no sliding back)
    expect(landing(4, 6.7, 0, 200, true)).toBe(7)
    expect(landing(4, 6.3, 0, 200, false)).toBe(6)
    // a hard flick glides on: v = 4px/ms → ~8 items at default deceleration
    expect(landing(4, 5, 0.02, 200, true)).toBe(10) // long drag: smooth glide blend
    // without momentum it stops where it was let go
    expect(landing(4, 5, 0.02, 200, false)).toBe(5)
    // a short quick flick always moves one
    expect(landing(4, 4.2, 0.0025, 200, true)).toBe(5) // short drag + flick: one slide
    expect(landing(4, 4.2, 0.01, 200, true)).toBe(5) // short drag: one slide even if fast
    expect(landing(4, 3.9, -0.0025, 200, true)).toBe(3)
    // between swipeDrift and one item: must not stack glide and skip a slide
    expect(landing(4, 4.9, 0.01, 200, true)).toBe(5)
  })

  it('glides further the faster it is released, and takes longer', () => {
    expect(glideDistance(0, 200)).toBe(0)
    expect(glideDistance(0.005, 200)).toBeCloseTo(0.308, 1)
    expect(glideDistance(-0.01, 200)).toBeCloseTo(-1.216, 1)
    expect(glideDistance(1, 200)).toBe(10) // capped
    expect(glideDuration(600, 1)).toBe(600)
    expect(glideDuration(600, 9)).toBe(960)
    expect(glideDuration(600, 400)).toBe(1800)
    expect(glideDuration(0, 9)).toBe(0)
  })

  it('lands a trackpad swipe on the item it was heading for', () => {
    expect(wheelLanding(4, 4.2)).toBe(4) // a nudge: back
    expect(wheelLanding(4, 4.35)).toBe(5) // meant to go on
    expect(wheelLanding(4, 3.6)).toBe(3)
    expect(wheelLanding(4, 7.6)).toBe(8) // a long glide: the nearest
  })

  it('tells a notched mouse wheel from a trackpad', () => {
    expect(isNotchedWheel({deltaMode: 1, deltaX: 0, deltaY: 3})).toBe(true)
    expect(isNotchedWheel({deltaMode: 0, deltaX: 0, deltaY: 100})).toBe(true)
    expect(isNotchedWheel({deltaMode: 0, deltaX: 12.5, deltaY: 0.4})).toBe(false)
    expect(isNotchedWheel({deltaMode: 0, deltaX: 0, deltaY: 7})).toBe(false)
  })
})

describe('stage effects', () => {
  const context = {size: 200, count: 10, vertical: false}

  it('measures distance the short way round', () => {
    expect(signedDistance(9, 0, 10, true)).toBe(-1)
    expect(signedDistance(1, 9, 10, true)).toBe(2)
    expect(signedDistance(9, 0, 10, false)).toBe(9)
    expect(seeded(3)).toBe(seeded(3))
  })

  it('puts the current item on top', () => {
    for (const effect of ['coverflow', 'album', 'shuffle', 'flip', 'cube', 'zoom']) {
      const current = stageStyle(effect, 4, 4, true, context)
      const other = stageStyle(effect, 5, 4, true, context)
      expect(current.opacity).toBe(1)
      expect(current.zIndex).toBeGreaterThan(other.zIndex)
    }
  })

  it('album: the photo that left is gone once the move ends', () => {
    expect(albumStyle(-0.3, 2, context).opacity).toBe(1)
    expect(albumStyle(-1, 2, context).opacity).toBe(0)
  })

  it('shuffle: the leaving card swings out, then goes under the deck', () => {
    const early = shuffleStyle(-0.25, context) // out on top
    const late = shuffleStyle(-0.75, context) // coming back underneath
    expect(early.zIndex).toBeGreaterThan(1000)
    expect(late.zIndex).toBe(0)
    expect(shuffleStyle(-1, context).zIndex).toBeLessThan(1000) // at the bottom
  })

  it('flip: half way the next card shows', () => {
    expect(flipStyle(0.4, context).transform).toContain('rotateY(-72deg)')
    expect(flipStyle(1, context).opacity).toBe(0)
  })
})

describe('smooth moves', () => {
  it('a landing leaves at the release speed and arrives at rest', () => {
    const delta = 3
    const launch = 6 // speed × length
    const dt = 1e-4
    const startSpeed = (moveAt(dt, delta, launch) - moveAt(0, delta, launch)) / dt
    const endSpeed = (moveAt(1, delta, launch) - moveAt(1 - dt, delta, launch)) / dt
    expect(startSpeed).toBeCloseTo(launch, 2)
    expect(Math.abs(endSpeed)).toBeLessThan(0.01)
    expect(moveAt(1, delta, launch)).toBeCloseTo(delta)
    // never past the target when launch ≤ 3·delta
    for (let t = 0; t <= 1; t += 0.01) expect(moveAt(t, delta, 3 * delta)).toBeLessThanOrEqual(delta + 1e-9)
  })

  it('a landing from rest starts at rest; a command eases out', () => {
    expect(moveAt(0.01, 2, 0)).toBeLessThan(0.001)
    expect(moveAt(0.5, 2, null)).toBeGreaterThan(0.5) // smootherstep ease-out
  })
})

describe('presentation transitions', () => {
  const context = {size: 800, count: 5, vertical: false}

  it('wipe and iris uncover the next slide by clipping', () => {
    expect(wipeStyle(0.25, context).clipPath).toBe('inset(0 0 0 25.000%)')
    expect(irisStyle(0.5).clipPath).toBe('circle(37.500% at 50% 50%)')
    expect(wipeStyle(0, context).clipPath).toBeUndefined() // the current slide whole
    expect(irisStyle(1).opacity).toBe(0)
  })

  it('cover slides over, reveal slides away', () => {
    expect(coverStyle(0.5, context).transform).toBe('translateX(400px)')
    expect(coverStyle(0.5, context).zIndex).toBeGreaterThan(coverStyle(-0.5, context).zIndex)
    expect(revealStyle(-0.5, context).transform).toBe('translateX(-400px)')
    expect(revealStyle(-0.5, context).zIndex).toBeGreaterThan(revealStyle(0.5, context).zIndex)
  })
})

describe('loading', () => {
  it('stands skeletons in while items load', () => {
    expect(dataList({items: [1, 2], loading: false}, 4)).toEqual([1, 2])
    const stand = dataList({items: [], loading: true}, 4)
    expect(stand).toHaveLength(4)
    expect(stand.every(item => item === SKELETON)).toBe(true)
  })
})

describe('useHolo (headless)', () => {
  beforeAll(() => {
    Cyre.init()
  })

  it('puts its branch under the node it is given', () => {
    const ui = cyre.branch('ui')
    const holo = useHolo(ui || undefined, {name: 'gallery'})!
    expect(holo.path).toBe('ui/gallery')
    const strip = holo.create(null, {id: 'strip', items: items(3)})!
    expect(strip.path).toBe('ui/gallery/strip')
    holo.destroy()
  })

  it('steps and stops at the ends', async () => {
    const holo = useHolo({name: 'h1'})!
    const strip = holo.create(null, {id: 'strip', items: items(5), slots: 2})!
    expect(strip.state()).toMatchObject({index: 0, count: 5, slots: 2, atStart: true})
    strip.next()
    await tick()
    expect(strip.state()!.index).toBe(2)
    strip.next()
    strip.next()
    await tick()
    expect(strip.state()).toMatchObject({index: 3, atEnd: true}) // maxIndex = 5 - 2
    strip.goTo(1)
    await tick()
    expect(strip.state()!.index).toBe(1)
    holo.destroy()
  })

  it('wraps forward forever with loop: infinite', async () => {
    const holo = useHolo({name: 'h2'})!
    const ring = holo.create(null, {id: 'ring', items: items(4), loop: 'infinite', slots: 1})!
    const seen: number[] = []
    ring.on('change', change => seen.push(change.index))
    for (let i = 0; i < 6; i++) ring.next()
    await tick()
    expect(seen).toEqual([1, 2, 3, 0, 1, 2])
    ring.prev()
    ring.prev()
    ring.prev()
    await tick()
    expect(ring.state()!.index).toBe(3)
    holo.destroy()
  })

  it('updates items through the items channel', async () => {
    const holo = useHolo({name: 'h3'})!
    const list = holo.create(null, {id: 'list', items: items(3), key: item => item.id})!
    list.append(items(5).slice(3))
    await tick()
    expect(list.state()!.count).toBe(5)
    list.remove('i0')
    await tick()
    expect(list.items().map(item => item.id)).toEqual(['i1', 'i2', 'i3', 'i4'])
    // any part of the app can feed it by path
    await cyre.call(`${list.path}/items`, items(2))
    expect(list.state()!.count).toBe(2)
    holo.destroy()
  })

  it('keeps linked carousels on the same item', async () => {
    const holo = useHolo({name: 'h4'})!
    const a = holo.create(null, {id: 'a', items: items(6), slots: 1})!
    const b = holo.create(null, {id: 'b', items: items(6), slots: 1})!
    const unlink = holo.link(a, b, 'sync')
    a.goTo(4)
    await tick()
    expect(b.state()!.index).toBe(4)
    b.goTo(2)
    await tick()
    expect(a.state()!.index).toBe(2)
    unlink()
    a.goTo(5)
    await tick()
    expect(b.state()!.index).toBe(2)
    holo.destroy()
  })

  it('nests carousels as sub-branches and removes them with the parent', () => {
    const holo = useHolo({name: 'h5'})!
    const outer = holo.create(null, {id: 'outer', items: items(2)})!
    const inner = outer.create(null, {id: 'inner', items: items(4)})!
    expect(inner.path).toBe('h5/outer/inner')
    expect(outer.children().map(child => child.path)).toEqual(['h5/outer/inner'])
    outer.destroy()
    expect(holo.get('inner')).toBeUndefined()
    expect(cyre.call).toBeDefined()
    holo.destroy()
  })

  it('changes options in place and keeps subscribers', async () => {
    const holo = useHolo({name: 'h6'})!
    const strip = holo.create(null, {id: 'strip', items: items(8), slots: 2})!
    let changes = 0
    strip.on('change', () => changes++)
    strip.options({slots: 4})
    expect(strip.state()!.slots).toBe(4)
    strip.next()
    await tick()
    expect(strip.state()!.index).toBe(4)
    expect(changes).toBeGreaterThan(0)
    holo.destroy()
  })

  it('takes a promise of items: skeletons until it settles', async () => {
    const holo = useHolo({name: 'h8'})!
    let resolve: (list: any[]) => void = () => {}
    const later = new Promise<any[]>(r => (resolve = r))
    const list = holo.create(null, {id: 'later', items: later, placeholders: 3})!
    expect(list.state()!.count).toBe(3) // skeletons
    resolve(items(7))
    await tick()
    expect(list.state()!.count).toBe(7)
    list.loading(true, 2)
    expect(list.state()!.count).toBe(2)
    list.set(items(4))
    await tick()
    expect(list.state()!.count).toBe(4)
    holo.destroy()
  })

  it('grid and list show every item and do not move', async () => {
    const holo = useHolo({name: 'h9'})!
    const board = holo.create(null, {id: 'board', items: items(9), effect: 'grid', loop: 'infinite'})!
    expect(board.state()).toMatchObject({count: 9, slots: 9, atStart: true, atEnd: true})
    board.next()
    await tick()
    expect(board.state()!.index).toBe(0)
    board.options({effect: 'list'})
    expect(board.state()).toMatchObject({count: 9, slots: 9})
    holo.destroy()
  })

  it('a grid turns back into a strip', async () => {
    const holo = useHolo({name: 'h10'})!
    const shelf = holo.create(null, {id: 'shelf', items: items(8), effect: 'grid', slots: 3})!
    expect(shelf.state()!.slots).toBe(8)
    shelf.options({effect: 'slide', slots: 3})
    expect(shelf.state()!.slots).toBe(3)
    shelf.next()
    await tick()
    expect(shelf.state()!.index).toBe(3)
    holo.destroy()
  })

  it('a stage effect wraps and steps one item', async () => {
    const holo = useHolo({name: 'h7'})!
    const deck = holo.create(null, {id: 'deck', items: items(5), effect: 'shuffle'})!
    expect(deck.state()).toMatchObject({slots: 1, atStart: false}) // shuffle always wraps
    deck.prev()
    await tick()
    expect(deck.state()!.index).toBe(4)
    holo.destroy()
  })
})

describe('variable sizes', () => {
  const offsets = offsetsOf([560, 300, 300, 560])

  it('adds sizes into start offsets', () => {
    expect(offsets).toEqual([0, 560, 860, 1160, 1720])
  })

  it('reads a position at a fractional track and back', () => {
    expect(offsetAt(offsets, 0)).toBe(0)
    expect(offsetAt(offsets, 1.5)).toBe(710)
    expect(trackAt(offsets, 710)).toBeCloseTo(1.5)
    expect(trackAt(offsets, 1160)).toBeCloseTo(3)
  })

  it('loops: track n + i is item i again, a strip length further on', () => {
    expect(offsetAt(offsets, 4, true)).toBe(1720)
    expect(offsetAt(offsets, 5.5, true)).toBe(1720 + 710)
    expect(offsetAt(offsets, -1, true)).toBe(1160 - 1720)
    expect(trackAt(offsets, 1720 + 710, true)).toBeCloseTo(5.5)
    expect(trackAt(offsets, -560, true)).toBeCloseTo(-1)
  })

  it('a looping item sits at the copy nearest the view', () => {
    // at item 0 with an 800px view: the last item comes before the first
    expect(wrappedOffset(offsets, 0, 0, 800)).toBe(0)
    expect(wrappedOffset(offsets, 3, 0, 800)).toBe(1160 - 1720)
    // a turn on, item 0 is a strip length further
    expect(wrappedOffset(offsets, 0, 4, 800)).toBe(1720)
  })
})

describe('direction, autoHeight, pinchZoom options', () => {
  it('normalises them', () => {
    expect(normalizeOptions({direction: 'rtl'} as any).direction).toBe('rtl')
    expect(normalizeOptions({direction: 'sideways'} as any).direction).toBe('auto')
    expect(normalizeOptions({pinchZoom: true} as any).pinchZoom).toBe(3)
    expect(normalizeOptions({pinchZoom: 5} as any).pinchZoom).toBe(5)
    expect(normalizeOptions({autoHeight: true} as any).autoHeight).toBe(1)
  })
})

describe('bindings and patches (headless)', () => {
  beforeAll(() => {
    Cyre.init()
  })

  const items = (n: number) => Array.from({length: n}, (_, i) => ({id: `i${i}`, n: i}))

  it('a state is a channel on the holo branch', async () => {
    const holo = useHolo({name: 's1'})!
    const likes = holo.state('likes', 0)
    const seen: number[] = []
    likes.on(value => seen.push(value as number))
    likes.set(2)
    likes.update(n => (n as number) + 1)
    await tick()
    expect(likes.get()).toBe(3)
    expect(seen).toEqual([2, 3])
    // the same id hands back the same value, not a reset
    expect(holo.state('likes', 0).get()).toBe(3)
    holo.destroy()
  })

  it('a state made twice through createState keeps its value', () => {
    const holo = useHolo({name: 's2'})!
    createState(holo.path, 'x', 1).set(5)
    expect(createState(holo.path, 'x', 1).get()).toBe(5)
    holo.destroy()
  })

  it('patches items: insert, move, update, remove', async () => {
    const holo = useHolo({name: 's3'})!
    const strip = holo.create(null, {id: 'strip', items: items(3), key: 'id'})!
    strip.insert(1, [{id: 'new', n: 9}])
    await tick()
    expect(strip.items().map((i: any) => i.id)).toEqual(['i0', 'new', 'i1', 'i2'])
    strip.move('new', 3)
    await tick()
    expect(strip.items().map((i: any) => i.id)).toEqual(['i0', 'i1', 'i2', 'new'])
    strip.update('i1', item => ({...item, n: 42}))
    await tick()
    expect((strip.items()[1] as any).n).toBe(42)
    strip.remove('i0')
    await tick()
    expect(strip.state()!.count).toBe(3)
    holo.destroy()
  })
})

describe('router (headless)', () => {
  beforeAll(() => {
    Cyre.init()
  })

  it('segmentOf uses route() and waits while items load', async () => {
    const holo = useHolo({name: 'rt'})!
    const site = holo.create(null, {
      id: 'site',
      items: [{id: 'a', slug: 'work'}, {id: 'b', slug: 'about'}],
      key: 'id',
      route: (item: {slug: string}) => item.slug,
      slots: 1
    })!
    const path = site.path
    await tick()
    expect(segmentOf(path, 0)).toBe('work')
    expect(segmentOf(path, 1)).toBe('about')
    holoStore.updateData(path, {loading: true})
    expect(segmentOf(path, 0)).toBe('')
    holoStore.updateData(path, {loading: false})
    expect(applyRoute('/about', false)).toBe(1)
    expect(holoStore.getVirtualDom(path)!.index).toBe(1)
    expect(applyRoute('/missing', false)).toBe(0)
    holo.destroy()
  })
})

describe('per-carousel gesture', () => {
  beforeAll(() => {
    Cyre.init()
  })

  it('merges gesture options on create', () => {
    const holo = useHolo({name: 'g1'})!
    const strip = holo.create(null, {
      id: 'strip',
      items: items(2),
      flick: 0.5,
      glide: 8,
      brake: 0.007,
      gesture: {slopTouch: 20}
    })!
    const own = holoStore.getInstance(strip.path)!.meta.gesture as Record<string, number>
    expect(own.SLOP_TOUCH).toBe(20)
    expect(own.FLICK).toBe(0.5)
    expect(own.MAX_GLIDE).toBe(8)
    expect(own.DECELERATION).toBe(0.007)
    expect(gestureTuningFrom({flick: 0.4, glide: 10})).toEqual({flick: 0.4, maxGlide: 10})
    expect(applyGestureOptions({FLICK: 0.35}, {flick: 0.55})!.FLICK).toBe(0.55)
    holo.destroy()
  })
})

describe('trackpad flings and the snap curve', () => {
  it('counts shrinking events (fingers lifted) and growing ones (a new swipe)', () => {
    let state = {falling: 0, rising: 0}
    let prev = 30
    for (const size of [27, 25, 23]) {
      state = wheelTrend(prev, size, state.falling, state.rising)
      prev = size
    }
    expect(state.falling).toBe(3)
    // fingers stopping on the pad drop off sharply: not the system's momentum
    state = wheelTrend(23, 12, state.falling, state.rising)
    expect(state.falling).toBe(0)
    state = wheelTrend(4, 6, 0, 0)
    state = wheelTrend(6, 9, state.falling, state.rising)
    expect(state.rising).toBe(2)
  })

  it('a faster fling lands further', () => {
    const slow = landing(0, 2.4, 0.002, 300, true)
    const fast = landing(0, 2.4, 0.008, 300, true)
    expect(fast).toBeGreaterThan(slow)
  })

  it('a short flick moves at most one slide', () => {
    expect(landing(0, 0.4, 0.008, 300, true)).toBe(1)
  })

  it('with launch between 1.5 and 3 times the distance the move only slows down', () => {
    for (const launch of [1.5, 2, 3]) {
      let last = Infinity
      for (let t = 0; t <= 1.0001; t += 0.05) {
        const speed = (moveAt(Math.min(1, t + 0.001), 1, launch) - moveAt(t, 1, launch)) / 0.001
        expect(speed).toBeLessThanOrEqual(last + 1e-6)
        expect(moveAt(t, 1, launch)).toBeLessThanOrEqual(1.000001)
        last = speed
      }
    }
  })
})

describe('tune', () => {
  it('maps public names to the store keys and back', () => {
    expect(gestureKey('wheelFling')).toBe('WHEEL_FLING')
    expect(gestureKey('WHEEL_FLING')).toBe('WHEEL_FLING')
    expect(tuningKey('GLIDE_MAX_DURATION')).toBe('glideMaxDuration')
  })

  it('changes the page-wide numbers, skips bad ones, and resets', () => {
    const before = tune().deceleration
    const after = tune({deceleration: 0.002, wheelFling: -1, nonsense: 3} as any)
    expect(after.deceleration).toBe(0.002)
    expect(after.wheelFling).toBe(16)
    // a lower deceleration glides further (the default reads the store)
    expect(glideDistance(0.004, 300)).toBeGreaterThan(glideDistance(0.004, 300, 0.0035))
    expect(tune('reset').deceleration).toBe(before)
  })
})

describe('groups (3.6)', () => {
  const scenes = () => [
    ...['a', 'b', 'c'].map(id => ({id: `one-${id}`, act: 'Act 1'})),
    ...['a', 'b'].map(id => ({id: `two-${id}`, act: 'Act 2'})),
    ...['a', 'b', 'c', 'd'].map(id => ({id: `three-${id}`, act: 'Act 3'}))
  ]
  const make = (name: string, extra: Record<string, unknown> = {}) => {
    const holo = useHolo({name})!
    const element = document.createElement('div')
    document.body.appendChild(element)
    const board = holo.create(element, {
      id: 'board',
      items: scenes(),
      key: 'id',
      render: (item: any, _i: number, slot: HTMLElement) => void (slot.textContent = item.id),
      group: (item: any) => item.act,
      groupLabel: (key: string, list: unknown[]) => `${key} (${list.length})`,
      groups: 4,
      slots: 1,
      ...extra
    })!
    return {holo, element, board}
  }
  const wait = () => new Promise(resolve => setTimeout(resolve, 40))

  it('sorts items into a lane per group, in order, with headings', () => {
    const {holo, element, board} = make('g1')
    expect(board.groups().map(g => g.key)).toEqual(['Act 1', 'Act 2', 'Act 3'])
    expect(board.groups().map(g => g.handle.state()!.count)).toEqual([3, 2, 4])
    const shown = Array.from(element.querySelectorAll<HTMLElement>('.holo-group')).filter(s => !s.hidden)
    expect(shown.map(s => s.querySelector('.holo-group-head')!.textContent)).toEqual(['Act 1 (3)', 'Act 2 (2)', 'Act 3 (4)'])
    expect(element.querySelectorAll('.holo-group').length).toBe(4) // the spare lane waits, hidden
    holo.destroy()
  })

  it('each lane moves on its own, and the parent says which group moved', async () => {
    const {holo, board} = make('g2')
    const moved: Array<string | undefined> = []
    board.on('change', change => moved.push(change.group))
    board.group('Act 3')!.next()
    await tick()
    expect(board.group('Act 3')!.state()!.index).toBe(1)
    expect(board.group('Act 1')!.state()!.index).toBe(0)
    expect(moved).toContain('Act 3')
    holo.destroy()
  })

  it('a group keeps its lane and place when items change', async () => {
    const {holo, board} = make('g3')
    const lane = board.group('Act 3')!
    lane.next()
    await tick()
    board.set([...scenes(), {id: 'three-e', act: 'Act 3'}])
    await wait()
    expect(board.group('Act 3')!.path).toBe(lane.path)
    expect(board.group('Act 3')!.state()).toMatchObject({index: 1, count: 5})
    holo.destroy()
  })

  it('an item moving to another group moves lanes; groups follow the items order', async () => {
    const {holo, board} = make('g4')
    const list = scenes().map(item => (item.id === 'one-a' ? {...item, act: 'Act 2'} : item))
    board.set(list)
    await wait()
    expect(board.groups().map(g => g.key)).toEqual(['Act 2', 'Act 1', 'Act 3'])
    expect(board.group('Act 2')!.items().map((item: any) => item.id)).toEqual(['one-a', 'two-a', 'two-b'])
    holo.destroy()
  })

  it('more groups than lanes share the last lane', async () => {
    const {holo, board} = make('g5', {groups: 2})
    expect(board.groups().map(g => g.key)).toEqual(['Act 1', 'Act 2'])
    expect(board.group('Act 2')!.state()!.count).toBe(6) // Act 2 and Act 3
    holo.destroy()
  })

  it('the look is every lane’s: options({effect}) changes them all', () => {
    const {holo, board} = make('g6')
    board.options({effect: 'grid'})
    expect(board.groups().every(g => g.handle.element!.dataset.effect === 'grid')).toBe(true)
    expect(board.group('Act 3')!.state()).toMatchObject({count: 4, slots: 4})
    board.options({effect: 'slide', slots: 1})
    expect(board.group('Act 3')!.state()).toMatchObject({count: 4, slots: 1})
    holo.destroy()
  })

  it('a grouped carousel needs an element and items', () => {
    const holo = useHolo({name: 'g7'})!
    const headless = holo.create(null, {id: 'plain', items: scenes(), group: (item: any) => item.act})!
    expect(headless.groups()).toEqual([])
    expect(headless.state()!.count).toBe(9)
    holo.destroy()
  })
})

describe('rtl and zoom (dom)', () => {
  const make = (name: string, options: Record<string, unknown>, dir?: string) => {
    const holo = useHolo({name})!
    const room = document.createElement('div')
    if (dir) room.setAttribute('dir', dir)
    const element = document.createElement('div')
    const container = document.createElement('ul')
    container.className = 'holo-container'
    for (let i = 0; i < 4; i++) container.appendChild(document.createElement('li'))
    element.appendChild(container)
    room.appendChild(element)
    document.body.appendChild(room)
    const carousel = holo.create(element, {id: 'c', controller: true, ...options})!
    return {holo, element, carousel}
  }

  it('direction: rtl sets dir, and previous points right', () => {
    const {holo, element} = make('r1', {direction: 'rtl'})
    expect(element.getAttribute('dir')).toBe('rtl')
    expect(element.querySelector('.holo-prev')!.textContent).toBe('›')
    expect(element.querySelector('.holo-next')!.textContent).toBe('‹')
    holo.destroy()
  })

  it('takes the page direction by default', () => {
    const {holo, element} = make('r2', {}, 'rtl')
    expect(element.hasAttribute('dir')).toBe(false)
    expect(element.querySelector('.holo-prev')!.textContent).toBe('›')
    holo.destroy()
  })

  it('pinchZoom keeps the page from zooming the carousel and lets go when destroyed', () => {
    const {holo, element} = make('z1', {pinchZoom: true})
    const container = element.querySelector('.holo-container') as HTMLElement
    expect(container.style.touchAction).toBe('pan-y')
    holo.destroy()
  })
})

describe('settle curves', () => {
  it('a glide leaves at its power and slows down more and more', () => {
    const at = (t: number) => glideAt(t, 1, 4)
    expect(at(0)).toBe(0)
    expect(at(1)).toBe(1)
    expect((at(0.01) - at(0)) / 0.01).toBeCloseTo(4, 0)
    // the last fifth covers almost nothing
    expect(at(1) - at(0.8)).toBeLessThan(0.002)
  })

  it('a settle at an end comes to rest without a bounce, its overshoot capped', () => {
    const omega = 6 / 560
    // pulled 0.4 past the start, let go still: back to 0, never past it
    for (let t = 0; t <= 2000; t += 20) expect(springAt(t, -0.4, 0, omega)).toBeLessThanOrEqual(1e-9)
    expect(Math.abs(springAt(1200, -0.4, 0, omega))).toBeLessThan(0.001)
    // running into the start fast from half an item in: out at most `room` past it
    const v = springLaunch(0.5, -0.05, omega, -1, 0.2)
    expect(Math.abs(v)).toBeGreaterThan(0)
    let most = 0
    for (let t = 0; t <= 2000; t += 5) most = Math.min(most, springAt(t, 0.5, v, omega))
    expect(most).toBeLessThan(0) // it does go a little past
    expect(most).toBeGreaterThanOrEqual(-0.2 - 0.01)
  })
})

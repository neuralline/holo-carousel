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
  releaseVelocity,
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
import {classifyMove, landing, wheelLanding, swipeDirection, isNotchedWheel, moveAngle} from '../src/components/holo-touch'
import {moveAt} from '../src/components/holo-render'
import {wipeStyle, irisStyle, coverStyle, revealStyle} from '../src/components/orientation-handler'
import {SKELETON, dataList} from '../src/components/holo-essentials'
import {useHolo} from '../src/app'

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
    expect(rubberBand(100, -1000, 0.3)).toBeCloseTo(30)
    expect(rubberBand(-1100, -1000, 0.3)).toBeCloseTo(-1030)
    expect(rubberTrack(-1, 10)).toBeCloseTo(-0.3)
    expect(rubberTrack(5, 10)).toBe(5)
  })

  it('reads release speed from recent samples only', () => {
    expect(releaseVelocity([[0, 0], [900, 0], [950, -50], [1000, -100]], 1000)).toBeCloseTo(-1)
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

describe('gesture recognition', () => {
  it('tells a drag along the axis from a move across it', () => {
    expect(classifyMove(3, 1, 10)).toBe('wait') // too short
    expect(classifyMove(20, 5, 10)).toBe('main') // ~14°
    expect(classifyMove(5, 20, 10)).toBe('cross') // ~76°
    expect(classifyMove(12, 10, 10)).toBe('wait') // ~40°: diagonal, too short to tell
    expect(classifyMove(30, 24, 10)).toBe('main') // diagonal, long enough: the larger side
    expect(Math.round(moveAngle(10, 10))).toBe(45)
  })

  it('names swipe directions', () => {
    expect(swipeDirection(-80, 10)).toBe('left')
    expect(swipeDirection(5, 60)).toBe('down')
  })

  it('lands a long drag where it was let go, and glides on by its speed', () => {
    // dragged three items and let go still: stays there (no sliding back)
    expect(landing(4, 6.7, 0, 200, true)).toBe(7)
    expect(landing(4, 6.3, 0, 200, false)).toBe(6)
    // a hard flick glides on: v = 4px/ms → 16 / (2 × 0.0035) px ≈ 11 items
    expect(landing(4, 5, 0.02, 200, true)).toBe(16)
    // without momentum it stops where it was let go
    expect(landing(4, 5, 0.02, 200, false)).toBe(5)
    // a short quick flick always moves one
    expect(landing(4, 4.2, 0.002, 200, true)).toBe(5)
    expect(landing(4, 3.9, -0.002, 200, true)).toBe(3)
  })

  it('glides further the faster it is released, and takes longer', () => {
    expect(glideDistance(0, 200)).toBe(0)
    expect(glideDistance(0.005, 200)).toBeCloseTo(0.714, 2) // 1px/ms
    expect(glideDistance(-0.01, 200)).toBeCloseTo(-2.857, 2) // twice as fast, four times as far
    expect(glideDistance(1, 200)).toBe(40) // capped
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
    expect(moveAt(0.1, 2, null)).toBeGreaterThan(0.5) // ease-out leaves fast
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

  const items = (n: number) => Array.from({length: n}, (_, i) => ({id: `i${i}`, n: i}))

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

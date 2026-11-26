//src/components/holo-groups.ts

/*
    Neural Line
    Reactive carousel - groups
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import {log} from 'cyre'
import {holoStore} from '../core/state'
import {CSS_CLASSES, EVENTS} from '../config/holo-config'
import {CarouselInstance, HoloChange, HoloOptions} from '../types/interface'
import {geometryOf, keysOf} from './holo-essentials'
import {measureCarousel} from './holo-render'
import type {CreateContext} from './holo-create-element'

/*
  Groups (3.6): a data carousel with a `group` option sorts its items
  into groups - acts, seasons, categories - and shows each as a lane: a
  heading over a carousel of its own, which moves, drags and pages on its
  own. The lanes are real nested carousels (holo/<id>/<id>-<n>), so every
  effect, gesture and option works in them, and the look is the parent's:
  options({effect}) changes every lane at once and morphs every item, a
  grid or a list included (each group a section with its heading).

  The lanes are made when the carousel is - `groups` of them (default 8),
  the most groups it shows - because each lane is a Cyre branch and an app
  may lock Cyre after boot. Groups are lanes in the order they first
  appear; more groups than lanes share the last lane (and Holo says so).
*/

type Create = (element: HTMLElement | null, options: HoloOptions, context: CreateContext) => string

export interface GroupState {
  groupOf: (item: any, index: number) => string | number
  labelOf?: (key: string, items: any[]) => string
  renderHead?: (key: string, items: any[], head: HTMLElement) => void
  /** lanes made up front */
  size: number
  /** what every lane is created and reconfigured with */
  laneOptions: Partial<HoloOptions>
  lanes: string[]
  sections: HTMLElement[]
  heads: HTMLElement[]
  /** the group each lane shows ('' = none) */
  shown: string[]
  /** the items each lane was last given */
  given: unknown[][]
  warned: boolean
}

/** a grouped carousel's groups (undefined for any other carousel) */
export const groupsOf = (instance?: CarouselInstance | null): GroupState | undefined =>
  instance?.meta.groups as GroupState | undefined

// the parent's own options that are not a lane's
const PARENT_ONLY = new Set(['id', 'items', 'group', 'groupLabel', 'renderGroup', 'groups', 'route', 'hash', 'defer'])

/** the part of a carousel's options its lanes take */
export const laneOptionsOf = (options: Partial<HoloOptions>): Partial<HoloOptions> => {
  const lane: Record<string, unknown> = {}
  for (const name in options) {
    if (!PARENT_ONLY.has(name) && (options as any)[name] !== undefined) lane[name] = (options as any)[name]
  }
  return lane as Partial<HoloOptions>
}

/** mark a new carousel as grouped (before its channels and features) */
export const planGroups = (path: string, options: HoloOptions): void => {
  const instance = holoStore.getInstance(path)
  if (!instance || typeof options.group !== 'function') return
  instance.meta.groups = {
    groupOf: options.group,
    labelOf: options.groupLabel,
    renderHead: options.renderGroup,
    size: Math.max(1, Math.floor(Number(options.groups) || 8)),
    laneOptions: laneOptionsOf(options),
    lanes: [],
    sections: [],
    heads: [],
    shown: [],
    given: [],
    warned: false
  } satisfies GroupState
}

/**
 * Make a grouped carousel's lanes: a section per lane (hidden until a
 * group takes it) with its heading and its carousel. Create time only -
 * each lane is a branch.
 */
export const buildLanes = (path: string, create: Create): void => {
  const instance = holoStore.getInstance(path)
  const groups = groupsOf(instance)
  if (!instance?.Dom || !instance.data || !groups || groups.lanes.length) return
  const {data} = instance
  for (let n = 0; n < groups.size; n++) {
    const section = document.createElement('li')
    section.className = CSS_CLASSES.GROUP
    section.hidden = true
    section.setAttribute('role', 'group')
    const head = document.createElement('div')
    head.className = CSS_CLASSES.GROUP_HEAD
    const element = document.createElement('div')
    element.className = CSS_CLASSES.LANE
    section.append(head, element)
    instance.Dom.container.appendChild(section)

    const lane = create(
      element,
      {...groups.laneOptions, id: `${instance.id}-${n}`, items: [], render: data.render, key: data.key, unrender: data.unrender},
      {holo: instance.holo, parent: path}
    )
    if (!lane) {
      log.error(`@HOLO ${path}: could not make group lane ${n} (is Cyre locked? lanes are made with the carousel)`)
      section.remove()
      break
    }
    groups.lanes.push(lane)
    groups.sections.push(section)
    groups.heads.push(head)
    groups.shown.push('')
    groups.given.push([])
    // a lane's move is the parent's change too, with the group it was
    holoStore.getBranch(lane)?.on(EVENTS.CHANGE, (change: HoloChange) => {
      const key = groupsOf(holoStore.getInstance(path))?.shown[n]
      if (key) holoStore.getBranch(path)?.call(EVENTS.CHANGE, {...change, group: key})
    })
  }
}

const sameItems = (a: unknown[], b: unknown[]): boolean => a.length === b.length && a.every((item, i) => item === b[i])

/**
 * Sort the items into groups and give each lane its group's items (the
 * lanes draw and measure at once - this already runs in a frame).
 */
export const renderGroups = (path: string): void => {
  const instance = holoStore.getInstance(path)
  const groups = groupsOf(instance)
  if (!instance?.data || !groups || !groups.lanes.length) return
  const {data} = instance

  const order: string[] = []
  const members = new Map<string, unknown[]>()
  if (!data.loading) {
    data.items.forEach((item, i) => {
      const key = String(groups.groupOf(item, i))
      let list = members.get(key)
      if (!list) {
        list = []
        members.set(key, list)
        order.push(key)
      }
      list.push(item)
    })
  }
  const capacity = groups.lanes.length
  if (order.length > capacity && !groups.warned) {
    groups.warned = true
    log.warn(`@HOLO ${path}: ${order.length} groups but ${capacity} lanes - the rest share the last lane (raise the groups option)`)
  }
  // the groups that get a lane; past the capacity, the last of them takes the rest too
  const placed = order.slice(0, capacity)
  const itemsOf = (key: string, at: number): unknown[] =>
    at === capacity - 1 && order.length > capacity ? order.slice(at).flatMap(k => members.get(k)!) : members.get(key)!

  // a group keeps its lane (and where it is in it) while it stays; new groups take the free lanes
  const laneOf = new Map<string, number>()
  placed.forEach(key => {
    const n = groups.shown.indexOf(key)
    if (n >= 0) laneOf.set(key, n)
  })
  const free = groups.lanes.map((_, n) => n).filter(n => !placed.includes(groups.shown[n]))
  placed.forEach(key => {
    if (!laneOf.has(key)) laneOf.set(key, free.shift()!)
  })
  const keyOf = new Map<number, string>()
  laneOf.forEach((n, key) => keyOf.set(n, key))

  // sections in the groups' order, the unused ones after them
  const container = instance.Dom?.container
  if (container) {
    const sequence = [...placed.map(key => laneOf.get(key)!), ...free]
    sequence.forEach((n, at) => {
      const section = groups.sections[n]
      if (container.children[at] !== section) container.insertBefore(section, container.children[at] || null)
    })
  }

  groups.lanes.forEach((lanePath, n) => {
    const lane = holoStore.getInstance(lanePath)
    if (!lane?.data) return
    const key = keyOf.get(n) ?? ''
    const items = key ? itemsOf(key, placed.indexOf(key)) : []
    const section = groups.sections[n]
    // while the items load, the first lane shows the skeletons
    const loading = data.loading && n === 0

    section.hidden = !key && !loading
    section.dataset.group = key
    const moved = key !== groups.shown[n]
    const changed = !sameItems(groups.given[n], items)
    if (moved || changed) {
      const head = groups.heads[n]
      if (groups.renderHead) groups.renderHead(key, items, head)
      else head.textContent = key ? (groups.labelOf ? groups.labelOf(key, items) : key) : ''
      section.setAttribute('aria-label', head.textContent || key)
    }
    groups.shown[n] = key

    if (loading !== lane.data.loading) holoStore.updateData(lanePath, {loading})
    else if (!changed && !moved) return
    groups.given[n] = items
    holoStore.updateData(lanePath, {items: items.slice(), keys: keysOf(items, lane.data.key)})
    // a group new to this lane starts at its beginning
    if (moved) holoStore.updateVirtualDom(lanePath, {index: 0, track: 0, shown: 0})
    measureCarousel(lanePath)
  })
}

/** a grouped carousel stacks its sections; it never moves itself */
export const layoutGroups = (instance: CarouselInstance): void => {
  const groups = groupsOf(instance)
  if (!instance.Dom || !groups) return
  const {carousel, container} = instance.Dom
  carousel.style.width = ''
  carousel.style.height = ''
  container.dataset.holoLayout = 'groups'
  container.style.transition = 'none'
  container.style.transform = 'none'
  container.style.width = '100%'
  container.style.whiteSpace = 'normal'
  container.style.display = 'flex'
  container.style.flexDirection = 'column'
  container.style.gap = 'var(--holo-group-gap, 16px)'
  const count = groups.shown.filter(Boolean).length
  holoStore.updateVirtualDom(instance.path, {
    ...geometryOf(instance.virtualDom, count, Math.max(1, count), false),
    offsets: null,
    index: 0,
    track: 0,
    shown: 0,
    transformX: 0,
    transformY: 0,
    endOfSlidePosition: 0
  })
}

/** the lanes showing a group, in the order the groups show */
export const shownLanes = (groups: GroupState): number[] =>
  groups.lanes
    .map((_, n) => n)
    .filter(n => !!groups.shown[n])
    .sort((a, b) => {
      const sa = groups.sections[a]
      const sb = groups.sections[b]
      return sa.compareDocumentPosition(sb) & 4 ? -1 : 1 // 4: b follows a
    })

/** the elements a morph names: each shown group's heading and its lane's items */
export const groupMorphTargets = (instance: CarouselInstance): Array<[HTMLElement, string]> => {
  const groups = groupsOf(instance)
  if (!groups) return []
  const targets: Array<[HTMLElement, string]> = []
  groups.sections.forEach((section, n) => {
    if (section.hidden) return
    targets.push([groups.heads[n], `group-${groups.shown[n]}`])
    const container = holoStore.getDom(groups.lanes[n])?.container
    if (!container) return
    Array.from(container.children).forEach((slot, i) => {
      const element = slot as HTMLElement
      targets.push([element, element.dataset.key ?? `${n}-${i}`])
    })
  })
  return targets
}

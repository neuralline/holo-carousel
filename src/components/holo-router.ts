//src/components/holo-router.ts

/*
    Neural Line
    Reactive carousel - router
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import {log} from 'cyre'
import {holoStore} from '../core/state'
import {goTo} from './holo-essentials'
import {HoloRouterState} from '../types/interface'

/*
  Routing with carousels: a page is a slide. A carousel with `route`
  maps its slides to one path segment each - data-route on the slide,
  route(item, index) for data, or the slide's number - and a routed
  carousel inside a slide is the next segment:

    pager (route)            /work
      └ gallery (route)      /work/alpha

  Moving a carousel writes the path (a history entry, so back and
  forward move the carousels); opening a path moves them there. Hash
  paths (#/work/alpha) work anywhere; history paths (/work/alpha) need
  the server to answer every path with the page.
*/

const routerState = (): HoloRouterState => holoStore.getSystem().router

/** a slide's path segment */
export const segmentOf = (path: string, index: number): string => {
  const instance = holoStore.getInstance(path)
  if (!instance) return String(index)
  const routeOf = instance.meta.routeOf as ((item: unknown, index: number) => string) | undefined
  if (routeOf && instance.data) {
    // items still on their way (skeletons) have no segment yet
    if (instance.data.loading || index >= instance.data.items.length) return ''
    try {
      return String(routeOf(instance.data.items[index], index))
    } catch (error) {
      log.error(`@HOLO router: route() failed for item ${index} of ${path} - ${error}`)
      return String(index)
    }
  }
  const slot = instance.Dom?.container.children[index] as HTMLElement | undefined
  return slot?.dataset.route || String(index)
}

/** a slide's title, if it has one (data-title) */
const titleOf = (path: string, index: number): string | undefined => {
  const slot = holoStore.getDom(path)?.container.children[index] as HTMLElement | undefined
  return slot?.dataset.title
}

const routed = (path: string): boolean => !!holoStore.getVirtualDom(path)?.io.route

/** the routed carousel above this one, if any */
const routedParent = (path: string): string | null => {
  let parent = holoStore.getInstance(path)?.parent || null
  while (parent && !routed(parent)) parent = holoStore.getInstance(parent)?.parent || null
  return parent
}

/** routed carousels with no routed carousel above them, in page order */
const roots = (): string[] => {
  const all = holoStore.getAllInstances()
  return Object.keys(all)
    .filter(path => routed(path) && !routedParent(path) && all[path].loaded)
    .sort((a, b) => {
      const ea = all[a].Dom?.carousel
      const eb = all[b].Dom?.carousel
      if (!ea || !eb) return 0
      return ea.compareDocumentPosition(eb) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    })
}

/** the routed carousel inside slide `index` of a routed carousel */
const childIn = (path: string, index: number): string | null => {
  const slot = holoStore.getDom(path)?.container.children[index]
  if (!slot) return null
  const all = holoStore.getAllInstances()
  for (const candidate in all) {
    if (!routed(candidate) || routedParent(candidate) !== path || !all[candidate].loaded) continue
    const element = all[candidate].Dom?.carousel
    if (element && slot.contains(element)) return candidate
  }
  return null
}

/** the path the carousels show now: /segment/segment/... */
export const currentRoute = (): string => {
  const segments: string[] = []
  let at: string | null = roots()[0] || null
  while (at) {
    const index = holoStore.getVirtualDom(at)?.index ?? 0
    segments.push(segmentOf(at, index))
    at = childIn(at, index)
  }
  return '/' + segments.map(encodeURIComponent).join('/')
}

/** the path in the address bar */
export const locationRoute = (): string => {
  const {mode, base} = routerState()
  if (typeof location === 'undefined') return '/'
  if (mode === 'history') {
    const path = location.pathname.startsWith(base) ? location.pathname.slice(base.length) : location.pathname
    return '/' + path.replace(/^\/+/, '')
  }
  return location.hash.startsWith('#/') ? location.hash.slice(1) : '/'
}

/** move the carousels to a path; returns how many segments matched */
export const applyRoute = (route: string, animate = true): number => {
  const state = routerState()
  const segments = route.split('/').filter(Boolean).map(decodeURIComponent)
  let at: string | null = roots()[0] || null
  let matched = 0
  state.applying = true
  try {
    for (const segment of segments) {
      if (!at) break
      const count = holoStore.getVirtualDom(at)?.noOfChildren ?? 0
      let index = -1
      for (let i = 0; i < count; i++) {
        if (segmentOf(at, i) === segment) {
          index = i
          break
        }
      }
      if (index < 0) {
        log.debug(`@HOLO router: no slide "${segment}" in ${at}`)
        break
      }
      goTo(at, index, animate)
      matched++
      at = childIn(at, index)
    }
  } finally {
    state.applying = false
  }
  if (state.titles) updateTitle()
  return matched
}

const updateTitle = (): void => {
  const titles: string[] = []
  let at: string | null = roots()[0] || null
  while (at) {
    const index = holoStore.getVirtualDom(at)?.index ?? 0
    const title = titleOf(at, index)
    if (title) titles.push(title)
    at = childIn(at, index)
  }
  const {baseTitle} = routerState()
  document.title = [...titles.reverse(), baseTitle].filter(Boolean).join(' · ')
}

/** write the carousels' path to the address bar (a new history entry) */
export const writeRoute = (replace = false): void => {
  const state = routerState()
  if (!state.mode || state.applying || typeof history === 'undefined') return
  const route = currentRoute()
  const url =
    state.mode === 'history' ? `${state.base.replace(/\/$/, '')}${route}` : `${location.pathname}${location.search}#${route}`
  const now = state.mode === 'history' ? location.pathname : location.hash.slice(1)
  if (now === (state.mode === 'history' ? url : route)) return
  if (replace) history.replaceState({holo: route}, '', url)
  else history.pushState({holo: route}, '', url)
  if (state.titles) updateTitle()
}

export interface RouterOptions {
  /** 'hash' (#/a/b, default) or 'history' (/a/b - the server must serve the page for every path) */
  mode?: 'hash' | 'history'
  /** where the app lives, for history paths (default /) */
  base?: string
  /** set document.title from the slides' data-title */
  titles?: boolean
}

/**
 * Start routing (once per page). Carousels with `route` start it in hash
 * mode by themselves; call it to choose history mode or titles.
 */
export const startRouter = (options: RouterOptions = {}): void => {
  const state = routerState()
  if (state.mode) {
    Object.assign(state, {
      mode: options.mode || state.mode,
      base: options.base ?? state.base,
      titles: options.titles ?? state.titles
    })
    return
  }
  if (typeof window === 'undefined') return
  const mode = options.mode || 'hash'
  Object.assign(state, {
    mode,
    base: options.base || '/',
    titles: !!options.titles,
    baseTitle: document.title
  })
  const onPop = () => applyRoute(locationRoute(), true)
  // in-page links: <a href="/work/alpha" data-link> (history) or href="#/work/alpha"
  const onClick = (e: MouseEvent) => {
    const link = (e.target as Element).closest?.('a[data-link]') as HTMLAnchorElement | null
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
    const href = link.getAttribute('href') || ''
    const route = href.startsWith('#') ? href.slice(1) : href.replace(new RegExp(`^${state.base.replace(/\/$/, '')}`), '')
    e.preventDefault()
    applyRoute(route, true)
    writeRoute()
  }
  window.addEventListener(mode === 'history' ? 'popstate' : 'hashchange', onPop)
  if (mode === 'hash') window.addEventListener('popstate', onPop)
  document.addEventListener('click', onClick)
  state.cleanup = () => {
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('hashchange', onPop)
    document.removeEventListener('click', onClick)
  }
}

/**
 * A routed carousel is ready: start the router if needed and bring it to
 * the address bar's path (deep links work for carousels created late).
 */
export const routeReady = (path: string): void => {
  startRouter()
  const instance = holoStore.getInstance(path)
  const route = locationRoute()
  const matched = route !== '/' ? applyRoute(route, false) : 0
  // from now on its moves write the path (not before: its first measure
  // must not overwrite a deep link it has not read yet - nor while its
  // items are still on their way)
  if (instance && !instance.data?.loading) instance.meta.routed = true
  if (!matched && !routedParent(path)) writeRoute(true)
}

/** a routed carousel moved */
export const routeChanged = (path: string): void => {
  if (routerState().applying) return
  if (routed(path) && holoStore.getInstance(path)?.meta.routed) writeRoute()
}

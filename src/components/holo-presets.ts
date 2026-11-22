//src/components/holo-presets.ts

/*
    Neural Line
    Reactive carousel - presets
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

import {log} from 'cyre'
import {holoStore} from '../core/state'
import holoCreateElement from './holo-create-element'
import {EVENTS} from '../config/holo-config'
import {HoloChange, HoloOptions} from '../types/interface'

/*
  Tabs, a stepper and a pager are carousels: the same model (an index
  over a sequence), the same channels, gestures and motion - with their
  own controls and roles. Each returns the carousel's path.
*/

type Cleanup = () => void

const listen = (target: EventTarget, type: string, handler: (e: any) => void): Cleanup => {
  target.addEventListener(type, handler)
  return () => target.removeEventListener(type, handler)
}

/** the carousel element in a wrapper: an existing .holo-carousel, or a new one for data */
const carouselIn = (wrapper: HTMLElement, data: boolean): HTMLElement | null => {
  const found = wrapper.querySelector(':scope > .holo-carousel') as HTMLElement | null
  if (found) return found
  if (!data) return null
  const element = document.createElement('div')
  element.className = 'holo-carousel'
  wrapper.appendChild(element)
  return element
}

const slotsOf = (path: string): HTMLElement[] =>
  Array.from(holoStore.getDom(path)?.container.children || []) as HTMLElement[]

/** a label for item i: data-title, its first heading, or a number */
const labelOf = (slot: HTMLElement | undefined, index: number): string =>
  slot?.dataset.title ||
  slot?.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim() ||
  String(index + 1)

const register = (path: string, ids: string[]): void => {
  const branch = holoStore.getBranch(path)
  if (!branch) return
  for (const id of ids) {
    if (branch.has(id)) continue
    branch.channel({id})
    branch.on(id, () => undefined)
  }
}

const create = (
  holoPath: string,
  element: HTMLElement,
  preset: string,
  defaults: Partial<HoloOptions>,
  options: Partial<HoloOptions>,
  parent?: string | null
): string => {
  element.dataset.holoPreset = preset
  element.classList.add(`holo-${preset}`)
  return holoCreateElement(element, {...defaults, ...options}, {holo: holoPath, parent})
}

// --- tabs --------------------------------------------------------------

export interface TabsOptions<T = any> extends HoloOptions<T> {
  /** a tab's label (data mode); default: data-title or the panel's heading */
  label?: (item: T, index: number) => string
}

/**
 * Tabs: a tablist and panels. Markup: a wrapper holding an optional
 * [role=tablist] and a .holo-carousel of panels - or `items` + `render`.
 * Arrow keys, Home and End move along the tabs (WAI-ARIA tabs).
 */
export const tabs = <T>(
  holoPath: string,
  wrapper: HTMLElement,
  options: TabsOptions<T> = {},
  parent?: string | null
): string => {
  const element = carouselIn(wrapper, !!options.items || !!options.render)
  if (!element) {
    log.error('@HOLO tabs: needs a .holo-carousel inside the wrapper, or items + render')
    return ''
  }
  const {label, ...rest} = options
  const path = create(
    holoPath,
    element,
    'tabs',
    {effect: 'fade', slots: 1, loop: 0, keyboard: 0, drag: 0, controller: 0, transition: 300},
    rest as Partial<HoloOptions>,
    parent
  )
  if (!path) return ''
  const instance = holoStore.getInstance(path)!

  let list = wrapper.querySelector(':scope > [role="tablist"]') as HTMLElement | null
  const authored = !!list
  if (!list) {
    list = document.createElement('div')
    list.setAttribute('role', 'tablist')
    list.className = 'holo-tablist'
    wrapper.insertBefore(list, element)
  }
  const tablist = list
  if (instance.virtualDom.io.orientation) tablist.setAttribute('aria-orientation', 'vertical')

  const buttons = (): HTMLElement[] =>
    Array.from(tablist.querySelectorAll('[role="tab"], button')) as HTMLElement[]

  // tabs for the panels (rebuilt when a data carousel's items change)
  const build = () => {
    const panels = slotsOf(path)
    if (!authored) {
      const items = (instance.data?.items || []) as T[]
      tablist.textContent = ''
      panels.forEach((panel, i) => {
        const tab = document.createElement('button')
        tab.type = 'button'
        tab.textContent = label && instance.data ? label(items[i], i) : labelOf(panel, i)
        tablist.appendChild(tab)
      })
    }
    buttons().forEach((tab, i) => {
      const panel = panels[i]
      const tabId = tab.id || `${path.replace(/\//g, '-')}-tab-${i}`
      tab.id = tabId
      tab.setAttribute('role', 'tab')
      if (panel) {
        panel.id = panel.id || `${path.replace(/\//g, '-')}-panel-${i}`
        panel.setAttribute('data-holo-role', 'tabpanel')
        panel.setAttribute('role', 'tabpanel')
        panel.setAttribute('aria-labelledby', tabId)
        tab.setAttribute('aria-controls', panel.id)
      }
    })
    select(instance.virtualDom.index, false)
  }

  const select = (index: number, focus: boolean) => {
    buttons().forEach((tab, i) => {
      const on = i === index
      tab.setAttribute('aria-selected', String(on))
      tab.tabIndex = on ? 0 : -1
      tab.classList.toggle('holo-active', on)
      if (on && focus) tab.focus()
    })
  }

  const cleanups: Cleanup[] = [
    listen(tablist, 'click', (e: MouseEvent) => {
      const tab = (e.target as HTMLElement).closest('[role="tab"]')
      const index = buttons().indexOf(tab as HTMLElement)
      if (index >= 0) instance.branch.call(EVENTS.GO_TO, {index})
    }),
    listen(tablist, 'keydown', (e: KeyboardEvent) => {
      const all = buttons()
      const current = all.indexOf(document.activeElement as HTMLElement)
      if (current < 0) return
      const vertical = tablist.getAttribute('aria-orientation') === 'vertical'
      const keys: Record<string, number> = {
        [vertical ? 'ArrowUp' : 'ArrowLeft']: current - 1,
        [vertical ? 'ArrowDown' : 'ArrowRight']: current + 1,
        Home: 0,
        End: all.length - 1
      }
      if (!(e.key in keys)) return
      e.preventDefault()
      const index = (keys[e.key] + all.length) % all.length
      instance.branch.call(EVENTS.GO_TO, {index})
      select(index, true)
    })
  ]
  instance.meta.count = slotsOf(path).length
  const unsubscribe = instance.branch.on(EVENTS.CHANGE, (change: HoloChange) => {
    if (change.count !== instance.meta.count) {
      instance.meta.count = change.count
      build()
    } else select(change.index, false)
  }).unsubscribe
  build()

  holoStore.addLink(path, () => {
    cleanups.forEach(fn => fn())
    unsubscribe?.()
    if (!authored) tablist.remove()
  })
  return path
}

// --- stepper -----------------------------------------------------------

export interface StepperOptions<T = any> extends HoloOptions<T> {
  /** a step's label (data mode) */
  label?: (item: T, index: number) => string
  /** may the user go on from this step? false or a message stops them */
  validate?: (index: number, step: HTMLElement) => boolean | string | Promise<boolean | string>
  /** after the last step */
  onComplete?: (index: number) => void
  nextLabel?: string
  backLabel?: string
  finishLabel?: string
}

/**
 * A stepper: steps one at a time, an indicator (done, current, to come),
 * Back / Next, and a check before going on. Emits 'invalid' and
 * 'complete' on the carousel's branch.
 */
export const stepper = <T>(
  holoPath: string,
  wrapper: HTMLElement,
  options: StepperOptions<T> = {},
  parent?: string | null
): string => {
  const element = carouselIn(wrapper, !!options.items || !!options.render)
  if (!element) {
    log.error('@HOLO stepper: needs a .holo-carousel inside the wrapper, or items + render')
    return ''
  }
  const {label, validate, onComplete, nextLabel = 'Next', backLabel = 'Back', finishLabel = 'Finish', ...rest} = options
  const path = create(
    holoPath,
    element,
    'stepper',
    {effect: 'slide', slots: 1, loop: 0, drag: 0, swipe: 0, keyboard: 0, controller: 0, focus: 0},
    rest as Partial<HoloOptions>,
    parent
  )
  if (!path) return ''
  const instance = holoStore.getInstance(path)!
  register(path, ['invalid', 'complete'])

  const steps = document.createElement('ol')
  steps.className = 'holo-steps'
  wrapper.insertBefore(steps, element)

  const actions =
    (wrapper.querySelector(':scope > .holo-step-actions') as HTMLElement | null) ||
    wrapper.appendChild(Object.assign(document.createElement('div'), {className: 'holo-step-actions'}))
  const back =
    (actions.querySelector('[data-step-back]') as HTMLButtonElement | null) ||
    actions.appendChild(Object.assign(document.createElement('button'), {type: 'button', textContent: backLabel}))
  const next =
    (actions.querySelector('[data-step-next]') as HTMLButtonElement | null) ||
    actions.appendChild(Object.assign(document.createElement('button'), {type: 'button', textContent: nextLabel}))
  back.dataset.stepBack = ''
  next.dataset.stepNext = ''
  const message = document.createElement('p')
  message.className = 'holo-step-error'
  message.setAttribute('role', 'alert')
  actions.insertBefore(message, back)

  instance.meta.reached = 0 // the furthest step reached: done steps can be revisited
  const reached = () => instance.meta.reached as number
  const render = () => {
    const vd = holoStore.getVirtualDom(path)
    if (!vd) return
    const panels = slotsOf(path)
    const items = (instance.data?.items || []) as T[]
    steps.textContent = ''
    panels.forEach((panel, i) => {
      panel.setAttribute('data-holo-role', 'step')
      panel.setAttribute('role', 'group')
      panel.setAttribute('aria-label', `Step ${i + 1} of ${panels.length}`)
      const step = document.createElement('li')
      const text = label && instance.data ? label(items[i], i) : labelOf(panel, i)
      const state = i < vd.index ? 'done' : i === vd.index ? 'current' : 'todo'
      step.dataset.state = state
      step.dataset.index = String(i)
      if (state === 'current') step.setAttribute('aria-current', 'step')
      const mark = document.createElement('button')
      mark.type = 'button'
      mark.disabled = i > reached()
      mark.textContent = text
      step.appendChild(mark)
      steps.appendChild(step)
    })
    back.disabled = vd.index <= 0
    next.textContent = vd.index >= panels.length - 1 ? finishLabel : nextLabel
  }

  const fail = (index: number, why: boolean | string) => {
    message.textContent = typeof why === 'string' ? why : ''
    slotsOf(path)[index]?.setAttribute('aria-invalid', 'true')
    instance.branch.call('invalid', {index, message: message.textContent})
  }

  const goOn = async () => {
    const vd = holoStore.getVirtualDom(path)
    if (!vd) return
    const index = vd.index
    const step = slotsOf(path)[index]
    message.textContent = ''
    step?.removeAttribute('aria-invalid')
    if (validate && step) {
      next.disabled = true
      try {
        const verdict = await validate(index, step)
        if (verdict !== true) {
          fail(index, verdict)
          return
        }
      } finally {
        next.disabled = false
      }
    }
    if (index >= slotsOf(path).length - 1) {
      instance.branch.call('complete', {index})
      onComplete?.(index)
      return
    }
    instance.meta.reached = Math.max(reached(), index + 1)
    instance.branch.call(EVENTS.GO_TO, {index: index + 1})
  }

  const cleanups: Cleanup[] = [
    listen(next, 'click', () => void goOn()),
    listen(back, 'click', () => {
      message.textContent = ''
      instance.branch.call(EVENTS.PREV_SLIDE)
    }),
    listen(steps, 'click', (e: MouseEvent) => {
      const step = (e.target as HTMLElement).closest('li') as HTMLElement | null
      const index = Number(step?.dataset.index ?? -1)
      if (index >= 0 && index <= reached()) instance.branch.call(EVENTS.GO_TO, {index})
    })
  ]
  const unsubscribe = instance.branch.on(EVENTS.CHANGE, render).unsubscribe
  render()

  holoStore.addLink(path, () => {
    cleanups.forEach(fn => fn())
    unsubscribe?.()
    steps.remove()
    message.remove()
  })
  return path
}

// --- pager -------------------------------------------------------------

/**
 * A pager: full-page sections, one screen each, moved by the wheel, a
 * trackpad, swipes, keys (PageUp/PageDown, Space, arrows) and dots.
 * Carousels inside a section run across it; a vertical drag at their
 * edge goes back to the pager.
 */
export const pager = <T>(
  holoPath: string,
  element: HTMLElement,
  options: HoloOptions<T> = {},
  parent?: string | null
): string =>
  create(
    holoPath,
    element,
    'pager',
    {
      orientation: 'vertical',
      slots: 1,
      wheel: 1,
      keyboard: 1,
      controller: 1,
      loop: 0,
      transition: 800,
      momentum: 0,
      focus: 0
    },
    options as Partial<HoloOptions>,
    parent
  )

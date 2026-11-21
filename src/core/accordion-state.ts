//src/core/accordion-state.ts

import {
  AccordionInstance,
  AccordionItemState,
  AccordionState,
  HoloBranch
} from '../types/interface'

// Single source of truth for every accordion instance on the page - no
// component holds its own local map, exactly like holoStore in state.ts.
let state: AccordionState = {
  root: null,
  autoInitialized: {},
  sequence: 0,
  instances: {}
}

export const accordionStore = {
  // the accordion branch every accordion's own branch sits under
  getRoot: (): HoloBranch | null => state.root,
  setRoot: (root: HoloBranch | null): void => {
    state.root = root
  },

  nextId: (): string => `accordion-${++state.sequence}`,
  markAutoInitialized: (id: string): void => {
    state.autoInitialized[id] = true
  },
  isAutoInitialized: (id: string): boolean => !!state.autoInitialized[id],

  registerInstance: (
    id: string,
    root: HTMLElement,
    items: AccordionItemState[],
    io: AccordionInstance['io'],
    branch: HoloBranch
  ): AccordionInstance => {
    const instance: AccordionInstance = {id, root, items, io, branch}

    state = {
      ...state,
      instances: {...state.instances, [id]: instance}
    }

    return instance
  },

  getInstance: (id: string): AccordionInstance | undefined =>
    state.instances[id],

  getAllInstances: (): Record<string, AccordionInstance> => state.instances,

  getBranch: (id: string): HoloBranch | undefined =>
    state.instances[id]?.branch,

  updateItem: (id: string, itemIndex: number, open: boolean): void => {
    const instance = state.instances[id]
    if (!instance) return

    const items = instance.items.map((item, index) =>
      index === itemIndex ? {...item, open} : item
    )

    state = {
      ...state,
      instances: {...state.instances, [id]: {...instance, items}}
    }
  },

  setAllItems: (id: string, open: boolean): void => {
    const instance = state.instances[id]
    if (!instance) return

    const items = instance.items.map(item => ({...item, open}))

    state = {
      ...state,
      instances: {...state.instances, [id]: {...instance, items}}
    }
  },

  setCleanup: (id: string, cleanup: () => void): void => {
    const instance = state.instances[id]
    if (instance) instance.cleanup = cleanup
  },

  // Tear down one accordion's branch (and every channel registered on it)
  // and drop it from the store - the accordion counterpart to Holo's
  // removeInstance in state.ts.
  removeInstance: (id: string): void => {
    const instance = state.instances[id]
    if (!instance) return

    instance.cleanup?.()
    instance.branch.destroy()
    delete state.autoInitialized[id]

    const nextInstances = {...state.instances}
    delete nextInstances[id]

    state = {...state, instances: nextInstances}
  }
}

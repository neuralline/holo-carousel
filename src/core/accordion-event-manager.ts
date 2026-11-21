//src/core/accordion-event-manager.ts

import {log} from 'cyre'
import {
  ACCORDION_BRANCH,
  ACCORDION_EVENTS,
  ACCORDION_REFRESH_SCREEN
} from '../config/accordion-config'
import {HoloBranch} from '../types/interface'
import {accordionStore} from './accordion-state'
import {attachBranch, CyreNode} from './event-manager'
import {
  toggleItem,
  openItem,
  closeItem,
  openAll,
  closeAll,
  renderAccordion
} from '../components/accordion-essentials'

/**
 * One page-wide channel, same role as Holo's REFRESH_SCREEN: lets a host
 * page (or a window resize) ask every accordion instance to re-measure and
 * re-render without needing to know each instance's id up front.
 */
export const initializeAccordionGlobalEvents = (
  parent?: CyreNode
): HoloBranch | null => {
  const existing = accordionStore.getRoot()
  if (existing) return existing

  const {branch: root} = attachBranch(
    ACCORDION_BRANCH,
    branch => {
      if (!branch.channel({id: ACCORDION_REFRESH_SCREEN, debounce: 100}).ok) {
        return false
      }
      branch.on(ACCORDION_REFRESH_SCREEN, () => {
        const instances = accordionStore.getAllInstances()
        for (const id in instances) renderAccordion(id)
      })
      return true
    },
    parent
  )

  if (!root) {
    log.error('@ACCORDION: could not create the accordion branch (is Cyre locked?)')
    return null
  }
  accordionStore.setRoot(root)
  return root
}

/**
 * Register one accordion instance's own channels on its own isolated
 * branch - exactly the reasoning in event-manager.ts's
 * initializeCarouselChannels: without a branch, two accordions on the same
 * page both registering 'toggle'/'open'/'close' would silently overwrite
 * each other's handler on the shared root Cyre channel, since channels are
 * global by string id.
 */
export const initializeAccordionChannels = (
  branch: HoloBranch,
  id: string
): void => {
  branch.channel([
    {id: ACCORDION_EVENTS.TOGGLE},
    {id: ACCORDION_EVENTS.OPEN},
    {id: ACCORDION_EVENTS.CLOSE},
    {id: ACCORDION_EVENTS.OPEN_ALL},
    {id: ACCORDION_EVENTS.CLOSE_ALL}
  ])

  branch.on(ACCORDION_EVENTS.TOGGLE, ({index}: {index: number}) =>
    toggleItem({id, index})
  )
  branch.on(ACCORDION_EVENTS.OPEN, ({index}: {index: number}) =>
    openItem({id, index})
  )
  branch.on(ACCORDION_EVENTS.CLOSE, ({index}: {index: number}) =>
    closeItem({id, index})
  )
  branch.on(ACCORDION_EVENTS.OPEN_ALL, () => openAll(id))
  branch.on(ACCORDION_EVENTS.CLOSE_ALL, () => closeAll(id))
}

//src/components/holo-initiate.ts

import holoCreateElement from './holo-create-element'
import {holoStore} from '../core/state'
import {CSS_CLASSES, PATH_ATTRIBUTE} from '../config/holo-config'

/**
 * Build every carousel matching `selector` inside `root` (the root too,
 * if it matches). Carousels already built are skipped, so scanning again
 * after the page changes only picks up new ones. A carousel inside
 * another one's slot is created under it (a sub-branch).
 */
const holoInitiate = (
  holo: string,
  root: ParentNode = document,
  selector = `.${CSS_CLASSES.CAROUSEL}`
): string[] => {
  const found: Element[] = []
  if (root instanceof Element && root.matches(selector)) found.push(root)
  found.push(...Array.from(root.querySelectorAll(selector)))

  const built: string[] = []
  for (const element of found) {
    const target = element as HTMLElement
    if (target.hasAttribute(PATH_ATTRIBUTE) && holoStore.hasInstance(target.getAttribute(PATH_ATTRIBUTE)!)) {
      continue
    }
    // nearest built carousel above it, in this Holo instance
    const above = target.parentElement?.closest(`[${PATH_ATTRIBUTE}]`)
    const abovePath = above?.getAttribute(PATH_ATTRIBUTE) || null
    const parent =
      abovePath && holoStore.getInstance(abovePath)?.holo === holo ? abovePath : null

    const path = holoCreateElement(target, {}, {holo, parent})
    if (path) built.push(path)
  }
  return built
}

export default holoInitiate

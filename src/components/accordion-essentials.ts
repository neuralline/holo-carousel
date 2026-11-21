//src/components/accordion-essentials.ts

import {accordionStore} from '../core/accordion-state'
import {AccordionItemState} from '../types/interface'

/**
 * Apply one item's open/closed state to the DOM. max-height (rather than
 * height: auto) is what makes the collapse animatable with a plain CSS
 * transition, and re-reading scrollHeight on every render keeps it correct
 * even if the panel's content changes size later.
 */
const applyItemDom = (item: AccordionItemState, duration: number): void => {
  item.header.setAttribute('aria-expanded', String(item.open))
  item.panel.style.transition = `max-height ${duration}ms ease, opacity ${duration}ms ease`

  if (item.open) {
    item.panel.style.maxHeight = `${item.panel.scrollHeight}px`
    item.panel.style.opacity = '1'
    item.header.classList.add('active')
  } else {
    item.panel.style.maxHeight = '0px'
    item.panel.style.opacity = '0'
    item.header.classList.remove('active')
  }
}

export const renderAccordion = (id: string): void => {
  const instance = accordionStore.getInstance(id)
  if (!instance) return
  instance.items.forEach(item => applyItemDom(item, instance.io.duration))
}

export const toggleItem = ({
  id,
  index
}: {
  id: string
  index: number
}): void => {
  const instance = accordionStore.getInstance(id)
  if (!instance) return
  const target = instance.items[index]
  if (!target) return

  if (instance.io.multiple) {
    accordionStore.updateItem(id, index, !target.open)
  } else {
    // Single-open mode: close every other item, then flip this one.
    instance.items.forEach((item, i) => {
      if (i !== index) accordionStore.updateItem(id, i, false)
    })
    accordionStore.updateItem(id, index, !target.open)
  }

  renderAccordion(id)
}

export const openItem = ({id, index}: {id: string; index: number}): void => {
  const instance = accordionStore.getInstance(id)
  if (!instance) return

  if (instance.io.multiple) {
    accordionStore.updateItem(id, index, true)
  } else {
    instance.items.forEach((_, i) =>
      accordionStore.updateItem(id, i, i === index)
    )
  }

  renderAccordion(id)
}

export const closeItem = ({id, index}: {id: string; index: number}): void => {
  accordionStore.updateItem(id, index, false)
  renderAccordion(id)
}

export const openAll = (id: string): void => {
  accordionStore.setAllItems(id, true)
  renderAccordion(id)
}

export const closeAll = (id: string): void => {
  accordionStore.setAllItems(id, false)
  renderAccordion(id)
}

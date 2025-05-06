//src/components/holo-controllers.ts

import {HoloVirtual} from '../types/interface'

/**
 * Controller for debug and status information
 * @param virtual - Virtual state
 */
const _controller = (virtual: HoloVirtual): number => {
  // Validates and logs carousel information
  if (!virtual.id) {
    console.log('Holo controller error')
    return 0
  }

  const carousel = document.getElementsByClassName('holo-controller')
  if (!carousel.length) {
    console.log('@Holo: no controller found')
    return 0
  }

  // Log controller information
  for (let i = 0; i < carousel.length; i++) {
    const slide = carousel[i] as HTMLElement
    console.log('@dataset:', slide.dataset.holo)
  }

  // Calculate and log carousel metrics
  const slides = Math.ceil(
    (virtual.container.width || 0) / (virtual.carousel.width || 1)
  )

  console.log('@holo id --------------------------')
  console.log('@holo id -', virtual.id, slides)
  console.log('@holo virtual.numberOfSlots -', virtual.numberOfSlots)
  console.log(
    '@holo x/width -',
    virtual.transformX / (virtual.carousel.width || 1)
  )
  console.log('@transformX -', virtual.transformX, virtual.transformY)
  console.log('@carousel.width -', virtual.carousel.width)
  console.log('@container.width -', virtual.container.width)

  return 1
}

export default _controller

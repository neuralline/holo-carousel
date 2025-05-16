//src/components/holo-touch-manager.ts
import Touch from './holo-touch'

const TouchManager = () => {
  document.addEventListener('mousemove', e => {
    if (Touch.pressed) {
      Touch.currentX = e.clientX
      Touch.currentY = e.clientY
    }
  })

  document.addEventListener('mouseup', e => {
    e.preventDefault()
    Touch.pressed ? Touch._touchEnd(e) : false
  })

  document.addEventListener('touchmove', e => {
    if (Touch.pressed) {
      Touch.currentX = e.touches[0].clientX
      Touch.currentY = e.touches[0].clientY
    }
  })

  document.addEventListener('touchend', e => {
    Touch.pressed ? Touch._touchEnd(e) : false
  })

  return true
}
export {TouchManager}
